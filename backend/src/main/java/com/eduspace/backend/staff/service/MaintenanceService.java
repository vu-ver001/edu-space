package com.eduspace.backend.staff.service;

import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.auth.security.SecurityUtils;
import com.eduspace.backend.booking.dto.response.BookingResponse;
import com.eduspace.backend.booking.service.BookingService;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.MaintenanceBlock;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.staff.dto.request.MaintenanceCreateRequestKT;
import com.eduspace.backend.staff.dto.request.MaintenanceUpdateRequestKT;
import com.eduspace.backend.staff.dto.response.MaintenanceResponseKT;
import com.eduspace.backend.staff.entity.StaffAuditAction;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final MaintenanceBlockRepository maintenanceBlockRepository;
    private final SpaceRepository spaceRepository;
    private final BookingService bookingService;
    private final StaffAuditService staffAuditService;
    private final UserRepository userRepository;

    /**
     * Tạo khoảng bảo trì không gian học tập (Staff/Admin).
     * Bắt buộc kiểm tra:
     * 1. Không gian tồn tại và chưa bị soft-delete.
     * 2. Thời gian bắt đầu phải trước thời gian kết thúc.
     * 3. Hard-block: Không gian không có bất kỳ booking occupying nào giao thời gian (WHOLE_SPACE, PER_SEAT, PER_TABLE).
     * 4. Chống trùng lặp: Không gian không có khoảng bảo trì active nào khác giao thời gian.
     */
    @Transactional
    public MaintenanceResponseKT createMaintenance(Long spaceId, MaintenanceCreateRequestKT request) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với ID: " + spaceId));

        validateTimeRange(request.getStartTime(), request.getEndTime());

        // 1. Kiểm tra Hard-block: Booking đang chiếm chỗ (WHOLE_SPACE, PER_SEAT, PER_TABLE)
        checkOccupyingBookingConflict(spaceId, request.getStartTime(), request.getEndTime());

        // 2. Kiểm tra trùng lặp với khoảng bảo trì khác đang active
        checkMaintenanceOverlap(spaceId, null, request.getStartTime(), request.getEndTime());

        User currentUser = resolveCurrentUser();
        Long actorId = currentUser != null ? currentUser.getId() : 0L;
        String actorEmail = currentUser != null ? currentUser.getEmail() : "staff@eduspace.vn";

        MaintenanceBlock block = MaintenanceBlock.builder()
                .space(space)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .reason(request.getReason().trim())
                .createdBy(actorId)
                .build();

        MaintenanceBlock saved = maintenanceBlockRepository.save(block);

        // Ghi Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_CREATED,
                "MAINTENANCE", saved.getId(), spaceId, "Tạo bảo trì: " + request.getReason().trim());

        log.info("Staff {} đã tạo bảo trì #{} cho Space #{} từ {} đến {}",
                actorEmail, saved.getId(), spaceId, request.getStartTime(), request.getEndTime());

        return toResponse(saved, actorEmail);
    }

    /**
     * Cập nhật khoảng bảo trì.
     */
    @Transactional
    public MaintenanceResponseKT updateMaintenance(Long maintenanceId, MaintenanceUpdateRequestKT request) {
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì với ID: " + maintenanceId));

        validateTimeRange(request.getStartTime(), request.getEndTime());

        Long spaceId = block.getSpace().getId();

        // 1. Kiểm tra Hard-block với booking trong khoảng thời gian mới
        checkOccupyingBookingConflict(spaceId, request.getStartTime(), request.getEndTime());

        // 2. Kiểm tra trùng lặp với các khoảng bảo trì khác (loại trừ chính nó)
        checkMaintenanceOverlap(spaceId, maintenanceId, request.getStartTime(), request.getEndTime());

        User currentUser = resolveCurrentUser();
        Long actorId = currentUser != null ? currentUser.getId() : 0L;
        String actorEmail = currentUser != null ? currentUser.getEmail() : "staff@eduspace.vn";

        block.setStartTime(request.getStartTime());
        block.setEndTime(request.getEndTime());
        block.setReason(request.getReason().trim());

        MaintenanceBlock updated = maintenanceBlockRepository.save(block);

        // Ghi Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_UPDATED,
                "MAINTENANCE", updated.getId(), spaceId, "Cập nhật bảo trì: " + request.getReason().trim());

        log.info("Staff {} đã cập nhật bảo trì #{} cho Space #{}", actorEmail, updated.getId(), spaceId);
        return toResponse(updated, actorEmail);
    }

    /**
     * Xóa mềm khoảng bảo trì (Soft delete).
     */
    @Transactional
    public void deleteMaintenance(Long maintenanceId) {
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì với ID: " + maintenanceId));

        User currentUser = resolveCurrentUser();
        Long actorId = currentUser != null ? currentUser.getId() : 0L;
        String actorEmail = currentUser != null ? currentUser.getEmail() : "staff@eduspace.vn";

        block.setDeletedAt(LocalDateTime.now());
        maintenanceBlockRepository.save(block);

        // Ghi Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_CANCELLED,
                "MAINTENANCE", block.getId(), block.getSpace().getId(), "Hủy bảo trì #" + maintenanceId);

        log.info("Staff {} đã xóa mềm bảo trì #{}", actorEmail, maintenanceId);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceResponseKT> getMaintenanceBySpace(Long spaceId) {
        spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với ID: " + spaceId));

        return maintenanceBlockRepository.findBySpaceIdAndDeletedAtIsNullOrderByStartTimeAsc(spaceId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MaintenanceResponseKT getMaintenanceById(Long maintenanceId) {
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì với ID: " + maintenanceId));
        return toResponse(block);
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_MAINTENANCE_TIME",
                    "Thời gian bắt đầu và kết thúc bảo trì không được để trống");
        }
        if (!start.isBefore(end)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_MAINTENANCE_TIME",
                    "Thời gian bắt đầu bảo trì phải trước thời gian kết thúc");
        }
    }

    private void checkOccupyingBookingConflict(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        List<BookingResponse> occupyingBookings = bookingService.getSpaceTimeline(spaceId, startTime, endTime);
        if (!occupyingBookings.isEmpty()) {
            throw new AppException(HttpStatus.CONFLICT, "SPACE_HAS_OCCUPYING_BOOKING",
                    "Không thể tạo bảo trì vì không gian đang có " + occupyingBookings.size() +
                            " lượt đặt chỗ chiếm chỗ trong khoảng thời gian này.");
        }
    }

    private void checkMaintenanceOverlap(Long spaceId, Long excludeId, LocalDateTime startTime, LocalDateTime endTime) {
        List<MaintenanceBlock> overlaps = (excludeId != null)
                ? maintenanceBlockRepository.findOverlappingBlocksExcluding(spaceId, excludeId, startTime, endTime)
                : maintenanceBlockRepository.findOverlappingBlocks(spaceId, startTime, endTime);

        if (!overlaps.isEmpty()) {
            MaintenanceBlock conflict = overlaps.get(0);
            throw new AppException(HttpStatus.CONFLICT, "MAINTENANCE_TIME_CONFLICT",
                    "Đã có khoảng bảo trì khác trùng với thời gian này (từ " + conflict.getStartTime() +
                            " đến " + conflict.getEndTime() + ").");
        }
    }

    private User resolveCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            return null;
        }
        return userRepository.findByEmail(email).orElse(null);
    }

    private MaintenanceResponseKT toResponse(MaintenanceBlock block) {
        String creatorEmail = "staff@eduspace.vn";
        if (block.getCreatedBy() != null && block.getCreatedBy() > 0) {
            creatorEmail = userRepository.findById(block.getCreatedBy())
                    .map(User::getEmail)
                    .orElse("staff@eduspace.vn");
        }
        return toResponse(block, creatorEmail);
    }

    private MaintenanceResponseKT toResponse(MaintenanceBlock block, String creatorEmail) {
        return MaintenanceResponseKT.builder()
                .id(block.getId())
                .spaceId(block.getSpace().getId())
                .spaceName(block.getSpace().getName())
                .startTime(block.getStartTime())
                .endTime(block.getEndTime())
                .reason(block.getReason())
                .createdBy(block.getCreatedBy())
                .creatorEmail(creatorEmail)
                .createdAt(block.getCreatedAt())
                .updatedAt(block.getUpdatedAt())
                .deletedAt(block.getDeletedAt())
                .active(block.isActive())
                .build();
    }
}
