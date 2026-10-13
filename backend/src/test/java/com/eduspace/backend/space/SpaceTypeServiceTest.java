package com.eduspace.backend.space;

import com.eduspace.backend.space.dto.request.SpaceTypeCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTypeUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTypeResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceType;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import com.eduspace.backend.space.service.SpaceTypeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpaceTypeServiceTest {

    @Mock
    private SpaceTypeRepository spaceTypeRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private SeatRepository seatRepository;

    @Mock
    private SpaceTableRepository spaceTableRepository;

    @InjectMocks
    private SpaceTypeService spaceTypeService;

    @Test
    @DisplayName("ST-01: Tạo SpaceType WHOLE_SPACE thành công")
    void testCreateSpaceType_WholeSpace_Success() {
        SpaceTypeCreateRequestKT request = SpaceTypeCreateRequestKT.builder()
                .name("Phòng học nhóm")
                .description("Đặt toàn bộ phòng")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .requiresApproval(true)
                .build();

        when(spaceTypeRepository.existsByNameIgnoreCase("Phòng học nhóm")).thenReturn(false);
        when(spaceTypeRepository.save(any(SpaceType.class))).thenAnswer(invocation -> {
            SpaceType st = invocation.getArgument(0);
            st.setId(1L);
            return st;
        });

        SpaceTypeResponseKT response = spaceTypeService.createSpaceType(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Phòng học nhóm", response.getName());
        assertEquals(BookingMode.WHOLE_SPACE, response.getBookingMode());
        assertTrue(response.isRequiresApproval());
    }

    @Test
    @DisplayName("ST-02: Tạo SpaceType PER_SEAT thành công")
    void testCreateSpaceType_PerSeat_Success() {
        SpaceTypeCreateRequestKT request = SpaceTypeCreateRequestKT.builder()
                .name("Khu tự học")
                .description("Đặt từng chỗ ngồi")
                .bookingMode(BookingMode.PER_SEAT)
                .requiresApproval(false)
                .build();

        when(spaceTypeRepository.existsByNameIgnoreCase("Khu tự học")).thenReturn(false);
        when(spaceTypeRepository.save(any(SpaceType.class))).thenAnswer(invocation -> {
            SpaceType st = invocation.getArgument(0);
            st.setId(2L);
            return st;
        });

        SpaceTypeResponseKT response = spaceTypeService.createSpaceType(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("Khu tự học", response.getName());
        assertEquals(BookingMode.PER_SEAT, response.getBookingMode());
        assertFalse(response.isRequiresApproval());
    }

    @Test
    @DisplayName("ST-03: Trùng tên SpaceType ném lỗi 409 SPACE_TYPE_NAME_EXISTS")
    void testCreateSpaceType_DuplicateName_Throws409() {
        SpaceTypeCreateRequestKT request = SpaceTypeCreateRequestKT.builder()
                .name("Khu tự học")
                .description("Đặt từng chỗ ngồi")
                .bookingMode(BookingMode.PER_SEAT)
                .requiresApproval(false)
                .build();

        when(spaceTypeRepository.existsByNameIgnoreCase("Khu tự học")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> spaceTypeService.createSpaceType(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_TYPE_NAME_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("SOFT-04: Xóa SpaceType đang được sử dụng ném 409 SPACE_TYPE_IN_USE")
    void testDeleteSpaceType_InUse_Throws409() {
        SpaceType st = SpaceType.builder().id(1L).name("Phòng họp").build();
        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(st));
        when(spaceRepository.existsBySpaceTypeIdAndDeletedAtIsNull(1L)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> spaceTypeService.deleteSpaceType(1L));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_TYPE_IN_USE", ex.getCode());
    }

    @Test
    @DisplayName("UPDATE: Chuyển PER_SEAT sang WHOLE_SPACE khi có active seat ném 409 SPACE_TYPE_HAS_ACTIVE_SEATS")
    void testUpdateSpaceType_PerSeatToWholeSpaceWithSeats_Throws409() {
        SpaceType st = SpaceType.builder()
                .id(1L)
                .name("Phòng lab")
                .bookingMode(BookingMode.PER_SEAT)
                .build();

        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(st));

        Space sp = Space.builder().id(10L).name("Lab 1").build();
        when(spaceRepository.findAllBySpaceTypeIdAndDeletedAtIsNull(1L)).thenReturn(List.of(sp));
        when(seatRepository.countBySpaceIdAndDeletedAtIsNull(10L)).thenReturn(5L);

        SpaceTypeUpdateRequestKT updateRequest = SpaceTypeUpdateRequestKT.builder()
                .name("Phòng lab")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTypeService.updateSpaceType(1L, updateRequest));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_TYPE_HAS_ACTIVE_SEATS", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-17: Chuyển SpaceType từ PER_TABLE sang WHOLE_SPACE khi còn active table ném 409 SPACE_TYPE_HAS_ACTIVE_TABLES")
    void testUpdateSpaceType_ChangeFromPerTableWhileActiveTablesExist_Throws409() {
        SpaceType st = SpaceType.builder()
                .id(5L)
                .name("Phòng thảo luận")
                .bookingMode(BookingMode.PER_TABLE)
                .build();

        when(spaceTypeRepository.findByIdAndDeletedAtIsNull(5L)).thenReturn(Optional.of(st));

        Space sp = Space.builder().id(20L).name("D201").build();
        when(spaceRepository.findAllBySpaceTypeIdAndDeletedAtIsNull(5L)).thenReturn(List.of(sp));
        when(spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(20L)).thenReturn(4L);

        SpaceTypeUpdateRequestKT updateRequest = SpaceTypeUpdateRequestKT.builder()
                .name("Phòng thảo luận")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTypeService.updateSpaceType(5L, updateRequest));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("SPACE_TYPE_HAS_ACTIVE_TABLES", ex.getCode());
    }
}
