package com.eduspace.backend.space;

import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.dto.request.SpaceTableCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTableUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTableResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.entity.SpaceTableStatus;
import com.eduspace.backend.space.entity.SpaceType;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.service.SpaceTableService;
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
class SpaceTableServiceTest {

    @Mock
    private SpaceTableRepository spaceTableRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @InjectMocks
    private SpaceTableService spaceTableService;

    private Space createPerTableSpace(Long id, int capacity) {
        SpaceType st = SpaceType.builder()
                .id(5L)
                .name("Phòng thảo luận")
                .bookingMode(BookingMode.PER_TABLE)
                .build();

        return Space.builder()
                .id(id)
                .name("D201")
                .spaceType(st)
                .capacity(capacity)
                .build();
    }

    @Test
    @DisplayName("TABLE-03: Tạo Table cho phòng PER_TABLE thành công")
    void testCreateTable_Success() {
        Space space = createPerTableSpace(1L, 24);
        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));
        when(spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(1L, "T01")).thenReturn(false);
        when(spaceTableRepository.sumActiveCapacityBySpaceId(1L)).thenReturn(0);

        SpaceTable saved = SpaceTable.builder()
                .id(10L)
                .space(space)
                .tableCode("T01")
                .capacity(6)
                .status(SpaceTableStatus.AVAILABLE)
                .description("Bàn 6 chỗ")
                .build();
        when(spaceTableRepository.save(any(SpaceTable.class))).thenReturn(saved);

        SpaceTableCreateRequestKT req = SpaceTableCreateRequestKT.builder()
                .tableCode("T01")
                .capacity(6)
                .description("Bàn 6 chỗ")
                .build();

        SpaceTableResponseKT res = spaceTableService.createTable(1L, req);

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals("T01", res.getTableCode());
        assertEquals(6, res.getCapacity());
        assertEquals(SpaceTableStatus.AVAILABLE, res.getStatus());
        verify(spaceTableRepository, times(1)).save(any(SpaceTable.class));
    }

    @Test
    @DisplayName("TABLE: Tạo Table khi Space không tồn tại ném 404 SPACE_NOT_FOUND")
    void testCreateTable_SpaceNotFound_Throws404() {
        when(spaceRepository.findByIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        SpaceTableCreateRequestKT req = SpaceTableCreateRequestKT.builder()
                .tableCode("T01")
                .capacity(6)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.createTable(999L, req));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("SPACE_NOT_FOUND", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-10/11: Tạo Table trong phòng WHOLE_SPACE hoặc PER_SEAT ném 400 SPACE_DOES_NOT_SUPPORT_TABLES")
    void testCreateTable_WrongBookingMode_Throws400() {
        SpaceType st = SpaceType.builder()
                .id(1L)
                .name("Phòng học nhóm")
                .bookingMode(BookingMode.WHOLE_SPACE)
                .build();

        Space space = Space.builder()
                .id(1L)
                .name("A101")
                .spaceType(st)
                .capacity(10)
                .build();

        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));

        SpaceTableCreateRequestKT req = SpaceTableCreateRequestKT.builder()
                .tableCode("T01")
                .capacity(4)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.createTable(1L, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("SPACE_DOES_NOT_SUPPORT_TABLES", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-07: Trùng tableCode trong cùng Space ném 409 TABLE_CODE_EXISTS")
    void testCreateTable_DuplicateCode_Throws409() {
        Space space = createPerTableSpace(1L, 24);
        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));
        when(spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(1L, "T01")).thenReturn(true);

        SpaceTableCreateRequestKT req = SpaceTableCreateRequestKT.builder()
                .tableCode("T01")
                .capacity(6)
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.createTable(1L, req));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("TABLE_CODE_EXISTS", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-12: Tổng capacity bàn vượt quá Space.capacity ném 400 SPACE_TABLE_CAPACITY_REACHED")
    void testCreateTable_CapacityOverflow_Throws400() {
        Space space = createPerTableSpace(1L, 24);
        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));
        when(spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(1L, "T05")).thenReturn(false);
        when(spaceTableRepository.sumActiveCapacityBySpaceId(1L)).thenReturn(24); // Đã đủ 24/24

        SpaceTableCreateRequestKT req = SpaceTableCreateRequestKT.builder()
                .tableCode("T05")
                .capacity(4) // 24 + 4 = 28 > 24
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.createTable(1L, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("SPACE_TABLE_CAPACITY_REACHED", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-04: Lấy danh sách bàn theo Space")
    void testGetTablesBySpace_Success() {
        Space space = createPerTableSpace(1L, 24);
        when(spaceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(space));

        SpaceTable t1 = SpaceTable.builder().id(1L).space(space).tableCode("T01").capacity(6).status(SpaceTableStatus.AVAILABLE).build();
        SpaceTable t2 = SpaceTable.builder().id(2L).space(space).tableCode("T02").capacity(6).status(SpaceTableStatus.AVAILABLE).build();
        when(spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(1L)).thenReturn(List.of(t1, t2));

        List<SpaceTableResponseKT> list = spaceTableService.getTablesBySpace(1L);
        assertEquals(2, list.size());
        assertEquals("T01", list.get(0).getTableCode());
        assertEquals("T02", list.get(1).getTableCode());
    }

    @Test
    @DisplayName("TABLE-05: Lấy chi tiết bàn theo ID thành công & không tìm thấy ném 404")
    void testGetTableById_SuccessAndNotFound() {
        Space space = createPerTableSpace(1L, 24);
        SpaceTable table = SpaceTable.builder().id(10L).space(space).tableCode("T01").capacity(6).status(SpaceTableStatus.AVAILABLE).build();

        when(spaceTableRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(table));
        when(spaceTableRepository.findByIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        SpaceTableResponseKT res = spaceTableService.getTableById(10L);
        assertNotNull(res);
        assertEquals("T01", res.getTableCode());

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.getTableById(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("TABLE_NOT_FOUND", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-06: Cập nhật thông tin Table thành công")
    void testUpdateTable_Success() {
        Space space = createPerTableSpace(1L, 24);
        SpaceTable table = SpaceTable.builder().id(10L).space(space).tableCode("T01").capacity(6).status(SpaceTableStatus.AVAILABLE).build();

        when(spaceTableRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(table));
        when(spaceTableRepository.sumActiveCapacityBySpaceId(1L)).thenReturn(24);
        when(spaceTableRepository.save(any(SpaceTable.class))).thenReturn(table);

        SpaceTableUpdateRequestKT req = SpaceTableUpdateRequestKT.builder()
                .tableCode("T01")
                .capacity(6)
                .status(SpaceTableStatus.AVAILABLE)
                .description("Bàn cập nhật")
                .build();

        SpaceTableResponseKT res = spaceTableService.updateTable(10L, req);
        assertNotNull(res);
        assertEquals("T01", res.getTableCode());
        verify(spaceTableRepository, times(1)).save(table);
    }

    @Test
    @DisplayName("TABLE-13: Cập nhật Table làm vượt quá sức chứa Space ném 400 SPACE_TABLE_CAPACITY_REACHED")
    void testUpdateTable_CapacityOverflow_Throws400() {
        Space space = createPerTableSpace(1L, 24);
        SpaceTable table = SpaceTable.builder().id(10L).space(space).tableCode("T01").capacity(4).status(SpaceTableStatus.AVAILABLE).build();

        when(spaceTableRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(table));
        when(spaceTableRepository.sumActiveCapacityBySpaceId(1L)).thenReturn(24); // Đang tổng 24

        SpaceTableUpdateRequestKT req = SpaceTableUpdateRequestKT.builder()
                .tableCode("T01")
                .capacity(8) // 24 - 4 + 8 = 28 > 24
                .build();

        AppException ex = assertThrows(AppException.class, () -> spaceTableService.updateTable(10L, req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("SPACE_TABLE_CAPACITY_REACHED", ex.getCode());
    }

    @Test
    @DisplayName("TABLE-18: Soft delete Table (INACTIVE + deletedAt != null)")
    void testDeleteTable_SoftDelete() {
        Space space = createPerTableSpace(1L, 24);
        SpaceTable table = SpaceTable.builder().id(10L).space(space).tableCode("T01").capacity(6).status(SpaceTableStatus.AVAILABLE).build();

        when(spaceTableRepository.findByIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(table));

        spaceTableService.deleteTable(10L);

        assertEquals(SpaceTableStatus.INACTIVE, table.getStatus());
        assertNotNull(table.getDeletedAt());
        verify(spaceTableRepository, times(1)).save(table);
    }
}
