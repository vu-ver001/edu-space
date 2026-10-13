package com.eduspace.backend.space;

import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.space.dto.request.SpaceCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.entity.*;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.space.repository.FacilityRepository;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceImageRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import com.eduspace.backend.space.service.SpaceService;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpaceServiceTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private SpaceTypeRepository spaceTypeRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private SpaceTableRepository spaceTableRepository;

    @Mock
    private SpaceImageRepository spaceImageRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private MaintenanceBlockRepository maintenanceBlockRepository;

    @InjectMocks
    private SpaceService spaceService;

    @Test
    @DisplayName("SP-01: Tạo WHOLE_SPACE Space thành công")
    void testCreateSpace_WholeSpace_Success() {
        SpaceType st = SpaceType.builder()
                .id(1L)
                .name("Phòng học nhóm")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();

        Facility fac = Facility.builder().id(5L).name("Máy chiếu").build();

        SpaceCreateRequestKT req = SpaceCreateRequestKT.builder()
                .name("A101")
                .spaceCode("A101")
                .spaceTypeId(1L)
                .building("A")
                .floor("1")
                .capacity(20)
                .status(SpaceStatus.AVAILABLE)
                .description("Phòng nhóm")
                .facilityIds(List.of(5L))
                .build();

        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(st));
        when(facilityRepository.findByIdAndDeletedAtIsNull(5L)).thenReturn(Optional.of(fac));
        when(spaceRepository.save(any(Space.class))).thenAnswer(i -> {
            Space s = i.getArgument(0);
            s.setId(100L);
            return s;
        });

        when(spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(100L)).thenReturn(Collections.emptyList());

        SpaceResponseKT resp = spaceService.createSpace(req);

        assertNotNull(resp);
        assertEquals(100L, resp.getId());
        assertEquals("A101", resp.getName());
        assertEquals("A101", resp.getSpaceCode());
        assertEquals(20, resp.getCapacity());
        assertEquals(BookingMode.WHOLE_SPACE, resp.getSpaceType().getBookingMode());
        assertEquals(0L, resp.getActiveSeatCount());
    }

    @Test
    @DisplayName("SP-03: SpaceType không tồn tại ném 404 SPACE_TYPE_NOT_FOUND")
    void testCreateSpace_SpaceTypeNotFound_Throws404() {
        SpaceCreateRequestKT req = SpaceCreateRequestKT.builder()
                .name("C101")
                .spaceCode("C101")
                .spaceTypeId(999L)
                .building("C")
                .floor("1")
                .capacity(10)
                .status(SpaceStatus.AVAILABLE)
                .build();

        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> spaceService.createSpace(req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("SPACE_TYPE_NOT_FOUND", ex.getCode());
    }

    @Test
    @DisplayName("UPDATE-01: Giảm capacity dưới số active seats ném 409 CAPACITY_LOWER_THAN_ACTIVE_SEATS")
    void testUpdateSpace_LowerCapacityThanSeats_Throws409() {
        SpaceType st = SpaceType.builder().id(2L).bookingMode(BookingMode.PER_SEAT).build();
        Space space = Space.builder().id(10L).name("B201").spaceCode("B201").capacity(3).spaceType(st).build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(3L);

        SpaceUpdateRequestKT updateReq = SpaceUpdateRequestKT.builder()
                .name("B201")
                .spaceCode("B201")
                .spaceTypeId(2L)
                .building("B")
                .floor("2")
                .capacity(2)
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.updateSpace(10L, updateReq));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("CAPACITY_LOWER_THAN_ACTIVE_SEATS", ex.getCode());
    }

    @Test
    @DisplayName("UPDATE-02: Đổi PER_SEAT sang WHOLE_SPACE khi có active seat ném 409 SPACE_HAS_ACTIVE_SEATS")
    void testUpdateSpace_ChangeToWholeSpaceWithActiveSeats_Throws409() {
        SpaceType perSeatType = SpaceType.builder().id(2L).bookingMode(BookingMode.PER_SEAT).build();
        SpaceType wholeType = SpaceType.builder().id(1L).bookingMode(BookingMode.WHOLE_SPACE).build();

        Space space = Space.builder().id(10L).name("B201").spaceCode("B201").capacity(10).spaceType(perSeatType).build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(3L);
        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(wholeType));

        SpaceUpdateRequestKT updateReq = SpaceUpdateRequestKT.builder()
                .name("B201")
                .spaceCode("B201")
                .spaceTypeId(1L)
                .building("B")
                .floor("2")
                .capacity(10)
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.updateSpace(10L, updateReq));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_HAS_ACTIVE_SEATS", ex.getCode());
    }

    @Test
    @DisplayName("SOFT-03: Xóa Space thì cascade soft delete tất cả Seat active thuộc Space")
    void testDeleteSpace_CascadeSoftDeleteSeats() {
        Space space = Space.builder().id(10L).name("B201").status(SpaceStatus.AVAILABLE).build();
        Seat s1 = Seat.builder().id(101L).seatCode("S01").status(SeatStatus.AVAILABLE).build();
        Seat s2 = Seat.builder().id(102L).seatCode("S02").status(SeatStatus.AVAILABLE).build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(seatRepository.findBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(List.of(s1, s2));
        when(spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(Collections.emptyList());

        spaceService.deleteSpace(10L);

        assertEquals(SpaceStatus.INACTIVE, space.getStatus());
        assertNotNull(space.getDeletedAt());

        assertEquals(SeatStatus.INACTIVE, s1.getStatus());
        assertNotNull(s1.getDeletedAt());

        assertEquals(SeatStatus.INACTIVE, s2.getStatus());
        assertNotNull(s2.getDeletedAt());

        verify(spaceRepository, times(1)).save(space);
        verify(seatRepository, times(1)).saveAll(any());
        verify(spaceTableRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("SOFT-04: Không xóa Space khi còn booking và lịch bảo trì chưa kết thúc")
    void testDeleteSpace_WithBlockingBookingsAndMaintenance_Throws409() {
        Space space = Space.builder().id(10L).name("B201").status(SpaceStatus.AVAILABLE).build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(space));
        when(bookingRepository.countBlockingBookingsForSpaceDeletion(
                eq(10L), anySet(), any(LocalDateTime.class)
        )).thenReturn(2L);
        when(maintenanceBlockRepository.countBlockingBlocksForSpaceDeletion(
                eq(10L), any(LocalDateTime.class)
        )).thenReturn(1L);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> spaceService.deleteSpace(10L)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("SPACE_HAS_ACTIVE_BOOKINGS_AND_MAINTENANCES", exception.getCode());
        assertEquals(2, exception.getDetails().size());
        assertEquals(SpaceStatus.AVAILABLE, space.getStatus());
        assertNull(space.getDeletedAt());
        verify(seatRepository, never()).findBySpaceIdAndDeletedAtIsNull(anyLong());
        verify(spaceTableRepository, never()).findBySpaceIdAndDeletedAtIsNull(anyLong());
        verify(spaceRepository, never()).save(any(Space.class));
    }

    @Test
    @DisplayName("TABLE-14: Giảm sức chứa của phòng PER_TABLE nhỏ hơn tổng capacity của active tables -> 409")
    void testUpdateSpace_PerTable_LowerCapacityThanActiveTableCapacity_Throws409() {
        SpaceType st = SpaceType.builder()
                .id(3L)
                .bookingMode(BookingMode.PER_TABLE)
                .build();

        Space space = Space.builder()
                .id(20L)
                .name("D201")
                .spaceCode("D201")
                .spaceType(st)
                .capacity(24)
                .building("Tòa D")
                .floor("2")
                .status(SpaceStatus.AVAILABLE)
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(20L)).thenReturn(Optional.of(space));
        when(spaceTableRepository.sumActiveCapacityBySpaceId(20L)).thenReturn(24);

        SpaceUpdateRequestKT req = SpaceUpdateRequestKT.builder()
                .name("D201")
                .spaceCode("D201")
                .spaceTypeId(3L)
                .building("Tòa D")
                .floor("2")
                .capacity(20) // 20 < 24 active table capacity
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.updateSpace(20L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("CAPACITY_LOWER_THAN_ACTIVE_TABLE_CAPACITY", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-15/16: Đổi SpaceType của phòng PER_TABLE khi còn active tables -> 409")
    void testUpdateSpace_PerTable_ChangeSpaceTypeWithActiveTables_Throws409() {
        SpaceType oldType = SpaceType.builder()
                .id(3L)
                .name("Phòng thảo luận")
                .bookingMode(BookingMode.PER_TABLE)
                .build();

        SpaceType newType = SpaceType.builder()
                .id(1L)
                .name("Phòng học nhóm")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();

        Space space = Space.builder()
                .id(20L)
                .name("D201")
                .spaceCode("D201")
                .spaceType(oldType)
                .capacity(24)
                .building("Tòa D")
                .floor("2")
                .status(SpaceStatus.AVAILABLE)
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(20L)).thenReturn(Optional.of(space));
        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(newType));
        when(spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(20L)).thenReturn(4L);

        SpaceUpdateRequestKT req = SpaceUpdateRequestKT.builder()
                .name("D201")
                .spaceCode("D201")
                .spaceTypeId(1L)
                .building("Tòa D")
                .floor("2")
                .capacity(24)
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.updateSpace(20L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_HAS_ACTIVE_TABLES", ex.getCode());
    }

    @Test
    @DisplayName("UPDATE-03: Trả đồng thời lỗi capacity và spaceTypeId khi cả hai cùng vi phạm")
    void testUpdateSpace_MultipleConstraintViolations_ReturnsAllFieldErrors() {
        SpaceType perTableType = SpaceType.builder()
                .id(3L)
                .bookingMode(BookingMode.PER_TABLE)
                .build();
        SpaceType wholeSpaceType = SpaceType.builder()
                .id(1L)
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();
        Space space = Space.builder()
                .id(20L)
                .name("D201")
                .spaceCode("D201")
                .spaceType(perTableType)
                .capacity(24)
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(20L)).thenReturn(Optional.of(space));
        when(spaceTableRepository.sumActiveCapacityBySpaceId(20L)).thenReturn(24);
        when(spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(20L)).thenReturn(4L);
        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(wholeSpaceType));

        SpaceUpdateRequestKT request = SpaceUpdateRequestKT.builder()
                .name("D201")
                .spaceCode("D201")
                .spaceTypeId(1L)
                .building("Tòa D")
                .floor("2")
                .capacity(20)
                .status(SpaceStatus.AVAILABLE)
                .build();

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> spaceService.updateSpace(20L, request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("SPACE_UPDATE_CONSTRAINT_VIOLATIONS", exception.getCode());
        assertEquals(2, exception.getDetails().size());
        assertTrue(exception.getDetails().stream().anyMatch(detail -> detail.toString().startsWith("capacity: ")));
        assertTrue(exception.getDetails().stream().anyMatch(detail -> detail.toString().startsWith("spaceTypeId: ")));
    }

    @Test
    @DisplayName("TABLE-20: Xóa Space thì cascade soft delete tất cả Table active thuộc Space")
    void testDeleteSpace_CascadeSoftDeleteTables() {
        Space space = Space.builder().id(30L).name("D202").status(SpaceStatus.AVAILABLE).build();
        SpaceTable t1 = SpaceTable.builder().id(201L).tableCode("T01").capacity(6).status(SpaceTableStatus.AVAILABLE).build();
        SpaceTable t2 = SpaceTable.builder().id(202L).tableCode("T02").capacity(6).status(SpaceTableStatus.AVAILABLE).build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(30L)).thenReturn(Optional.of(space));
        when(seatRepository.findBySpaceIdAndDeletedAtIsNull(30L)).thenReturn(Collections.emptyList());
        when(spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(30L)).thenReturn(List.of(t1, t2));

        spaceService.deleteSpace(30L);

        assertEquals(SpaceStatus.INACTIVE, space.getStatus());
        assertNotNull(space.getDeletedAt());

        assertEquals(SpaceTableStatus.INACTIVE, t1.getStatus());
        assertNotNull(t1.getDeletedAt());

        assertEquals(SpaceTableStatus.INACTIVE, t2.getStatus());
        assertNotNull(t2.getDeletedAt());

        verify(spaceRepository, times(1)).save(space);
        verify(spaceTableRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("CODE-01: Tạo Space với spaceCode đã tồn tại ném 409 SPACE_CODE_EXISTS")
    void testCreateSpace_DuplicateSpaceCode_Throws409() {
        SpaceType st = SpaceType.builder().id(1L).build();
        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(st));
        when(spaceRepository.existsBySpaceCodeIgnoreCaseAndDeletedAtIsNull("G-101")).thenReturn(true);

        SpaceCreateRequestKT req = SpaceCreateRequestKT.builder()
                .name("Phòng G-101")
                .spaceCode("G-101")
                .spaceTypeId(1L)
                .building("Tòa A")
                .floor("1")
                .capacity(10)
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.createSpace(req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_CODE_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("CODE-02: Cập nhật Space với spaceCode trùng với phòng khác ném 409 SPACE_CODE_EXISTS")
    void testUpdateSpace_DuplicateSpaceCode_Throws409() {
        Space space = Space.builder().id(1L).name("Phòng G-101").spaceCode("G-101").status(SpaceStatus.AVAILABLE).build();
        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));
        when(spaceRepository.existsBySpaceCodeIgnoreCaseAndIdNotAndDeletedAtIsNull("G-102", 1L)).thenReturn(true);

        SpaceUpdateRequestKT req = SpaceUpdateRequestKT.builder()
                .name("Phòng G-101 Mới")
                .spaceCode("G-102")
                .spaceTypeId(1L)
                .building("Tòa A")
                .floor("1")
                .capacity(10)
                .status(SpaceStatus.AVAILABLE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceService.updateSpace(1L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_CODE_EXISTS", ex.getCode());
    }
}
