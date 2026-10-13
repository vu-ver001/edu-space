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
import com.eduspace.backend.staff.exception.MaintenanceBookingConflictExceptionKT;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    // Tạo mới khoảng bảo trì cho phòng (kiểm tra xung đột với lịch đặt của sinh viên)
    @Transactional
    public MaintenanceResponseKT createMaintenance(Long spaceId, MaintenanceCreateRequestKT request) {
        // 1. Kiểm tra không gian (phòng) có tồn tại và chưa bị xóa mềm
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian yêu cầu."));

        // 2. Validate thời gian hợp lệ (bắt đầu trước kết thúc, bắt đầu không ở quá khứ)
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateStartTimeNotInPast(request.getStartTime(), LocalDateTime.now());

        // 3. HARD-BLOCK: Kiểm tra xung đột với Booking của sinh viên (WHOLE_SPACE, PER_SEAT, PER_TABLE)
        checkOccupyingBookingConflict(spaceId, request.getStartTime(), request.getEndTime());

        // 4. Chống trùng lặp: Kiểm tra có khoảng bảo trì nào khác đang chạy cùng giờ không
        checkMaintenanceOverlap(spaceId, null, request.getStartTime(), request.getEndTime());

        // 5. Lấy thông tin Staff đang thực hiện thao tác
        User currentUser = requireCurrentUser();
        Long actorId = currentUser.getId();
        String actorEmail = currentUser.getEmail();

        // 6. Tạo Entity MaintenanceBlock và lưu vào database
        MaintenanceBlock block = MaintenanceBlock.builder()
                .space(space)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .reason(request.getReason().trim())
                .createdBy(actorId)
                .build();

        MaintenanceBlock saved = maintenanceBlockRepository.save(block);

        // 7. Ghi nhận vào nhật ký kiểm toán Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_CREATED,
                "MAINTENANCE", saved.getId(), spaceId, "Tạo bảo trì: " + request.getReason().trim());

        log.info("Staff {} đã tạo bảo trì #{} cho Space #{} từ {} đến {}",
                actorEmail, saved.getId(), spaceId, request.getStartTime(), request.getEndTime());

        return toResponse(saved, currentUser);
    }

    // Cập nhật thông tin khoảng bảo trì (kiểm tra lại xung đột theo khung giờ mới)
    @Transactional
    public MaintenanceResponseKT updateMaintenance(Long maintenanceId, MaintenanceUpdateRequestKT request) {
        // 1. Tìm khoảng bảo trì cần sửa
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì yêu cầu."));

        // 2. Chặn sửa nếu lịch bảo trì đã kết thúc trong quá khứ
        LocalDateTime now = LocalDateTime.now();
        if (!now.isBefore(block.getEndTime())) {
            throw new AppException(HttpStatus.CONFLICT, "MAINTENANCE_ALREADY_COMPLETED",
                    "Lịch bảo trì đã kết thúc nên không thể chỉnh sửa.");
        }

        boolean inProgress = !now.isBefore(block.getStartTime());
        LocalDateTime effectiveStartTime = inProgress ? block.getStartTime() : request.getStartTime();
        String effectiveReason = request.getReason().trim();

        if (!inProgress) {
            validateStartTimeNotInPast(effectiveStartTime, now);
        }

        if (inProgress && !request.getEndTime().isAfter(now)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_MAINTENANCE_END_TIME",
                    "Thời gian kết thúc mới phải sau thời điểm hiện tại.");
        }

        validateTimeRange(effectiveStartTime, request.getEndTime());

        Long spaceId = block.getSpace().getId();

        // 3. Kiểm tra Hard-block: Khung giờ mới có xung đột với booking nào của sinh viên không
        checkOccupyingBookingConflict(spaceId, effectiveStartTime, request.getEndTime());

        // 4. Kiểm tra trùng lặp với các khoảng bảo trì khác (trừ chính nó)
        checkMaintenanceOverlap(spaceId, maintenanceId, effectiveStartTime, request.getEndTime());

        User currentUser = requireCurrentUser();
        Long actorId = currentUser.getId();
        String actorEmail = currentUser.getEmail();

        // 5. Cập nhật dữ liệu mới và lưu database
        block.setStartTime(effectiveStartTime);
        block.setEndTime(request.getEndTime());
        block.setReason(effectiveReason);

        MaintenanceBlock updated = maintenanceBlockRepository.save(block);

        // 6. Ghi nhận vào Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_UPDATED,
                "MAINTENANCE", updated.getId(), spaceId,
                inProgress
                        ? "Cập nhật bảo trì đang diễn ra: kết thúc " + request.getEndTime()
                            + ", lý do: " + effectiveReason
                        : "Cập nhật bảo trì: " + effectiveReason);

        log.info("Staff {} đã cập nhật bảo trì #{} cho Space #{}", actorEmail, updated.getId(), spaceId);
        return toResponse(updated);
    }

    // Xóa mềm khoảng bảo trì (chặn xóa nếu bảo trì đang diễn ra)
    @Transactional
    public String deleteMaintenance(Long maintenanceId) {
        // 1. Tìm khoảng bảo trì cần xóa
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì yêu cầu."));

        // 2. Chặn xóa nếu lịch bảo trì đang diễn ra (in-progress)
        LocalDateTime now = LocalDateTime.now();
        boolean inProgress = !now.isBefore(block.getStartTime()) && now.isBefore(block.getEndTime());
        if (inProgress) {
            throw new AppException(HttpStatus.CONFLICT, "MAINTENANCE_IN_PROGRESS_CANNOT_DELETE",
                    "Lịch bảo trì đang diễn ra nên không thể xóa.");
        }
        boolean completed = !now.isBefore(block.getEndTime());

        User currentUser = requireCurrentUser();
        Long actorId = currentUser.getId();
        String actorEmail = currentUser.getEmail();

        // 3. Xóa mềm (gán deleted_at = now)
        block.setDeletedAt(now);
        maintenanceBlockRepository.save(block);

        // 4. Ghi nhận hành động hủy/xóa vào Staff Audit Log
        staffAuditService.logAction(actorId, actorEmail, StaffAuditAction.MAINTENANCE_CANCELLED,
                "MAINTENANCE", block.getId(), block.getSpace().getId(),
                completed
                        ? "Xóa lịch bảo trì đã kết thúc #" + maintenanceId
                        : "Hủy lịch bảo trì #" + maintenanceId);

        log.info("Staff {} đã xóa mềm bảo trì #{}", actorEmail, maintenanceId);
        return completed
                ? "Đã xóa lịch bảo trì đã kết thúc khỏi danh sách."
                : "Đã hủy lịch bảo trì thành công.";
    }

    // Lấy toàn bộ danh sách lịch bảo trì chưa bị xóa mềm
    @Transactional(readOnly = true)
    public List<MaintenanceResponseKT> getAllMaintenance() {
        List<MaintenanceBlock> blocks = maintenanceBlockRepository
                .findAllByDeletedAtIsNullOrderByStartTimeAsc();
        Map<Long, User> creators = userRepository.findAllById(
                        blocks.stream()
                                .map(MaintenanceBlock::getCreatedBy)
                                .filter(id -> id != null && id > 0)
                                .distinct()
                                .toList())
                .stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return blocks.stream()
                .map(block -> toResponse(block, creators.get(block.getCreatedBy())))
                .toList();
    }

    // Lấy danh sách lịch bảo trì riêng của một không gian cụ thể
    @Transactional(readOnly = true)
    public List<MaintenanceResponseKT> getMaintenanceBySpace(Long spaceId) {
        spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian yêu cầu."));

        return maintenanceBlockRepository.findBySpaceIdAndDeletedAtIsNullOrderByStartTimeAsc(spaceId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Lấy chi tiết một khoảng bảo trì theo ID
    @Transactional(readOnly = true)
    public MaintenanceResponseKT getMaintenanceById(Long maintenanceId) {
        MaintenanceBlock block = maintenanceBlockRepository.findByIdAndDeletedAtIsNull(maintenanceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "MAINTENANCE_NOT_FOUND",
                        "Không tìm thấy khoảng bảo trì yêu cầu."));
        return toResponse(block);
    }

    // Kiểm tra tính hợp lệ của khoảng thời gian (start phải trước end)
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

    // Kiểm tra thời gian bắt đầu không được nằm trong quá khứ
    private void validateStartTimeNotInPast(LocalDateTime start, LocalDateTime now) {
        if (start.isBefore(now)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "MAINTENANCE_START_TIME_IN_PAST",
                    "Thời gian bắt đầu bảo trì không được nằm trong quá khứ");
        }
    }

    // Kiểm tra xung đột với booking: Nếu có sinh viên đã đặt phòng trong giờ này -> Bắn ngoại lệ xung đột
    private void checkOccupyingBookingConflict(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        List<BookingResponse> occupyingBookings = bookingService.getSpaceTimeline(spaceId, startTime, endTime);
        if (!occupyingBookings.isEmpty()) {
            throw new MaintenanceBookingConflictExceptionKT(occupyingBookings);
        }
    }

    // Kiểm tra trùng lặp với khoảng bảo trì khác đang hoạt động
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

    private User requireCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null || "anonymousUser".equalsIgnoreCase(email)) {
            throw new AppException(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Vui lòng đăng nhập để thực hiện thao tác này."
            );
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(
                        HttpStatus.UNAUTHORIZED,
                        "USER_NOT_FOUND",
                        "Không tìm thấy tài khoản đang đăng nhập."
                ));
    }

    private MaintenanceResponseKT toResponse(MaintenanceBlock block) {
        User creator = block.getCreatedBy() == null || block.getCreatedBy() <= 0
                ? null
                : userRepository.findById(block.getCreatedBy()).orElse(null);
        return toResponse(block, creator);
    }

    private MaintenanceResponseKT toResponse(MaintenanceBlock block, User creator) {
        return MaintenanceResponseKT.builder()
                .id(block.getId())
                .spaceId(block.getSpace().getId())
                .spaceName(block.getSpace().getName())
                .startTime(block.getStartTime())
                .endTime(block.getEndTime())
                .reason(block.getReason())
                .createdBy(block.getCreatedBy())
                .creatorName(resolveCreatorName(creator))
                .creatorUserCode(creator == null || creator.getUserCode() == null
                        || creator.getUserCode().isBlank() ? null : creator.getUserCode().trim())
                .createdAt(block.getCreatedAt())
                .updatedAt(block.getUpdatedAt())
                .deletedAt(block.getDeletedAt())
                .active(block.isActive())
                .build();
    }

    private String resolveCreatorName(User creator) {
        if (creator == null) {
            return "Không xác định";
        }
        if (creator.getFullName() != null && !creator.getFullName().isBlank()) {
            return creator.getFullName().trim();
        }
        if (creator.getUsername() != null && !creator.getUsername().isBlank()) {
            return creator.getUsername().trim();
        }
        return "Không xác định";
    }
}
