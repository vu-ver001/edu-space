package com.eduspace.backend.space.service;

import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.dto.request.SpaceTableCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTableUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTableResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.entity.SpaceTableStatus;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceTableService {

    private final SpaceTableRepository spaceTableRepository;
    private final SpaceRepository spaceRepository;
    private final BookingRepository bookingRepository;

    private static final java.util.Set<BookingStatus> DELETE_BLOCKING_STATUSES = java.util.Set.of(
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    // Lấy danh sách toàn bộ bàn trong không gian (phòng)
    @Transactional(readOnly = true)
    public List<SpaceTableResponseKT> getTablesBySpace(Long spaceId) {
        // 1. Kiểm tra phòng này có thuộc kiểu đặt theo bàn (PER_TABLE) không
        validateSpaceSupportsTables(spaceId);
        // 2. Lấy danh sách bàn chưa bị xóa mềm và đổi sang DTO Response
        return spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(spaceId).stream()
                .map(SpaceTableResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    // Lấy thông tin chi tiết một bàn theo ID
    @Transactional(readOnly = true)
    public SpaceTableResponseKT getTableById(Long tableId) {
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));
        return SpaceTableResponseKT.fromEntity(table);
    }

    // Tạo mới một bàn trong phòng (kiểm tra trùng mã bàn và giới hạn sức chứa)
    @Transactional
    public SpaceTableResponseKT createTable(Long spaceId, SpaceTableCreateRequestKT request) {
        // 1. Kiểm tra phòng có tồn tại và hỗ trợ đặt theo bàn không
        Space space = validateSpaceSupportsTables(spaceId);

        // 2. Kiểm tra mã bàn và sức chứa không được để trống / không hợp lệ
        String tableCode = request.getTableCode() != null ? request.getTableCode().trim() : "";
        if (tableCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã bàn không được để trống.");
        }

        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Sức chứa bàn phải lớn hơn 0.");
        }

        // 3. Kiểm tra trùng mã bàn trong cùng một phòng
        if (spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(spaceId, tableCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + tableCode + "' đã tồn tại trong không gian này."
            );
        }

        // 4. RÀNG BUỘC SỨC CHỨA: Tổng sức chứa các bàn không được vượt quá sức chứa tối đa của phòng
        int currentTotalCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(spaceId);
        if (currentTotalCapacity + request.getCapacity() > space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_TABLE_CAPACITY_REACHED",
                    "Không thể tạo thêm bàn: Tổng sức chứa các bàn (" + (currentTotalCapacity + request.getCapacity()) +
                            ") sẽ vượt quá sức chứa tối đa của không gian (" + space.getCapacity() + " chỗ)."
            );
        }

        // 5. Tạo Entity SpaceTable và lưu vào database
        SpaceTable table = SpaceTable.builder()
                .space(space)
                .tableCode(tableCode)
                .capacity(request.getCapacity())
                .status(request.getStatus() != null ? request.getStatus() : SpaceTableStatus.AVAILABLE)
                .description(request.getDescription())
                .build();

        try {
            return SpaceTableResponseKT.fromEntity(spaceTableRepository.save(table));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + tableCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    // Cập nhật thông tin bàn (kiểm tra trùng mã mới và tính lại tổng sức chứa phòng)
    @Transactional
    public SpaceTableResponseKT updateTable(Long tableId, SpaceTableUpdateRequestKT request) {
        // 1. Tìm bàn cần cập nhật
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));

        // 2. Kiểm tra mã bàn và sức chứa
        String newCode = request.getTableCode() != null ? request.getTableCode().trim() : "";
        if (newCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã bàn không được để trống.");
        }

        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Sức chứa bàn phải lớn hơn 0.");
        }

        // 3. Nếu đổi mã bàn mới, kiểm tra có bị trùng với bàn khác trong cùng phòng không
        if (!newCode.equalsIgnoreCase(table.getTableCode())) {
            if (spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(table.getSpace().getId(), newCode)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "TABLE_CODE_EXISTS",
                        "Mã bàn '" + newCode + "' đã tồn tại trong không gian này."
                );
            }
            table.setTableCode(newCode);
        }

        // 4. Tính lại tổng sức chứa mới sau khi đổi sức chứa của bàn này
        int currentTotalCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(table.getSpace().getId());
        int newTotalCapacity = currentTotalCapacity - table.getCapacity() + request.getCapacity();
        if (newTotalCapacity > table.getSpace().getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_TABLE_CAPACITY_REACHED",
                    "Không thể cập nhật bàn: Tổng sức chứa các bàn (" + newTotalCapacity +
                            ") sẽ vượt quá sức chứa tối đa của không gian (" + table.getSpace().getCapacity() + " chỗ)."
            );
        }
        table.setCapacity(request.getCapacity());

        if (request.getStatus() != null) {
            table.setStatus(request.getStatus());
        }
        if (request.getDescription() != null) {
            table.setDescription(request.getDescription());
        }

        try {
            return SpaceTableResponseKT.fromEntity(spaceTableRepository.save(table));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + newCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    // Xóa mềm bàn (chặn xóa nếu bàn đang có sinh viên đặt chưa kết thúc)
    @Transactional
    public void deleteTable(Long tableId) {
        // 1. Tìm bàn cần xóa
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));

        // 2. Chặn xóa nếu bàn đang có booking chưa kết thúc
        LocalDateTime now = LocalDateTime.now();
        long blockingCount = bookingRepository.countBlockingBookingsForTableDeletion(
                tableId,
                DELETE_BLOCKING_STATUSES,
                now
        );
        if (blockingCount > 0) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_HAS_ACTIVE_BOOKINGS",
                    "Không thể xóa bàn '" + table.getTableCode() + "' vì đang có "
                            + blockingCount + " booking chưa kết thúc."
            );
        }

        // 3. Xóa mềm (đổi sang INACTIVE và set deleted_at = now)
        table.setStatus(SpaceTableStatus.INACTIVE);
        table.setDeletedAt(now);
        spaceTableRepository.save(table);
    }

    // Hàm kiểm tra phòng có tồn tại và có hình thức đặt là PER_TABLE hay không
    private Space validateSpaceSupportsTables(Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + spaceId
                ));

        if (space.getSpaceType() == null ||
                space.getSpaceType().getBookingMode() != BookingMode.PER_TABLE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_DOES_NOT_SUPPORT_TABLES",
                    "Không gian '" + space.getName() + "' có kiểu đặt " +
                            (space.getSpaceType() != null ? space.getSpaceType().getBookingMode() : "N/A") +
                            ", không hỗ trợ quản lý bàn (tables)."
            );
        }

        return space;
    }
}
