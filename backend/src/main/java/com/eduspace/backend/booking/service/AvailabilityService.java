package com.eduspace.backend.booking.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.eduspace.backend.booking.dto.request.SearchSpaceFilter;
import com.eduspace.backend.booking.dto.response.AvailabilityResponse;
import com.eduspace.backend.booking.dto.response.ConflictDetail;
import com.eduspace.backend.booking.dto.response.SpaceResponse;
import com.eduspace.backend.booking.entity.AuditAction;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingAuditLog;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingAuditLogRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.space.entity.Facility;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceImageRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import com.eduspace.backend.space.repository.FacilityRepository;
import com.eduspace.backend.policy.service.PolicyService;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Phân hệ Kiểm tra Khả dụng Tổng hợp & Tìm kiếm Phòng (Module M03).
 * Phụ trách: Nguyễn Thị Khánh Vân (Lead kỹ thuật).
 * 
 * Tích hợp trực tiếp CSDL không gian của Kim Tuyến và hỗ trợ fallback dự phòng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AvailabilityService {

    private final BookingRepository bookingRepository;
    private final BookingAuditLogRepository auditLogRepository;
    private final SpaceRepository spaceRepository;
    private final PolicyService policyService;
    private final com.eduspace.backend.staff.repository.MaintenanceBlockRepository maintenanceBlockRepository;

    @Autowired(required = false)
    private com.eduspace.backend.booking.repository.BookingMaintenanceRepository bookingMaintenanceRepository;

    // Repositories tùy chọn từ module Kim Tuyến - tự động inject khi ứng dụng khởi chạy
    @Autowired(required = false)
    private SpaceImageRepository spaceImageRepository;

    @Autowired(required = false)
    private SpaceTypeRepository spaceTypeRepository;

    @Autowired(required = false)
    private FacilityRepository facilityRepository;

    @Autowired(required = false)
    private com.eduspace.backend.space.repository.SpaceTableRepository spaceTableRepository;

    @Autowired(required = false)
    private com.eduspace.backend.space.repository.SeatRepository seatRepository;

    @Autowired(required = false)
    private java.time.Clock clock = java.time.Clock.systemDefaultZone();

    public void setClock(java.time.Clock clock) {
        this.clock = clock;
    }

    public LocalDateTime getCurrentDateTime() {
        return clock != null ? LocalDateTime.now(clock) : LocalDateTime.now();
    }

    public void setSpaceImageRepository(SpaceImageRepository spaceImageRepository) {
        this.spaceImageRepository = spaceImageRepository;
    }

    public void setSpaceTypeRepository(SpaceTypeRepository spaceTypeRepository) {
        this.spaceTypeRepository = spaceTypeRepository;
    }

    public void setFacilityRepository(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public void setSpaceTableRepository(com.eduspace.backend.space.repository.SpaceTableRepository spaceTableRepository) {
        this.spaceTableRepository = spaceTableRepository;
    }

    public void setSeatRepository(com.eduspace.backend.space.repository.SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    public static final List<BookingStatus> OCCUPYING_STATUSES = List.of(
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpaceCatalogItem {
        private Long id;
        private String name;
        private String spaceCode;
        private Long spaceTypeId;
        private String spaceTypeName;
        private String bookingMode;
        private boolean requiresApproval;
        private String building;
        private String floor;
        private int capacity;
        private String status;
        private String imageUrl;
        private String description;
        private List<String> facilities;
        private List<Long> facilityIds;
    }

    // Danh mục phòng học chuẩn EduSpace đồng bộ hoàn toàn với CSDL của Kim Tuyến
    private static final Map<Long, SpaceCatalogItem> SPACE_CATALOG = new LinkedHashMap<>();

    static {
        SPACE_CATALOG.put(1L, SpaceCatalogItem.builder()
                .id(1L).name("Phòng G-101").spaceCode("G-101").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa A").floor("1").capacity(6).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop")
                .description("Phòng học nhóm tầng 1, gần sảnh chờ (WHOLE_SPACE, cần duyệt)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(1L, 4L, 5L))
                .build());

        SPACE_CATALOG.put(2L, SpaceCatalogItem.builder()
                .id(2L).name("Phòng G-102").spaceCode("G-102").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa A").floor("1").capacity(8).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop")
                .description("Phòng học nhóm cỡ vừa, trang bị bảng và màn hình lớn (WHOLE_SPACE, cần duyệt)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Màn hình TV thông minh 65 inch", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(1L, 3L, 4L, 5L))
                .build());

        SPACE_CATALOG.put(3L, SpaceCatalogItem.builder()
                .id(3L).name("Phòng P-201").spaceCode("P-201").spaceTypeId(2L).spaceTypeName("Phòng thuyết trình & Hội thảo")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa A").floor("2").capacity(20).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format&fit=crop")
                .description("Phòng thuyết trình chuyên dụng, cách âm. Bắt buộc Staff duyệt (WHOLE_SPACE)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Máy chiếu Full HD", "Màn hình TV thông minh 65 inch", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(1L, 2L, 3L, 4L, 5L))
                .build());

        SPACE_CATALOG.put(4L, SpaceCatalogItem.builder()
                .id(4L).name("Khu tự học S-201").spaceCode("S-201").spaceTypeId(3L).spaceTypeName("Khu tự học chung (Mở)")
                .bookingMode("PER_SEAT")
                .requiresApproval(false).building("Tòa B").floor("2").capacity(10).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop")
                .description("Khu tự học chung tầng 2, sức chứa 10 chỗ ngồi độc lập. Hỗ trợ chọn theo từng ghế (PER_SEAT, duyệt tức thì)")
                .facilities(List.of("Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(4L, 5L))
                .build());

        SPACE_CATALOG.put(5L, SpaceCatalogItem.builder()
                .id(5L).name("Study Booth B-01").spaceCode("B-01").spaceTypeId(4L).spaceTypeName("Study Booth cá nhân")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa B").floor("3").capacity(2).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop")
                .description("Khoang tự học yên tĩnh, bàn đôi, đặt trọn phòng (WHOLE_SPACE, cần duyệt)")
                .facilities(List.of("Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(4L, 5L))
                .build());

        SPACE_CATALOG.put(6L, SpaceCatalogItem.builder()
                .id(6L).name("Phòng G-103 (Bảo trì)").spaceCode("G-103").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa A").floor("1").capacity(6).status("MAINTENANCE")
                .imageUrl("https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop")
                .description("Phòng đang cải tạo hệ thống điện, tạm ngừng phục vụ")
                .facilities(List.of("Bảng trắng & Bút dạ"))
                .facilityIds(List.of(1L))
                .build());

        SPACE_CATALOG.put(7L, SpaceCatalogItem.builder()
                .id(7L).name("Phòng D-201").spaceCode("D-201").spaceTypeId(5L).spaceTypeName("Phòng thảo luận theo bàn")
                .bookingMode("PER_TABLE")
                .requiresApproval(true).building("Tòa D").floor("2").capacity(24).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop")
                .description("Phòng thảo luận nhóm tầng 2, sức chứa 24 chỗ chia thành 4 bàn. Hỗ trợ chọn theo bàn (PER_TABLE, cần duyệt)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều"))
                .facilityIds(List.of(1L, 4L, 5L))
                .build());
    }

    private SpaceCatalogItem mapSpaceToCatalogItem(Space space) {
        if (space == null) return null;
        List<String> facilityNames = (space.getFacilities() != null)
                ? space.getFacilities().stream()
                        .filter(f -> f != null && f.getDeletedAt() == null)
                        .map(Facility::getName)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<Long> facilityIds = (space.getFacilities() != null)
                ? space.getFacilities().stream()
                        .filter(f -> f != null && f.getDeletedAt() == null && f.getId() != null)
                        .map(Facility::getId)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        String bookingMode = (space.getSpaceType() != null && space.getSpaceType().getBookingMode() != null)
                ? space.getSpaceType().getBookingMode().name()
                : "WHOLE_SPACE";
        // LOGIC LIÊN KẾT CSDL KIM TUYẾN: Đọc trực tiếp từ cột requires_approval trong bảng space_types
        boolean requiresApproval = (space.getSpaceType() != null)
                ? space.getSpaceType().isRequiresApproval()
                : !"PER_SEAT".equalsIgnoreCase(bookingMode);
        String typeName = space.getSpaceType() != null ? space.getSpaceType().getName() : "Phòng học tiêu chuẩn";
        Long typeId = space.getSpaceType() != null ? space.getSpaceType().getId() : 1L;
        String statusStr = space.getStatus() != null ? space.getStatus().name() : "AVAILABLE";

        // LOGIC LIÊN KẾT CSDL KIM TUYẾN: Lấy ảnh chính (is_primary = true) từ bảng space_images
        String img = null;
        if (spaceImageRepository != null && space.getId() != null) {
            try {
                img = spaceImageRepository.findBySpaceIdAndIsPrimaryTrue(space.getId())
                        .map(com.eduspace.backend.space.entity.SpaceImage::getImageUrl)
                        .orElse(null);
                if (img == null || img.isBlank()) {
                    List<com.eduspace.backend.space.entity.SpaceImage> imgs =
                            spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(space.getId());
                    if (!imgs.isEmpty()) {
                        img = imgs.get(0).getImageUrl();
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể truy vấn space_images cho spaceId {}: {}", space.getId(), e.getMessage());
            }
        }
        if (img == null || img.isBlank()) {
            img = (space.getId() != null && SPACE_CATALOG.containsKey(space.getId()))
                    ? SPACE_CATALOG.get(space.getId()).getImageUrl()
                    : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop";
        }


        return SpaceCatalogItem.builder()
                .id(space.getId())
                .name(space.getName())
                .spaceCode(space.getSpaceCode())
                .spaceTypeId(typeId)
                .spaceTypeName(typeName)
                .bookingMode(bookingMode)
                .requiresApproval(requiresApproval)
                .building(space.getBuilding())
                .floor(space.getFloor())
                .capacity(space.getCapacity() != null ? space.getCapacity() : 0)
                .status(statusStr)
                .imageUrl(img)
                .description(space.getDescription())
                .facilities(facilityNames)
                .facilityIds(facilityIds)
                .build();
    }

    public SpaceCatalogItem getSpaceCatalogItem(Long spaceId) {
        if (spaceId == null) return null;
        if (spaceRepository != null) {
            try {
                Optional<Space> opt = spaceRepository.findByIdAndDeletedAtIsNull(spaceId);
                if (opt.isPresent()) {
                    return mapSpaceToCatalogItem(opt.get());
                }
            } catch (Exception e) {
                log.warn("Truy vấn SpaceRepository cho ID {} thất bại, chuyển fallback RAM: {}", spaceId, e.getMessage());
            }
        }
        return SPACE_CATALOG.get(spaceId);
    }

    public List<SpaceCatalogItem> getAllCatalogItems() {
        if (spaceRepository != null) {
            try {
                List<Space> spaces = spaceRepository.findAllByDeletedAtIsNull();
                if (spaces != null && !spaces.isEmpty()) {
                    return spaces.stream()
                            .map(this::mapSpaceToCatalogItem)
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                log.warn("Truy vấn findAll từ SpaceRepository thất bại, chuyển fallback RAM: {}", e.getMessage());
            }
        }
        return new ArrayList<>(SPACE_CATALOG.values());
    }

    /**
     * Danh sách dùng cho tìm kiếm phải phản ánh đúng CSDL, không dùng catalog RAM dự phòng.
     * Nếu CSDL không truy vấn được thì trả lỗi thay vì hiển thị các phòng có thể không còn tồn tại.
     */
    private List<SpaceCatalogItem> getDatabaseCatalogItemsForSearch() {
        if (spaceRepository == null) {
            throw new BusinessException(
                    "SPACE_DATA_UNAVAILABLE",
                    "Không thể truy vấn dữ liệu không gian lúc này. Vui lòng thử lại sau.",
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        try {
            List<Space> spaces = spaceRepository.findAllByDeletedAtIsNull();
            if (spaces == null) return Collections.emptyList();
            return spaces.stream()
                    .map(this::mapSpaceToCatalogItem)
                    .collect(Collectors.toList());
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Không thể truy vấn danh sách không gian từ CSDL", ex);
            throw new BusinessException(
                    "SPACE_DATA_UNAVAILABLE",
                    "Không thể truy vấn dữ liệu không gian lúc này. Vui lòng thử lại sau.",
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    /**
     * Quy tắc giao nhau thời gian chuẩn (02_Yeu_cau_logic §1.1):
     * A.startTime < B.endTime AND A.endTime > B.startTime
     */
    public boolean isOverlapping(LocalDateTime startA, LocalDateTime endA, LocalDateTime startB, LocalDateTime endB) {
        if (startA == null || endA == null || startB == null || endB == null) {
            return false;
        }
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    /**
     * Quét chuyển các booking PENDING_APPROVAL đã quá giờ bắt đầu sang EXPIRED.
     */
    @Transactional
    public void expirePendingApproval(LocalDateTime now) {
        List<Booking> overdueBookings = bookingRepository.findPendingOverdueBookings(BookingStatus.PENDING_APPROVAL, now);
        for (Booking booking : overdueBookings) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.setExpiredAt(now);
            booking.setExpireReason("PENDING_APPROVAL_TIMEOUT");
            bookingRepository.save(booking);

            BookingAuditLog logEntry = BookingAuditLog.builder()
                    .bookingId(booking.getId())
                    .action(AuditAction.EXPIRE_TIMEOUT)
                    .performedBy(null)
                    .performedByEmail("system@eduspace.vn")
                    .performedAt(now)
                    .reason("PENDING_APPROVAL_TIMEOUT")
                    .note("Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng")
                    .build();
            auditLogRepository.save(logEntry);
            log.info("Booking #{} tự động chuyển sang EXPIRED do quá hạn duyệt", booking.getId());
        }
    }

    /**
     * Quét chuyển các booking CHECKED_IN đã quá endTime sang COMPLETED.
     */
    @Transactional
    public void completeOverdueCheckedIn(LocalDateTime now) {
        List<Booking> completedCandidates = bookingRepository.findCompletedCandidateBookings(BookingStatus.CHECKED_IN, now);
        for (Booking b : completedCandidates) {
            b.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(b);

            BookingAuditLog audit = BookingAuditLog.builder()
                    .bookingId(b.getId())
                    .action(AuditAction.COMPLETE_TIMEOUT)
                    .performedBy(null)
                    .performedByEmail("system@eduspace.vn")
                    .performedAt(now)
                    .reason("SESSION_ENDED")
                    .note("Hết giờ sử dụng phòng -> Đánh dấu COMPLETED thành công")
                    .build();
            auditLogRepository.save(audit);
            log.info("[Scheduler] Booking #{} chuyển sang COMPLETED", b.getId());
        }
    }

    /**
     * API kiểm tra khả dụng của một phòng cụ thể (02_Yeu_cau_logic §3.1).
     */
    @Transactional
    public AvailabilityResponse checkSpaceAvailability(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = getCurrentDateTime();
        expirePendingApproval(now);

        SpaceCatalogItem space = getSpaceCatalogItem(spaceId);
        if (space == null) {
            throw BusinessException.notFound("SPACE_NOT_FOUND", "Không tìm thấy phòng với ID: " + spaceId);
        }

        validateBookingTimeLimits(startTime, endTime);

        List<ConflictDetail> conflicts = new ArrayList<>();

        if ("MAINTENANCE".equalsIgnoreCase(space.getStatus())) {
            conflicts.add(ConflictDetail.builder()
                    .type("SPACE_STATUS")
                    .referenceId(space.getId())
                    .startTime(startTime)
                    .endTime(endTime)
                    .description("Phòng hiện đang bảo trì bảo dưỡng")
                    .build());
        }

        // ================= BEGIN KT =================
        if (maintenanceBlockRepository != null) {
            List<com.eduspace.backend.space.entity.MaintenanceBlock> activeBlocks =
                    maintenanceBlockRepository.findOverlappingBlocks(spaceId, startTime, endTime);
            for (com.eduspace.backend.space.entity.MaintenanceBlock mb : activeBlocks) {
                conflicts.add(ConflictDetail.builder()
                        .type("MAINTENANCE")
                        .referenceId(mb.getId())
                        .startTime(mb.getStartTime())
                        .endTime(mb.getEndTime())
                        .description("Không gian đang trong khoảng thời gian bảo trì: " + mb.getReason())
                        .build());
            }
        }
        // ================= END KT =================

        List<Booking> overlappingBookings = bookingRepository.findOverlappingSpaceBookings(
                spaceId, startTime, endTime, OCCUPYING_STATUSES
        );
        for (Booking b : overlappingBookings) {
            conflicts.add(ConflictDetail.builder()
                    .type("BOOKING")
                    .referenceId(b.getId())
                    .startTime(b.getStartTime())
                    .endTime(b.getEndTime())
                    .description("Đã có booking đang chiếm chỗ (Trạng thái: " + b.getStatus().getDisplayName() + ")")
                    .build());
        }

        boolean isAvailable = conflicts.isEmpty();
        return AvailabilityResponse.builder()
                .spaceId(spaceId)
                .spaceName(space.getName())
                .available(isAvailable)
                .conflicts(conflicts)
                .build();
    }

    /**
     * Tìm kiếm phòng khả dụng theo bộ lọc.
     */
    @Transactional
    public List<SpaceResponse> searchAvailableSpaces(SearchSpaceFilter filter) {
        LocalDateTime now = getCurrentDateTime();
        expirePendingApproval(now);

        LocalDateTime rawStart = resolveStartDateTime(filter);
        LocalDateTime rawEnd = resolveEndDateTime(filter);

        if (rawStart != null && rawEnd != null) {
            if (!rawStart.isBefore(rawEnd)) {
                throw BusinessException.badRequest("INVALID_TIME_RANGE", "Thời gian bắt đầu phải trước thời gian kết thúc");
            }
        }

        final LocalDateTime effectiveStart = (rawStart != null && rawStart.isBefore(now)) ? now : rawStart;
        final LocalDateTime effectiveEnd = rawEnd;
        final int requestedParticipants = filter.getParticipantCount() != null
                ? filter.getParticipantCount()
                : 1;

        if (requestedParticipants < 1) {
            throw BusinessException.badRequest(
                    "INVALID_PARTICIPANT_COUNT",
                    "Số người tham gia phải từ 1 người trở lên"
            );
        }

        return getDatabaseCatalogItemsForSearch().stream()
                .filter(space -> "AVAILABLE".equalsIgnoreCase(space.getStatus()))
                .filter(space -> {
                    if (!supportsParticipantCount(space, requestedParticipants)) {
                        return false;
                    }
                    if (filter.getSpaceTypeId() != null && !space.getSpaceTypeId().equals(filter.getSpaceTypeId())) {
                        return false;
                    }
                    if (filter.getBuilding() != null && !filter.getBuilding().isBlank()
                            && !space.getBuilding().equalsIgnoreCase(filter.getBuilding())) {
                        return false;
                    }
                    if (filter.getFacilityIds() != null && !filter.getFacilityIds().isEmpty()) {
                        if (space.getFacilityIds() == null || !space.getFacilityIds().containsAll(filter.getFacilityIds())) {
                            return false;
                        }
                    }

                    // Kiểm tra khả dụng thực tế theo thời gian và mô hình đặt chỗ
                    if (effectiveStart != null && effectiveEnd != null) {
                        if (!isSpaceAvailableInInterval(space, effectiveStart, effectiveEnd, requestedParticipants)) {
                            return false;
                        }
                    } else if (!hasBookableResourceConfigured(space, requestedParticipants)) {
                        return false;
                    }

                    return true;
                })
                .map(space -> {
                    boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
                    boolean isPerTable = "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
                    List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> mDtos = getUpcomingMaintenanceDtos(space.getId());
                    com.eduspace.backend.staff.dto.response.MaintenanceResponseKT nextM = mDtos.isEmpty() ? null : mDtos.get(0);

                    SpaceResponse resp = mapToResponse(space);
                    resp.setIsAvailable(true);
                    return resp;
                    /* return SpaceResponse.builder()
                            .id(space.getId())
                            .name(space.getName())
                            .spaceTypeName(space.getSpaceTypeName())
                            .bookingMode(space.getBookingMode())
                            .requiresApproval(space.isRequiresApproval())
                            .building(space.getBuilding())
                            .floor(space.getFloor())
                            .capacity(space.getCapacity())
                            .status(space.getStatus())
                            .imageUrl(space.getImageUrl())
                            .description(space.getDescription())
                            .facilities(space.getFacilities())
                            .facilityIds(space.getFacilityIds())
                            .nextMaintenance(nextM)
                            .upcomingMaintenances(mDtos)
                            .isAvailable(true)
                            .allowSeatSelection(isPerSeat)
                            .allowTableSelection(isPerTable)
                            .build(); */
                })
                .collect(Collectors.toList());
    }

    /**
     * Quy tắc đối tượng sử dụng theo mô hình đặt lấy từ space_types.booking_mode trong CSDL:
     * - WHOLE_SPACE: từ 1 người đến đúng sức chứa; một booking giữ trọn không gian.
     * - PER_SEAT: đúng 1 người và chọn một ghế cụ thể.
     * - PER_TABLE: từ 1 người và phải còn bàn đủ sức chứa.
     */
    public boolean supportsParticipantCount(SpaceCatalogItem space, int participantCount) {
        if (space == null || participantCount < 1) return false;

        if (isWholeSpace(space)) return space.getCapacity() >= participantCount;
        if (isPerSeat(space)) return participantCount == 1;
        return isPerTable(space) && space.getCapacity() >= participantCount;
    }

    private boolean hasBookableResourceConfigured(SpaceCatalogItem space, int participantCount) {
        if (isWholeSpace(space)) return space.getCapacity() >= participantCount;

        if (isPerSeat(space)) {
            if (participantCount != 1 || seatRepository == null) return false;
            return seatRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                    .anyMatch(seat -> seat.getStatus() == com.eduspace.backend.space.entity.SeatStatus.AVAILABLE);
        }

        if (isPerTable(space)) {
            if (spaceTableRepository == null) return false;
            return spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                    .anyMatch(table -> table.getStatus() == com.eduspace.backend.space.entity.SpaceTableStatus.AVAILABLE
                            && table.getCapacity() != null
                            && table.getCapacity() >= participantCount);
        }

        return false;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TimeInterval {
        private LocalDateTime start;
        private LocalDateTime end;

        public long getDurationMinutes() {
            return java.time.Duration.between(start, end).toMinutes();
        }
    }

    public static List<TimeInterval> mergeIntervals(List<TimeInterval> intervals) {
        if (intervals == null || intervals.isEmpty()) return Collections.emptyList();
        List<TimeInterval> sorted = new ArrayList<>(intervals);
        sorted.sort(Comparator.comparing(TimeInterval::getStart));

        List<TimeInterval> merged = new ArrayList<>();
        TimeInterval current = sorted.get(0);

        for (int i = 1; i < sorted.size(); i++) {
            TimeInterval next = sorted.get(i);
            if (!current.getEnd().isBefore(next.getStart())) {
                if (next.getEnd().isAfter(current.getEnd())) {
                    current = new TimeInterval(current.getStart(), next.getEnd());
                }
            } else {
                merged.add(current);
                current = next;
            }
        }
        merged.add(current);
        return merged;
    }

    public static List<TimeInterval> findGaps(LocalDateTime windowStart, LocalDateTime windowEnd, List<TimeInterval> busyList) {
        if (busyList == null || busyList.isEmpty()) {
            return Collections.singletonList(new TimeInterval(windowStart, windowEnd));
        }

        List<TimeInterval> gaps = new ArrayList<>();
        LocalDateTime cursor = windowStart;

        for (TimeInterval busy : busyList) {
            if (busy.getStart().isAfter(cursor)) {
                gaps.add(new TimeInterval(cursor, busy.getStart()));
            }
            if (busy.getEnd().isAfter(cursor)) {
                cursor = busy.getEnd();
            }
        }

        if (cursor.isBefore(windowEnd)) {
            gaps.add(new TimeInterval(cursor, windowEnd));
        }

        return gaps;
    }

    /**
     * Kiểm tra khả dụng đúng với toàn bộ khung giờ người dùng yêu cầu và cấu hình trong CSDL.
     */
    public boolean isSpaceAvailableInInterval(
            SpaceCatalogItem space,
            LocalDateTime searchStart,
            LocalDateTime searchEnd,
            Integer participantCount
    ) {
        if (space == null || searchStart == null || searchEnd == null || !searchStart.isBefore(searchEnd)) {
            return false;
        }

        int requestedParticipants = participantCount != null ? participantCount : 1;
        if (!supportsParticipantCount(space, requestedParticipants)) return false;

        List<com.eduspace.backend.space.entity.MaintenanceBlock> maintenanceBlocks = Collections.emptyList();
        if (bookingMaintenanceRepository != null) {
            maintenanceBlocks = bookingMaintenanceRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        } else if (maintenanceBlockRepository != null) {
            maintenanceBlocks = maintenanceBlockRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        }
        if (!maintenanceBlocks.isEmpty()) return false;

        List<Booking> overlappingBookings = bookingRepository.findOverlappingSpaceBookings(
                space.getId(), searchStart, searchEnd, OCCUPYING_STATUSES
        );

        if (isWholeSpace(space)) {
            return overlappingBookings.isEmpty();
        }

        boolean hasWholeRoomBooking = overlappingBookings.stream()
                .anyMatch(booking -> booking.getTableId() == null && booking.getSelectedSeatsList().isEmpty());
        if (hasWholeRoomBooking) return false;

        if (isPerSeat(space)) {
            if (seatRepository == null) return false;

            Set<String> occupiedSeatCodes = overlappingBookings.stream()
                    .flatMap(booking -> booking.getSelectedSeatsList().stream())
                    .filter(Objects::nonNull)
                    .map(code -> code.trim().toUpperCase())
                    .collect(Collectors.toSet());

            return seatRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                    .filter(seat -> seat.getStatus() == com.eduspace.backend.space.entity.SeatStatus.AVAILABLE)
                    .map(com.eduspace.backend.space.entity.Seat::getSeatCode)
                    .filter(Objects::nonNull)
                    .map(code -> code.trim().toUpperCase())
                    .anyMatch(code -> !occupiedSeatCodes.contains(code));
        }

        if (isPerTable(space)) {
            if (spaceTableRepository == null) return false;

            Set<Long> occupiedTableIds = overlappingBookings.stream()
                    .map(Booking::getTableId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Set<String> occupiedTableCodes = overlappingBookings.stream()
                    .flatMap(booking -> booking.getSelectedSeatsList().stream())
                    .filter(Objects::nonNull)
                    .map(code -> code.trim().toUpperCase())
                    .collect(Collectors.toSet());

            return spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                    .filter(table -> table.getStatus() == com.eduspace.backend.space.entity.SpaceTableStatus.AVAILABLE)
                    .filter(table -> table.getCapacity() != null && table.getCapacity() >= requestedParticipants)
                    .filter(table -> table.getId() == null || !occupiedTableIds.contains(table.getId()))
                    .filter(table -> table.getTableCode() == null
                            || !occupiedTableCodes.contains(table.getTableCode().trim().toUpperCase()))
                    .findAny()
                    .isPresent();
        }

        return false;
    }

    /**
     * Logic cũ được giữ riêng để đối chiếu trong quá trình chuyển đổi.
     * Luồng tìm kiếm và đặt chỗ không gọi phương thức này.
     *
     * Logic nghiệp vụ thực tế kiểm tra phòng khả dụng trong khoảng thời gian [searchStart, searchEnd]:
     * - Nếu tìm khung giờ vừa vặn (<= 180 phút, ví dụ 20:00 - 22:00):
     *   + WHOLE_SPACE: Ẩn nếu đã có người đặt hoặc phòng có lịch bảo trì trong khung giờ này.
     *   + PER_SEAT: Ẩn nếu tất cả các ghế đã bị đặt (hoặc số ghế trống < participantCount).
     *   + PER_TABLE: Ẩn nếu tất cả các bàn đã bị đặt.
     * - Nếu tìm khoảng thời gian dài (> 180 phút, ví dụ 10:00 - 17:00):
     *   + Nếu có booking ở giữa (ví dụ 13:00 - 15:00), nhưng các khoảng trước và sau (10:00 - 13:00 và 15:00 - 17:00)
     *     vẫn còn trống >= 30 phút -> VẪN HIỂN THỊ để sinh viên chọn slot phù hợp!
     *   + Chỉ ẩn nếu toàn bộ khoảng thời gian bị phủ kín 100% không còn slot trống nào.
     */
    private boolean isSpaceAvailableInIntervalLegacy(SpaceCatalogItem space, LocalDateTime searchStart, LocalDateTime searchEnd, Integer participantCount) {
        if (space == null || searchStart == null || searchEnd == null || !searchStart.isBefore(searchEnd)) {
            return true;
        }

        long searchDurationMinutes = java.time.Duration.between(searchStart, searchEnd).toMinutes();

        // 1. Lấy tất cả các block bảo trì giao nhau với khoảng tìm kiếm
        List<com.eduspace.backend.space.entity.MaintenanceBlock> maintenanceBlocks = Collections.emptyList();
        if (bookingMaintenanceRepository != null) {
            maintenanceBlocks = bookingMaintenanceRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        } else if (maintenanceBlockRepository != null) {
            maintenanceBlocks = maintenanceBlockRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        }

        // Lấy danh sách booking đang chiếm chỗ (PENDING_APPROVAL, CONFIRMED, CHECKED_IN)
        List<Booking> overlappingBookings = bookingRepository.findOverlappingSpaceBookings(
                space.getId(), searchStart, searchEnd, OCCUPYING_STATUSES
        );

        String mode = space.getBookingMode() != null ? space.getBookingMode() : "WHOLE_SPACE";
        boolean isWholeSpace = "WHOLE_SPACE".equalsIgnoreCase(mode);
        boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(mode);
        boolean isPerTable = "PER_TABLE".equalsIgnoreCase(mode);

        int minSlotMinutes = 30; // Ngưỡng tối thiểu của một ca đặt phòng

        // Kiểm tra sức chứa: Đối với WHOLE_SPACE, nếu số người tìm kiếm vượt quá sức chứa phòng thì loại
        if (isWholeSpace && participantCount != null && participantCount > 0 && space.getCapacity() > 0) {
            if (participantCount > space.getCapacity()) {
                return false;
            }
        }

        // XỬ LÝ KHUNG GIỜ NGẮN / VỪA VẶN (<= 180 phút, ví dụ: 20:00 - 22:00 = 120 phút)
        if (searchDurationMinutes <= 180) {
            // A. Nếu là WHOLE_SPACE:
            if (isWholeSpace) {
                // Nếu có bất kỳ lịch bảo trì nào giao vào khung giờ này -> Ẩn
                if (!maintenanceBlocks.isEmpty()) return false;
                // Nếu có bất kỳ booking nào giao vào khung giờ này -> Ẩn (đã có người đặt trọn gói)
                if (!overlappingBookings.isEmpty()) return false;
                return true;
            }

            // B. Nếu là PER_SEAT hoặc PER_TABLE nhưng có booking trọn phòng:
            boolean hasWholeRoomBooking = overlappingBookings.stream()
                    .anyMatch(b -> b.getTableId() == null && b.getSelectedSeatsList().isEmpty());
            if (hasWholeRoomBooking) return false;

            // Kiểm tra bảo trì
            if (!maintenanceBlocks.isEmpty()) {
                List<TimeInterval> maintIntervals = new ArrayList<>();
                for (com.eduspace.backend.space.entity.MaintenanceBlock m : maintenanceBlocks) {
                    LocalDateTime s = m.getStartTime().isBefore(searchStart) ? searchStart : m.getStartTime();
                    LocalDateTime e = m.getEndTime().isAfter(searchEnd) ? searchEnd : m.getEndTime();
                    if (s.isBefore(e)) maintIntervals.add(new TimeInterval(s, e));
                }
                List<TimeInterval> freeGaps = findGaps(searchStart, searchEnd, mergeIntervals(maintIntervals));
                if (freeGaps.stream().noneMatch(gap -> gap.getDurationMinutes() >= minSlotMinutes)) {
                    return false; // Bị bảo trì phủ kín khung giờ
                }
            }

            // C. Nếu là PER_SEAT: Kiểm tra số ghế trống
            if (isPerSeat) {
                long availableSeatCount = 0;
                if (seatRepository != null) {
                    try {
                        availableSeatCount = seatRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                                .filter(s -> s.getStatus() != null && com.eduspace.backend.space.entity.SeatStatus.AVAILABLE.equals(s.getStatus()))
                                .count();
                    } catch (Exception ignored) {}
                }
                if (availableSeatCount == 0 && space.getCapacity() > 0) {
                    availableSeatCount = space.getCapacity();
                }
                int capacity = (int) availableSeatCount;
                int reqSeats = (participantCount != null && participantCount > 0) ? participantCount : 1;

                Set<String> occupiedSeatCodes = new HashSet<>();
                for (Booking b : overlappingBookings) {
                    occupiedSeatCodes.addAll(b.getSelectedSeatsList());
                }

                int remainingSeats = capacity - occupiedSeatCodes.size();
                return remainingSeats >= reqSeats && remainingSeats > 0;
            }

            // D. Nếu là PER_TABLE: Kiểm tra số bàn trống
            if (isPerTable) {
                int totalTables = 0;
                if (spaceTableRepository != null) {
                    try {
                        long count = spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(space.getId()).stream()
                                .filter(t -> t.getStatus() != null && "AVAILABLE".equalsIgnoreCase(t.getStatus().name()))
                                .count();
                        if (count > 0) totalTables = (int) count;
                    } catch (Exception ignored) {}
                }

                Set<String> occupiedTables = new HashSet<>();
                for (Booking b : overlappingBookings) {
                    if (b.getTableId() != null && spaceTableRepository != null) {
                        try {
                            spaceTableRepository.findById(b.getTableId()).ifPresent(t -> {
                                if (t.getTableCode() != null) occupiedTables.add(t.getTableCode().trim().toUpperCase());
                            });
                        } catch (Exception ignored) {}
                    }
                    b.getSelectedSeatsList().forEach(s -> occupiedTables.add(s.trim().toUpperCase()));
                }

                int remainingTables = totalTables - occupiedTables.size();
                return remainingTables > 0;
            }

            return true;
        }

        // XỬ LÝ KHOẢNG THỜI GIAN DÀI (> 180 phút, ví dụ: 10:00 - 17:00 = 420 phút)
        // Lấy tất cả khoảng thời gian bận (bảo trì + booking)
        List<TimeInterval> busyList = new ArrayList<>();
        for (com.eduspace.backend.space.entity.MaintenanceBlock m : maintenanceBlocks) {
            LocalDateTime s = m.getStartTime().isBefore(searchStart) ? searchStart : m.getStartTime();
            LocalDateTime e = m.getEndTime().isAfter(searchEnd) ? searchEnd : m.getEndTime();
            if (s.isBefore(e)) busyList.add(new TimeInterval(s, e));
        }

        if (isWholeSpace) {
            for (Booking b : overlappingBookings) {
                LocalDateTime s = b.getStartTime().isBefore(searchStart) ? searchStart : b.getStartTime();
                LocalDateTime e = b.getEndTime().isAfter(searchEnd) ? searchEnd : b.getEndTime();
                if (s.isBefore(e)) busyList.add(new TimeInterval(s, e));
            }
        } else {
            // Với PER_SEAT / PER_TABLE: chỉ booking trọn phòng (whole room) mới khóa hoàn toàn
            for (Booking b : overlappingBookings) {
                if (b.getTableId() == null && b.getSelectedSeatsList().isEmpty()) {
                    LocalDateTime s = b.getStartTime().isBefore(searchStart) ? searchStart : b.getStartTime();
                    LocalDateTime e = b.getEndTime().isAfter(searchEnd) ? searchEnd : b.getEndTime();
                    if (s.isBefore(e)) busyList.add(new TimeInterval(s, e));
                }
            }
        }

        List<TimeInterval> mergedBusy = mergeIntervals(busyList);
        List<TimeInterval> gaps = findGaps(searchStart, searchEnd, mergedBusy);

        // Vẫn hiển thị phòng nếu tồn tại ít nhất 1 khoảng trống >= 30 phút
        return gaps.stream().anyMatch(g -> g.getDurationMinutes() >= minSlotMinutes);
    }

    private List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> getUpcomingMaintenanceDtos(Long spaceId) {
        if (bookingMaintenanceRepository == null || spaceId == null) {
            return Collections.emptyList();
        }
        try {
            LocalDateTime now = getCurrentDateTime();
            List<com.eduspace.backend.space.entity.MaintenanceBlock> blocks =
                    bookingMaintenanceRepository.findUpcomingBlocks(spaceId, now);
            return blocks.stream()
                    .filter(m -> m.getEndTime() != null && !m.getEndTime().isBefore(now))
                    .map(m -> com.eduspace.backend.staff.dto.response.MaintenanceResponseKT.builder()
                            .id(m.getId())
                            .spaceId(spaceId)
                            .spaceName(m.getSpace() != null ? m.getSpace().getName() : null)
                            .startTime(m.getStartTime())
                            .endTime(m.getEndTime())
                            .reason(m.getReason())
                            .active(m.isActive())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> getUpcomingMaintenancesBySpace(Long spaceId) {
        return getUpcomingMaintenanceDtos(spaceId);
    }

    public List<SpaceResponse> getAllSpaces() {
        return getAllCatalogItems().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SpaceResponse getSpaceById(Long id) {
        SpaceCatalogItem space = getSpaceCatalogItem(id);
        if (space == null) {
            throw BusinessException.notFound("SPACE_NOT_FOUND", "Không tìm thấy phòng với ID: " + id);
        }
        return mapToResponse(space);
    }

    public boolean isPerSeat(SpaceCatalogItem space) {
        return space != null && "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
    }

    public boolean isPerTable(SpaceCatalogItem space) {
        return space != null && "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
    }

    public boolean isWholeSpace(SpaceCatalogItem space) {
        return space == null || "WHOLE_SPACE".equalsIgnoreCase(space.getBookingMode());
    }

    private SpaceResponse mapToResponse(SpaceCatalogItem space) {
        boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
        boolean isPerTable = "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
        List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> mDtos = getUpcomingMaintenanceDtos(space.getId());
        com.eduspace.backend.staff.dto.response.MaintenanceResponseKT nextM = mDtos.isEmpty() ? null : mDtos.get(0);

        Long activeSeatCount = 0L;
        Long activeTableCount = 0L;
        Integer activeTableCapacity = 0;
        if (seatRepository != null && isPerSeat) {
            try {
                activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
            } catch (Exception ignored) {}
        }
        if (spaceTableRepository != null && isPerTable) {
            try {
                activeTableCount = spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
                activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(space.getId());
            } catch (Exception ignored) {}
        }

        return SpaceResponse.builder()
                .id(space.getId())
                .name(space.getName())
                .spaceTypeName(space.getSpaceTypeName())
                .bookingMode(space.getBookingMode())
                .requiresApproval(space.isRequiresApproval())
                .building(space.getBuilding())
                .floor(space.getFloor())
                .capacity(space.getCapacity())
                .status(space.getStatus())
                .imageUrl(space.getImageUrl())
                .description(space.getDescription())
                .facilities(space.getFacilities())
                .facilityIds(space.getFacilityIds())
                .nextMaintenance(nextM)
                .upcomingMaintenances(mDtos)
                .allowSeatSelection(isPerSeat)
                .allowTableSelection(isPerTable)
                .activeSeatCount(activeSeatCount)
                .activeTableCount(activeTableCount)
                .activeTableCapacity(activeTableCapacity)
                .build();
    }

    public List<java.util.Map<String, Object>> getSpaceTypes() {
        if (spaceTypeRepository != null) {
            try {
                List<com.eduspace.backend.space.entity.SpaceType> types = spaceTypeRepository.findAllByDeletedAtIsNull();
                if (types != null && !types.isEmpty()) {
                    return types.stream()
                            .map(t -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("id", t.getId());
                                map.put("name", t.getName());
                                map.put("bookingMode", t.getBookingMode() != null ? t.getBookingMode().name() : "WHOLE_SPACE");
                                map.put("requiresApproval", t.isRequiresApproval());
                                map.put("description", t.getDescription() != null ? t.getDescription() : "");
                                return map;
                            })
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi đọc space_types từ CSDL: {}", e.getMessage());
            }
        }
        return List.of(
                java.util.Map.of("id", 1L, "name", "Phòng học nhóm tiêu chuẩn", "bookingMode", "WHOLE_SPACE", "requiresApproval", true, "description", "Đặt nguyên phòng 4-6 chỗ, cần Staff duyệt"),
                java.util.Map.of("id", 2L, "name", "Phòng thuyết trình & Hội thảo", "bookingMode", "WHOLE_SPACE", "requiresApproval", true, "description", "Đặt nguyên phòng, cần Staff duyệt"),
                java.util.Map.of("id", 3L, "name", "Khu tự học chung (Mở)", "bookingMode", "PER_SEAT", "requiresApproval", false, "description", "Không gian tự học chung, đặt theo từng ghế, duyệt tức thì"),
                java.util.Map.of("id", 4L, "name", "Study Booth cá nhân", "bookingMode", "WHOLE_SPACE", "requiresApproval", true, "description", "Khoang tự học cách âm, đặt phòng, cần Staff duyệt"),
                java.util.Map.of("id", 5L, "name", "Phòng thảo luận theo bàn", "bookingMode", "PER_TABLE", "requiresApproval", true, "description", "Phòng thảo luận nhóm, đặt theo từng bàn, cần Staff duyệt")
        );
    }

    public List<java.util.Map<String, Object>> getFacilities() {
        if (facilityRepository != null) {
            try {
                List<Facility> facs = facilityRepository.findAllByDeletedAtIsNull();
                if (facs != null && !facs.isEmpty()) {
                    return facs.stream()
                            .map(f -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("id", f.getId());
                                map.put("name", f.getName());
                                return map;
                            })
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi đọc facilities từ CSDL: {}", e.getMessage());
            }
        }
        return List.of(
                java.util.Map.of("id", 1L, "name", "Bảng trắng"),
                java.util.Map.of("id", 2L, "name", "Điều hòa"),
                java.util.Map.of("id", 3L, "name", "Ổ cắm điện"),
                java.util.Map.of("id", 4L, "name", "Màn hình TV"),
                java.util.Map.of("id", 5L, "name", "Máy chiếu"),
                java.util.Map.of("id", 6L, "name", "Loa & Micro"),
                java.util.Map.of("id", 7L, "name", "Cách âm")
        );
    }

    public void validateBookingTimeLimits(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw BusinessException.badRequest("INVALID_TIME", "Thời gian bắt đầu và kết thúc không được để trống");
        }
        if (!startTime.isBefore(endTime)) {
            throw BusinessException.badRequest("INVALID_TIME_RANGE", "Thời gian bắt đầu phải trước thời gian kết thúc");
        }
        if (startTime.isBefore(getCurrentDateTime())) {
            throw BusinessException.badRequest("PAST_TIME_NOT_ALLOWED", "Không được đặt phòng vào thời điểm trong quá khứ");
        }

        LocalTime openTime = LocalTime.of(7, 0);
        LocalTime closeTime = LocalTime.of(22, 0);
        try {
            var policy = policyService.getCurrentPolicy();
            String op = normalizeTimeStr(policy.getOpeningHour(), "07:00");
            String cl = normalizeTimeStr(policy.getClosingHour(), "22:00");
            openTime = LocalTime.parse(op);
            closeTime = LocalTime.parse(cl);
        } catch (Exception ignored) {
            int openHour = (int) getPolicyLong("OPENING_HOUR", 7L);
            int closeHour = (int) getPolicyLong("CLOSING_HOUR", 22L);
            if (openHour <= 0 || openHour > 23) openHour = 7;
            if (closeHour <= 0 || closeHour > 24) closeHour = 22;
            openTime = LocalTime.of(openHour, 0);
            closeTime = (closeHour == 24) ? LocalTime.of(23, 59, 59) : LocalTime.of(closeHour, 0);
        }
        if (startTime.toLocalTime().isBefore(openTime) || endTime.toLocalTime().isAfter(closeTime) ||
            (endTime.toLocalTime().equals(LocalTime.MIDNIGHT) && !startTime.toLocalDate().equals(endTime.toLocalDate()))) {
            throw BusinessException.badRequest("OUTSIDE_OPERATING_HOURS",
                    "Không gian chỉ hoạt động trong khung giờ từ " + openTime + " đến " + closeTime);
        }

        long durationMinutes = ChronoUnit.MINUTES.between(startTime, endTime);
        long maxMinutes;
        try {
            maxMinutes = policyService.getCurrentPolicy().getMaxDurationMinutes();
        } catch (Exception e) {
            maxMinutes = getPolicyLong("MAX_BOOKING_HOURS_PER_SLOT", 3L) * 60;
        }
        if (durationMinutes > maxMinutes) {
            throw BusinessException.badRequest("DURATION_EXCEEDED",
                    "Thời lượng đặt phòng tối đa là " + (maxMinutes / 60) + " giờ (" + maxMinutes + " phút)");
        }

        long maxAdvanceDays = getPolicyLong("MAX_ADVANCE_DAYS", 7L);
        if (ChronoUnit.DAYS.between(LocalDate.now(), startTime.toLocalDate()) > maxAdvanceDays) {
            throw BusinessException.badRequest("ADVANCE_DAYS_EXCEEDED",
                    "Chỉ được phép đặt phòng trước tối đa " + maxAdvanceDays + " ngày");
        }
    }

    public long getPolicyLong(String key, long defaultValue) {
        return policyService.getLong(key, defaultValue);
    }

    @Transactional
    public List<String> getOccupiedSeats(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        if (spaceId == null || startTime == null || endTime == null) {
            return Collections.emptyList();
        }
        expirePendingApproval(getCurrentDateTime());
        List<Booking> overlapping = bookingRepository.findOverlappingSpaceBookings(
                spaceId, startTime, endTime, OCCUPYING_STATUSES
        );

        boolean wholeRoomOccupied = overlapping.stream()
                .anyMatch(b -> b.getTableId() == null && b.getSelectedSeatsList().isEmpty());

        if (wholeRoomOccupied) {
            List<String> allCodes = new ArrayList<>();
            if (seatRepository != null) {
                try {
                    seatRepository.findBySpaceIdAndDeletedAtIsNull(spaceId)
                            .forEach(s -> {
                                if (s.getSeatCode() != null && !s.getSeatCode().isBlank()) {
                                    allCodes.add(s.getSeatCode().trim().toUpperCase());
                                }
                            });
                } catch (Exception ignored) {}
            }
            if (spaceTableRepository != null) {
                try {
                    spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(spaceId)
                            .forEach(t -> {
                                if (t.getTableCode() != null && !t.getTableCode().isBlank()) {
                                    allCodes.add(t.getTableCode().trim().toUpperCase());
                                }
                            });
                } catch (Exception ignored) {}
            }
            if (!allCodes.isEmpty()) {
                return allCodes.stream().distinct().sorted().collect(Collectors.toList());
            }
            SpaceCatalogItem space = SPACE_CATALOG.get(spaceId);
            int capacity = (space != null) ? space.getCapacity() : 30;
            return Collections.emptyList();
        }

        List<String> occupied = new ArrayList<>();
        for (Booking b : overlapping) {
            b.getSelectedSeatsList().forEach(s -> {
                if (s != null && !s.isBlank()) {
                    occupied.add(s.trim().toUpperCase());
                }
            });
            if (b.getTableId() != null && spaceTableRepository != null) {
                try {
                    spaceTableRepository.findById(b.getTableId()).ifPresent(t -> {
                        if (t.getTableCode() != null && !t.getTableCode().isBlank()) {
                            occupied.add(t.getTableCode().trim().toUpperCase());
                        }
                    });
                } catch (Exception ignored) {}
            }
        }
        return occupied.stream().distinct().sorted().collect(Collectors.toList());
    }

    public static List<String> generateDefaultSeatCodes(int capacity) {
        List<String> list = new ArrayList<>();
        int cols = (capacity <= 4) ? 2 : (capacity <= 12) ? Math.max(3, (int) Math.ceil(capacity / 2.0)) : (capacity <= 20) ? 5 : 6;
        int rowIdx = 0;
        int count = 0;
        while (count < capacity && rowIdx < 26) {
            char rowLetter = (char) ('A' + rowIdx);
            for (int col = 1; col <= cols && count < capacity; col++) {
                list.add("" + rowLetter + col);
                count++;
            }
            rowIdx++;
        }
        return list;
    }

    private LocalDateTime resolveStartDateTime(SearchSpaceFilter filter) {
        if (filter.getStartDateTime() != null) return filter.getStartDateTime();
        if (filter.getDate() != null && filter.getStartTime() != null) {
            return LocalDateTime.of(filter.getDate(), filter.getStartTime());
        }
        return null;
    }

    private LocalDateTime resolveEndDateTime(SearchSpaceFilter filter) {
        if (filter.getEndDateTime() != null) return filter.getEndDateTime();
        if (filter.getDate() != null && filter.getEndTime() != null) {
            return LocalDateTime.of(filter.getDate(), filter.getEndTime());
        }
        return null;
    }

    public String normalizeTimeStr(String hourStr, String defaultHour) {
        if (hourStr == null || hourStr.isBlank()) {
            return defaultHour;
        }
        String trimmed = hourStr.trim();
        try {
            if (trimmed.matches("^\\d{1,2}$")) {
                int h = Integer.parseInt(trimmed);
                if (h == 24) return "23:59";
                return String.format("%02d:00", h);
            }
            if (trimmed.matches("^\\d{1,2}:\\d{2}$")) {
                String[] parts = trimmed.split(":");
                int h = Integer.parseInt(parts[0]);
                if (h == 24) return "23:59";
                return String.format("%02d:%s", h, parts[1]);
            }
            if (trimmed.matches("^\\d{1,2}:\\d{2}:\\d{2}$")) {
                String[] parts = trimmed.split(":");
                int h = Integer.parseInt(parts[0]);
                if (h == 24) return "23:59";
                return String.format("%02d:%s", h, parts[1]);
            }
        } catch (Exception e) {
            return defaultHour;
        }
        return defaultHour;
    }

    /**
     * Lấy thông tin thời gian mở/đóng cửa của toàn bộ tòa nhà/hệ thống và các hạn mức đặt chỗ từ CSDL chính sách (Ngọc Anh).
     * Chuẩn hóa luôn định dạng HH:mm (ví dụ 07:00, 22:00) để khớp 100% chuẩn HTML5 time input và logic frontend.
     */
    public com.eduspace.backend.policy.dto.response.PolicyResponse getOperatingHours() {
        var policy = policyService.getCurrentPolicy();
        if (policy != null) {
            policy.setOpeningHour(normalizeTimeStr(policy.getOpeningHour(), "07:00"));
            policy.setClosingHour(normalizeTimeStr(policy.getClosingHour(), "22:00"));
        }
        return policy;
    }
}

