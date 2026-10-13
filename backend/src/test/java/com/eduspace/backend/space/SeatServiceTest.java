package com.eduspace.backend.space;

import com.eduspace.backend.space.dto.request.SeatBulkCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatCreateRequestKT;
import com.eduspace.backend.space.dto.response.SeatResponseKT;
import com.eduspace.backend.space.entity.*;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.service.SeatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeatServiceTest {

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @InjectMocks
    private SeatService seatService;

    @Test
    @DisplayName("SEAT-01: Tạo Seat thành công")
    void testCreateSeat_Success() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).capacity(5).spaceType(st).build();

        SeatCreateRequestKT req = SeatCreateRequestKT.builder()
                .seatCode("S01")
                .status(SeatStatus.AVAILABLE)
                .description("Gần cửa sổ")
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(10L, "S01")).thenReturn(false);
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(0L);
        when(seatRepository.save(any(Seat.class))).thenAnswer(i -> {
            Seat s = i.getArgument(0);
            s.setId(101L);
            return s;
        });

        SeatResponseKT resp = seatService.createSeat(10L, req);

        assertNotNull(resp);
        assertEquals(101L, resp.getId());
        assertEquals("S01", resp.getSeatCode());
    }

    @Test
    @DisplayName("SEAT-02: Trùng seatCode ném 409 SEAT_CODE_EXISTS")
    void testCreateSeat_DuplicateCode_Throws409() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).capacity(5).spaceType(st).build();

        SeatCreateRequestKT req = SeatCreateRequestKT.builder()
                .seatCode("S01")
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(10L, "S01")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> seatService.createSeat(10L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SEAT_CODE_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("SEAT-03: Space có bookingMode = WHOLE_SPACE không được tạo Seat ném 400 SPACE_DOES_NOT_SUPPORT_SEATS")
    void testCreateSeat_WholeSpace_Throws400() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.WHOLE_SPACE).build();
        Space space = Space.builder().id(10L).name("Phòng họp").capacity(20).spaceType(st).build();

        SeatCreateRequestKT req = SeatCreateRequestKT.builder()
                .seatCode("S01")
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));

        AppException ex = assertThrows(AppException.class, () -> seatService.createSeat(10L, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("SPACE_DOES_NOT_SUPPORT_SEATS", ex.getCode());
    }

    @Test
    @DisplayName("SEAT-04: Bulk create seats thành công")
    void testBulkCreateSeats_Success() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).capacity(5).spaceType(st).build();

        SeatBulkCreateRequestKT req = SeatBulkCreateRequestKT.builder()
                .seatCodes(List.of("S02", "S03"))
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(1L);
        when(seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(10L, "S02")).thenReturn(false);
        when(seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(10L, "S03")).thenReturn(false);
        when(seatRepository.saveAll(any())).thenAnswer(i -> {
            List<Seat> list = i.getArgument(0);
            long idGen = 102L;
            for (Seat s : list) {
                s.setId(idGen++);
            }
            return list;
        });

        List<SeatResponseKT> resp = seatService.bulkCreateSeats(10L, req);

        assertNotNull(resp);
        assertEquals(2, resp.size());
        assertEquals("S02", resp.get(0).getSeatCode());
        assertEquals("S03", resp.get(1).getSeatCode());
    }

    @Test
    @DisplayName("SEAT-05: Đạt giới hạn capacity ném 400 SPACE_SEAT_CAPACITY_REACHED")
    void testCreateSeat_CapacityReached_Throws400() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).capacity(3).spaceType(st).build();

        SeatCreateRequestKT req = SeatCreateRequestKT.builder()
                .seatCode("S04")
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(10L, "S04")).thenReturn(false);
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(3L);

        AppException ex = assertThrows(AppException.class, () -> seatService.createSeat(10L, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("SPACE_SEAT_CAPACITY_REACHED", ex.getCode());
    }

    @Test
    @DisplayName("SEAT-06: Bulk duplicate code trong request ném 409 SEAT_CODE_EXISTS")
    void testBulkCreateSeats_DuplicateInRequest_Throws409() {
        SpaceType st = SpaceType.builder().bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).capacity(10).spaceType(st).build();

        SeatBulkCreateRequestKT req = SeatBulkCreateRequestKT.builder()
                .seatCodes(List.of("A01", "A01"))
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));

        AppException ex = assertThrows(AppException.class, () -> seatService.bulkCreateSeats(10L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SEAT_CODE_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("SOFT-01: Soft delete Seat chuyển status INACTIVE và deletedAt != null")
    void testDeleteSeat_SoftDelete() {
        Seat seat = Seat.builder().id(101L).seatCode("S01").status(SeatStatus.AVAILABLE).build();
        when(seatRepository.findByIdAndDeletedAtIsNull(101L)).thenReturn(Optional.of(seat));

        seatService.deleteSeat(101L);

        assertEquals(SeatStatus.INACTIVE, seat.getStatus());
        assertNotNull(seat.getDeletedAt());
        verify(seatRepository, times(1)).save(seat);
    }
}
