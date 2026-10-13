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

    // Ánh xạ thực thể Space sang DTO SpaceCatalogItem để sử dụng chung trong toàn hệ thống.
    private SpaceCatalogItem mapSpaceToCatalogItem(Space space) {
        if (space == null) return null;
        // Trích xuất danh sách tên tiện ích của phòng.
        List<String> facilityNames = (space.getFacilities() != null)
                ? space.getFacilities().stream()
                        .filter(f -> f != null && f.getDeletedAt() == null)
                        .map(Facility::getName)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        // Trích xuất danh sách ID tiện ích của phòng.
        List<Long> facilityIds = (space.getFacilities() != null)
                ? space.getFacilities().stream()
                        .filter(f -> f != null && f.getDeletedAt() == null && f.getId() != null)
                        .map(Facility::getId)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        // Xác định chế độ đặt phòng (WHOLE_SPACE, PER_SEAT, PER_TABLE).
        String bookingMode = (space.getSpaceType() != null && space.getSpaceType().getBookingMode() != null)
                ? space.getSpaceType().getBookingMode().name()
                : "WHOLE_SPACE";
        // Xác định cờ yêu cầu phê duyệt từ cấu hình loại không gian.
        boolean requiresApproval = (space.getSpaceType() != null)
                ? space.getSpaceType().isRequiresApproval()
                : !"PER_SEAT".equalsIgnoreCase(bookingMode);
        String typeName = space.getSpaceType() != null ? space.getSpaceType().getName() : "Phòng học tiêu chuẩn";
        Long typeId = space.getSpaceType() != null ? space.getSpaceType().getId() : 1L;
        String statusStr = space.getStatus() != null ? space.getStatus().name() : "AVAILABLE";

        // Lấy đường dẫn hình ảnh đại diện của phòng từ CSDL hoặc sử dụng ảnh mặc định.
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

    // Tra cứu thông tin chi tiết một phòng từ CSDL (tự động fallback về bộ nhớ tạm nếu CSDL lỗi).
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

    // Lấy toàn bộ danh mục không gian đang hoạt động trong hệ thống.
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

    // Truy vấn danh mục không gian từ CSDL phục vụ tìm kiếm thời gian thực (không sử dụng catalog tĩnh).
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

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN GIAO THOA KHOẢNG THỜI GIAN CHUẨN (TIME OVERLAP ENGINE)
    // - Công thức toán học: A và B giao nhau khi và chỉ khi: startA < endB && endA > startB.
    // - Cơ chế: Dùng phép so sánh strictly before/after để loại trừ trường hợp tiếp xúc biên (endA == startB).
    //   Nhờ đó, sinh viên ca sau có thể bắt đầu sử dụng phòng ngay tại thời điểm ca trước kết thúc mà không bị coi là xung đột.
    // =========================================================================================================
    public boolean isOverlapping(LocalDateTime startA, LocalDateTime endA, LocalDateTime startB, LocalDateTime endB) {
        if (startA == null || endA == null || startB == null || endB == null) {
            return false;
        }
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    // Tự động quét và chuyển trạng thái các đơn PENDING_APPROVAL đã quá giờ bắt đầu sang EXPIRED (giải phóng phòng).
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

    // Tự động quét và hoàn thành các đơn CHECKED_IN khi đã kết thúc thời gian sử dụng phòng (sang COMPLETED).
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

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN KIỂM TRA KHẢ DỤNG THỜI GIAN THỰC CỦA MỘT PHÒNG (REAL-TIME SPACE AVAILABILITY)
    // - Cơ chế: Quét đa tầng để thu thập toàn bộ các xung đột:
    //   1. Quét giải phóng các đơn chờ duyệt quá hạn để làm mới trạng thái phòng.
    //   2. Kiểm tra trạng thái phòng (MAINTENANCE) và các lịch bảo trì cụ thể (MaintenanceBlock).
    //   3. Kiểm tra các booking đang chiếm chỗ (PENDING_APPROVAL, CONFIRMED, CHECKED_IN) trong khung giờ [startTime, endTime].
    //   4. Trả về kết quả 'available = true' nếu danh sách xung đột (conflicts) hoàn toàn rỗng.
    // =========================================================================================================
    @Transactional
    public AvailabilityResponse checkSpaceAvailability(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = getCurrentDateTime();
        // Quét giải phóng các đơn chờ duyệt quá hạn.
        expirePendingApproval(now);

        // Tra cứu thông tin phòng.
        SpaceCatalogItem space = getSpaceCatalogItem(spaceId);
        if (space == null) {
            throw BusinessException.notFound("SPACE_NOT_FOUND", "Không tìm thấy phòng với ID: " + spaceId);
        }

        // Kiểm tra hợp lệ khung giờ và các hạn mức thời gian.
        validateBookingTimeLimits(startTime, endTime);

        List<ConflictDetail> conflicts = new ArrayList<>();

        // Kiểm tra trạng thái tĩnh của phòng có đang bảo trì hay không.
        if ("MAINTENANCE".equalsIgnoreCase(space.getStatus())) {
            conflicts.add(ConflictDetail.builder()
                    .type("SPACE_STATUS")
                    .referenceId(space.getId())
                    .startTime(startTime)
                    .endTime(endTime)
                    .description("Phòng hiện đang bảo trì bảo dưỡng")
                    .build());
        }

        // Kiểm tra các khối lịch bảo trì động giao nhau với khung giờ đặt.
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

        // Kiểm tra các đơn đặt chỗ đang chiếm chỗ trong khoảng thời gian yêu cầu.
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

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN TÌM KIẾM VÀ LỌC KHÔNG GIAN ĐA TIÊU CHÍ (MULTI-CRITERIA SPACE SEARCH FILTER)
    // - Cơ chế: Áp dụng phễu lọc 5 tiêu chí độc lập:
    //   1. Trạng thái không gian (status = AVAILABLE): Loại trừ phòng đang sửa chữa / ngừng phục vụ.
    //   2. Phù hợp sức chứa (supportsParticipantCount): Kiểm tra số người tham gia khớp với mô hình phòng (WHOLE_SPACE, PER_SEAT, PER_TABLE).
    //   3. Khớp bộ lọc loại phòng (spaceTypeId) và vị trí tòa nhà (building) nếu có lựa chọn.
    //   4. Thỏa mãn 100% tiện ích bắt buộc (facilityIds: Bảng trắng, TV, Điều hòa... - phép tập hợp containsAll).
    //   5. Khả dụng thực tế trong khung thời gian (isSpaceAvailableInInterval): Kiểm tra bảo trì và không bị phủ kín bởi booking khác.
    // =========================================================================================================
    @Transactional
    public List<SpaceResponse> searchAvailableSpaces(SearchSpaceFilter filter) {
        LocalDateTime now = getCurrentDateTime();
        // Quét giải phóng các đơn chờ duyệt quá hạn trước khi tìm kiếm.
        expirePendingApproval(now);

        LocalDateTime rawStart = resolveStartDateTime(filter);
        LocalDateTime rawEnd = resolveEndDateTime(filter);

        // Kiểm tra hợp lệ: Thời gian bắt đầu phải trước thời gian kết thúc.
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
                // Lớp lọc 1: Trạng thái không gian phải sẵn sàng (AVAILABLE).
                .filter(space -> "AVAILABLE".equalsIgnoreCase(space.getStatus()))
                .filter(space -> {
                    // Lớp lọc 2: Kiểm tra sức chứa phù hợp theo mô hình đặt chỗ.
                    if (!supportsParticipantCount(space, requestedParticipants)) {
                        return false;
                    }
                    // Lớp lọc 3: Khớp loại không gian (nếu người dùng có chọn bộ lọc loại phòng).
                    if (filter.getSpaceTypeId() != null && !space.getSpaceTypeId().equals(filter.getSpaceTypeId())) {
                        return false;
                    }
                    // Lớp lọc 4: Khớp khu vực tòa nhà (nếu người dùng có chọn bộ lọc tòa nhà).
                    if (filter.getBuilding() != null && !filter.getBuilding().isBlank()
                            && !space.getBuilding().equalsIgnoreCase(filter.getBuilding())) {
                        return false;
                    }
                    // Lớp lọc 5: Thỏa mãn toàn bộ danh sách tiện ích được yêu cầu.
                    if (filter.getFacilityIds() != null && !filter.getFacilityIds().isEmpty()) {
                        if (space.getFacilityIds() == null || !space.getFacilityIds().containsAll(filter.getFacilityIds())) {
                            return false;
                        }
                    }

                    // Lớp lọc 6: Kiểm tra tính khả dụng thực tế trong khung giờ theo mô hình đặt chỗ.
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
                    // Ánh xạ sang SpaceResponse DTO kèm đánh dấu trạng thái khả dụng.
                    boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
                    boolean isPerTable = "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
                    List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> mDtos = getUpcomingMaintenanceDtos(space.getId());
                    com.eduspace.backend.staff.dto.response.MaintenanceResponseKT nextM = mDtos.isEmpty() ? null : mDtos.get(0);

                    SpaceResponse resp = mapToResponse(space);
                    resp.setIsAvailable(true);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    // Kiểm tra số lượng người tham gia có thỏa mãn quy tắc của mô hình đặt chỗ hay không.
    public boolean supportsParticipantCount(SpaceCatalogItem space, int participantCount) {
        if (space == null || participantCount < 1) return false;

        if (isWholeSpace(space)) return space.getCapacity() >= participantCount;
        if (isPerSeat(space)) return participantCount == 1;
        return isPerTable(space) && space.getCapacity() >= participantCount;
    }

    // Kiểm tra phòng có sẵn tài nguyên hoạt động (ghế hoặc bàn AVAILABLE) đáp ứng số người hay không.
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

    // Lớp dữ liệu đại diện cho một khoảng thời gian (bắt đầu - kết thúc) và thời lượng tính theo phút.
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

    // Gộp các khoảng thời gian bận liên tiếp hoặc chồng chéo nhau thành danh sách khoảng thời gian tối giản.
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

    // Tìm các khe thời gian rảnh (gap) giữa các khoảng thời gian bận trong một khung cửa sổ tra cứu.
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

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN KIỂM TRA KHẢ DỤNG KHUNG THỜI GIAN THEO MÔ HÌNH ĐẶT CHỖ (INTERVAL AVAILABILITY ENGINE)
    // - Cơ chế:
    //   1. Kiểm tra lịch bảo trì: Nếu có block bảo trì giao thoa trong khung giờ -> Phòng không khả dụng (false).
    //   2. Nếu có đơn đặt trọn phòng (Whole Room Booking) -> Khóa toàn bộ phòng, bàn, ghế (false).
    //   3. Với WHOLE_SPACE: Không được có bất kỳ booking nào chiếm chỗ trong khoảng [searchStart, searchEnd].
    //   4. Với PER_SEAT: Lấy tập hợp mã ghế đã chiếm (occupiedSeatCodes). Phòng khả dụng nếu còn ít nhất 1 ghế AVAILABLE chưa bị đặt.
    //   5. Với PER_TABLE: Lọc các bàn AVAILABLE có sức chứa >= requestedParticipants và chưa bị giữ chỗ bởi bất kỳ booking nào.
    // =========================================================================================================
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

        // Kiểm tra lịch bảo trì giao nhau với khoảng thời gian tra cứu.
        List<com.eduspace.backend.space.entity.MaintenanceBlock> maintenanceBlocks = Collections.emptyList();
        if (bookingMaintenanceRepository != null) {
            maintenanceBlocks = bookingMaintenanceRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        } else if (maintenanceBlockRepository != null) {
            maintenanceBlocks = maintenanceBlockRepository.findOverlappingBlocks(space.getId(), searchStart, searchEnd);
        }
        if (!maintenanceBlocks.isEmpty()) return false;

        // Truy vấn các đơn đặt chỗ đang chiếm chỗ giao thoa với khoảng thời gian tra cứu.
        List<Booking> overlappingBookings = bookingRepository.findOverlappingSpaceBookings(
                space.getId(), searchStart, searchEnd, OCCUPYING_STATUSES
        );

        // Với WHOLE_SPACE: Phòng chỉ khả dụng khi hoàn toàn không có booking nào trong khung giờ.
        if (isWholeSpace(space)) {
            return overlappingBookings.isEmpty();
        }

        // Với PER_SEAT hoặc PER_TABLE: Nếu có booking đặt trọn phòng thì cả phòng đều bị khóa.
        boolean hasWholeRoomBooking = overlappingBookings.stream()
                .anyMatch(booking -> booking.getTableId() == null && booking.getSelectedSeatsList().isEmpty());
        if (hasWholeRoomBooking) return false;

        // Với PER_SEAT: Kiểm tra còn ít nhất 1 vị trí ghế khả dụng chưa bị đặt.
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

        // Với PER_TABLE: Kiểm tra còn ít nhất 1 bàn khả dụng có sức chứa phù hợp chưa bị đặt.
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

    // Lấy danh sách lịch bảo trì sắp diễn ra của một không gian.
    public List<com.eduspace.backend.staff.dto.response.MaintenanceResponseKT> getUpcomingMaintenancesBySpace(Long spaceId) {
        return getUpcomingMaintenanceDtos(spaceId);
    }

    // Lấy danh sách toàn bộ không gian phòng học trong hệ thống.
    public List<SpaceResponse> getAllSpaces() {
        return getAllCatalogItems().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Tra cứu thông tin chi tiết một phòng theo ID kèm tiện ích và trạng thái.
    public SpaceResponse getSpaceById(Long id) {
        SpaceCatalogItem space = getSpaceCatalogItem(id);
        if (space == null) {
            throw BusinessException.notFound("SPACE_NOT_FOUND", "Không tìm thấy phòng với ID: " + id);
        }
        return mapToResponse(space);
    }

    // Kiểm tra không gian có thuộc chế độ đặt theo từng ghế lẻ (PER_SEAT) hay không.
    public boolean isPerSeat(SpaceCatalogItem space) {
        return space != null && "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
    }

    // Kiểm tra không gian có thuộc chế độ đặt theo từng bàn (PER_TABLE) hay không.
    public boolean isPerTable(SpaceCatalogItem space) {
        return space != null && "PER_TABLE".equalsIgnoreCase(space.getBookingMode());
    }

    // Kiểm tra không gian có thuộc chế độ đặt trọn gói nguyên phòng (WHOLE_SPACE) hay không.
    public boolean isWholeSpace(SpaceCatalogItem space) {
        return space == null || "WHOLE_SPACE".equalsIgnoreCase(space.getBookingMode());
    }

    // Ánh xạ SpaceCatalogItem sang SpaceResponse DTO kèm tính toán số lượng ghế/bàn hoạt động từ CSDL.
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

    // Lấy danh mục các loại không gian (Space Types) phục vụ hiển thị bộ lọc tìm kiếm.
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

    // Lấy danh mục các trang thiết bị tiện ích (Facilities) phục vụ bộ lọc tìm kiếm.
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

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN KIỂM TRA HẠN MỨC KHUNG GIỜ VÀ CHÍNH SÁCH VẬN HÀNH (POLICY TIME VALIDATOR)
    // - Cơ chế kiểm tra 4 cấp độ:
    //   1. Thời gian tương lai: Chặn đặt phòng vào thời điểm quá khứ (startTime < now).
    //   2. Khung giờ hoạt động: Giờ đặt phải nằm hoàn toàn trong khung mở/đóng cửa của trường (VD: 07:00 - 22:00 từ PolicyService).
    //   3. Thời lượng tối đa: Thời lượng (durationMinutes) không được vượt quá hạn mức tối đa cho phép (mặc định 180 phút / 3 tiếng).
    //   4. Số ngày đặt trước: Khoảng cách từ hôm nay tới ngày đặt không được vượt quá số ngày cho phép (mặc định 7 ngày).
    // =========================================================================================================
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

        // Lấy khung giờ mở/đóng cửa từ hệ thống chính sách vận hành (PolicyService).
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

        // Kiểm tra thời lượng đặt phòng tối đa cho một ca.
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

        // Kiểm tra số ngày được phép đặt trước tối đa.
        long maxAdvanceDays = getPolicyLong("MAX_ADVANCE_DAYS", 7L);
        if (ChronoUnit.DAYS.between(LocalDate.now(), startTime.toLocalDate()) > maxAdvanceDays) {
            throw BusinessException.badRequest("ADVANCE_DAYS_EXCEEDED",
                    "Chỉ được phép đặt phòng trước tối đa " + maxAdvanceDays + " ngày");
        }
    }

    // Đọc giá trị cấu hình số nguyên từ dịch vụ chính sách (kèm giá trị mặc định dự phòng).
    public long getPolicyLong(String key, long defaultValue) {
        return policyService.getLong(key, defaultValue);
    }

    // =========================================================================================================
    // [LÕI HỆ THỐNG] THUẬT TOÁN TRÍCH XUẤT GHẾ & BÀN ĐANG BẬN CHO SƠ ĐỒ THỜI GIAN THỰC (SEAT MAP ENGINE)
    // - Cơ chế:
    //   1. Quét giải phóng các đơn chờ duyệt quá hạn để đồng bộ trạng thái mới nhất.
    //   2. Nếu phòng có đơn đặt trọn gói (Whole Room): Toàn bộ danh sách ghế và bàn trong phòng tự động chuyển sang bận.
    //   3. Nếu phòng đặt theo ghế/bàn: Thu thập tất cả mã ghế (selectedSeatsList) và mã bàn (tableCode) từ các đơn
    //      đang chiếm chỗ giao thoa thời gian (PENDING_APPROVAL, CONFIRMED, CHECKED_IN).
    //   4. Trả về tập danh sách mã duy nhất (distinct) để Frontend đổi màu hiển thị trên sơ đồ ghế.
    // =========================================================================================================
    @Transactional
    public List<String> getOccupiedSeats(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        if (spaceId == null || startTime == null || endTime == null) {
            return Collections.emptyList();
        }
        expirePendingApproval(getCurrentDateTime());
        List<Booking> overlapping = bookingRepository.findOverlappingSpaceBookings(
                spaceId, startTime, endTime, OCCUPYING_STATUSES
        );

        // Trường hợp phòng bị đặt trọn gói: Khóa toàn bộ ghế và bàn trong phòng.
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

        // Trường hợp đặt theo ghế hoặc theo bàn: Trích xuất các vị trí cụ thể đã bị chiếm chỗ.
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

    // Sinh danh sách mã ghế tự động theo định dạng hàng cột (A1, A2...) dựa vào sức chứa phòng.
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

    // Trích xuất thời điểm bắt đầu tìm kiếm từ bộ lọc thời gian.
    private LocalDateTime resolveStartDateTime(SearchSpaceFilter filter) {
        if (filter.getStartDateTime() != null) return filter.getStartDateTime();
        if (filter.getDate() != null && filter.getStartTime() != null) {
            return LocalDateTime.of(filter.getDate(), filter.getStartTime());
        }
        return null;
    }

    // Trích xuất thời điểm kết thúc tìm kiếm từ bộ lọc thời gian.
    private LocalDateTime resolveEndDateTime(SearchSpaceFilter filter) {
        if (filter.getEndDateTime() != null) return filter.getEndDateTime();
        if (filter.getDate() != null && filter.getEndTime() != null) {
            return LocalDateTime.of(filter.getDate(), filter.getEndTime());
        }
        return null;
    }

    // Chuẩn hóa chuỗi thời gian về định dạng chuẩn HH:mm (ví dụ "07:00", "22:00").
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

    // Lấy thông tin thời gian mở/đóng cửa và hạn mức hệ thống từ CSDL chính sách và chuẩn hóa HH:mm.
    public com.eduspace.backend.policy.dto.response.PolicyResponse getOperatingHours() {
        var policy = policyService.getCurrentPolicy();
        if (policy != null) {
            policy.setOpeningHour(normalizeTimeStr(policy.getOpeningHour(), "07:00"));
            policy.setClosingHour(normalizeTimeStr(policy.getClosingHour(), "22:00"));
        }
        return policy;
    }
}

