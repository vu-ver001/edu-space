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
import com.eduspace.backend.booking.repository.BookingPolicyRepository;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.space.entity.Facility;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.repository.SpaceRepository;

/**
 * Phân hệ Kiểm tra Khả dụng Tổng hợp & Tìm kiếm Phòng (Module M03).
 * Phụ trách: Nguyễn Thị Khánh Vân (Lead kỹ thuật).
 * 
 * Tích hợp trực tiếp CSDL không gian của Kim Tuyến và hỗ trợ fallback dự phòng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvailabilityService {

    private final BookingRepository bookingRepository;
    private final BookingAuditLogRepository auditLogRepository;
    private final BookingPolicyRepository policyRepository;
    private final SpaceRepository spaceRepository;

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
    }

    // Danh mục phòng học chuẩn EduSpace đồng bộ hoàn toàn với CSDL của Kim Tuyến
    private static final Map<Long, SpaceCatalogItem> SPACE_CATALOG = new LinkedHashMap<>();

    static {
        SPACE_CATALOG.put(1L, SpaceCatalogItem.builder()
                .id(1L).name("Phòng G-101").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(false).building("Tòa A").floor("1").capacity(6).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop")
                .description("Phòng học nhóm tầng 1, gần sảnh chờ (WHOLE_SPACE)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());

        SPACE_CATALOG.put(2L, SpaceCatalogItem.builder()
                .id(2L).name("Phòng G-102").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(false).building("Tòa A").floor("1").capacity(8).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop")
                .description("Phòng học nhóm cỡ vừa, trang bị bảng và màn hình lớn (WHOLE_SPACE)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Màn hình TV thông minh 65 inch", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());

        SPACE_CATALOG.put(3L, SpaceCatalogItem.builder()
                .id(3L).name("Phòng P-201").spaceTypeId(2L).spaceTypeName("Phòng thuyết trình & Hội thảo")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(true).building("Tòa A").floor("2").capacity(20).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&auto=format&fit=crop")
                .description("Phòng thuyết trình chuyên dụng, cách âm. Bắt buộc Staff duyệt (WHOLE_SPACE)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Máy chiếu Full HD", "Màn hình TV thông minh 65 inch", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());

        SPACE_CATALOG.put(4L, SpaceCatalogItem.builder()
                .id(4L).name("Khu tự học S-201").spaceTypeId(3L).spaceTypeName("Khu tự học chung (Mở)")
                .bookingMode("PER_SEAT")
                .requiresApproval(false).building("Tòa B").floor("2").capacity(10).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop")
                .description("Khu tự học chung tầng 2, sức chứa 10 chỗ ngồi độc lập. Hỗ trợ chọn theo từng ghế (PER_SEAT)")
                .facilities(List.of("Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());

        SPACE_CATALOG.put(5L, SpaceCatalogItem.builder()
                .id(5L).name("Study Booth B-01").spaceTypeId(4L).spaceTypeName("Study Booth cá nhân")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(false).building("Tòa B").floor("3").capacity(2).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop")
                .description("Khoang tự học yên tĩnh, bàn đôi, đặt phòng như bình thường (WHOLE_SPACE)")
                .facilities(List.of("Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());

        SPACE_CATALOG.put(6L, SpaceCatalogItem.builder()
                .id(6L).name("Phòng G-103 (Bảo trì)").spaceTypeId(1L).spaceTypeName("Phòng học nhóm tiêu chuẩn")
                .bookingMode("WHOLE_SPACE")
                .requiresApproval(false).building("Tòa A").floor("1").capacity(6).status("MAINTENANCE")
                .imageUrl("https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop")
                .description("Phòng đang cải tạo hệ thống điện, tạm ngừng phục vụ")
                .facilities(List.of("Bảng trắng & Bút dạ")).build());

        SPACE_CATALOG.put(7L, SpaceCatalogItem.builder()
                .id(7L).name("Phòng D-201").spaceTypeId(5L).spaceTypeName("Phòng thảo luận theo bàn")
                .bookingMode("PER_TABLE")
                .requiresApproval(false).building("Tòa D").floor("2").capacity(24).status("AVAILABLE")
                .imageUrl("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop")
                .description("Phòng thảo luận nhóm tầng 2, sức chứa 24 chỗ chia thành 4 bàn. Hỗ trợ chọn theo bàn (PER_TABLE)")
                .facilities(List.of("Bảng trắng & Bút dạ", "Ổ cắm điện đa năng", "Điều hòa không khí 2 chiều")).build());
    }

    private SpaceCatalogItem mapSpaceToCatalogItem(Space space) {
        if (space == null) return null;
        List<String> facilityNames = (space.getFacilities() != null)
                ? space.getFacilities().stream()
                        .filter(f -> f != null && f.getDeletedAt() == null)
                        .map(Facility::getName)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        String bookingMode = (space.getSpaceType() != null && space.getSpaceType().getBookingMode() != null)
                ? space.getSpaceType().getBookingMode().name()
                : "WHOLE_SPACE";
        boolean requiresApproval = space.getSpaceType() != null && space.getSpaceType().isRequiresApproval();
        String typeName = space.getSpaceType() != null ? space.getSpaceType().getName() : "Phòng học tiêu chuẩn";
        Long typeId = space.getSpaceType() != null ? space.getSpaceType().getId() : 1L;
        String statusStr = space.getStatus() != null ? space.getStatus().name() : "AVAILABLE";

        String img = (space.getId() != null && SPACE_CATALOG.containsKey(space.getId()))
                ? SPACE_CATALOG.get(space.getId()).getImageUrl()
                : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop";

        return SpaceCatalogItem.builder()
                .id(space.getId())
                .name(space.getName())
                .spaceTypeId(typeId)
                .spaceTypeName(typeName)
                .bookingMode(bookingMode)
                .requiresApproval(requiresApproval)
                .building(space.getBuilding())
                .floor(space.getFloor())
                .capacity(space.getCapacity() != null ? space.getCapacity() : 10)
                .status(statusStr)
                .imageUrl(img)
                .description(space.getDescription())
                .facilities(facilityNames)
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
     * API kiểm tra khả dụng của một phòng cụ thể (02_Yeu_cau_logic §3.1).
     */
    @Transactional
    public AvailabilityResponse checkSpaceAvailability(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();
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
        LocalDateTime now = LocalDateTime.now();
        expirePendingApproval(now);

        LocalDateTime rawStart = resolveStartDateTime(filter);
        LocalDateTime rawEnd = resolveEndDateTime(filter);

        final LocalDateTime effectiveStart = (rawStart != null && rawStart.isBefore(now)) ? now : rawStart;
        final LocalDateTime effectiveEnd = rawEnd;

        return getAllCatalogItems().stream()
                .filter(space -> "AVAILABLE".equalsIgnoreCase(space.getStatus()))
                .filter(space -> {
                    if (filter.getParticipantCount() != null && space.getCapacity() < filter.getParticipantCount()) {
                        return false;
                    }
                    if (filter.getSpaceTypeId() != null && !space.getSpaceTypeId().equals(filter.getSpaceTypeId())) {
                        return false;
                    }
                    if (filter.getBuilding() != null && !filter.getBuilding().isBlank()
                            && !space.getBuilding().equalsIgnoreCase(filter.getBuilding())) {
                        return false;
                    }
                    return true;
                })
                .map(space -> {
                    boolean isAvailable = true;
                    if (effectiveStart != null && effectiveEnd != null) {
                        boolean hasBooking = !bookingRepository.findOverlappingSpaceBookings(
                                space.getId(), effectiveStart, effectiveEnd, OCCUPYING_STATUSES
                        ).isEmpty();
                        isAvailable = !hasBooking;
                    }
                    boolean isPerSeat = "PER_SEAT".equalsIgnoreCase(space.getBookingMode());
                    boolean isPerTable = "PER_TABLE".equalsIgnoreCase(space.getBookingMode());

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
                            .allowSeatSelection(isPerSeat)
                            .allowTableSelection(isPerTable)
                            .build();
                })
                .collect(Collectors.toList());
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

    public boolean isStudyBooth(String spaceTypeName) {
        if (spaceTypeName == null) return false;
        String lower = spaceTypeName.toLowerCase();
        return lower.contains("booth") || lower.contains("cá nhân");
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
                .allowSeatSelection(isPerSeat)
                .allowTableSelection(isPerTable)
                .build();
    }

    public List<java.util.Map<String, Object>> getSpaceTypes() {
        return List.of(
                java.util.Map.of("id", 1L, "name", "Phòng học nhóm tiêu chuẩn", "bookingMode", "WHOLE_SPACE", "requiresApproval", false, "description", "Đặt nguyên phòng 4-6 chỗ"),
                java.util.Map.of("id", 2L, "name", "Phòng thuyết trình & Hội thảo", "bookingMode", "WHOLE_SPACE", "requiresApproval", true, "description", "Đặt nguyên phòng, cần Staff duyệt"),
                java.util.Map.of("id", 3L, "name", "Khu tự học chung (Mở)", "bookingMode", "PER_SEAT", "requiresApproval", false, "description", "Không gian tự học chung, đặt theo từng ghế (S01-S10)"),
                java.util.Map.of("id", 4L, "name", "Study Booth cá nhân", "bookingMode", "WHOLE_SPACE", "requiresApproval", false, "description", "Khoang tự học cách âm, đặt phòng bình thường"),
                java.util.Map.of("id", 5L, "name", "Phòng thảo luận theo bàn", "bookingMode", "PER_TABLE", "requiresApproval", false, "description", "Phòng thảo luận nhóm, đặt theo từng bàn (T01-T04)")
        );
    }

    public List<java.util.Map<String, Object>> getFacilities() {
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
        if (startTime.isBefore(LocalDateTime.now())) {
            throw BusinessException.badRequest("PAST_TIME_NOT_ALLOWED", "Không được đặt phòng vào thời điểm trong quá khứ");
        }

        LocalTime openTime = LocalTime.of(7, 0);
        LocalTime closeTime = LocalTime.of(22, 0);
        if (startTime.toLocalTime().isBefore(openTime) || endTime.toLocalTime().isAfter(closeTime) ||
            (endTime.toLocalTime().equals(LocalTime.MIDNIGHT) && !startTime.toLocalDate().equals(endTime.toLocalDate()))) {
            throw BusinessException.badRequest("OUTSIDE_OPERATING_HOURS",
                    "Không gian chỉ hoạt động trong khung giờ từ " + openTime + " đến " + closeTime);
        }

        long durationMinutes = ChronoUnit.MINUTES.between(startTime, endTime);
        long maxMinutes = getPolicyLong("MAX_BOOKING_HOURS_PER_SLOT", 3L) * 60;
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
        return policyRepository.findByPolicyKey(key)
                .map(p -> {
                    try {
                        return Long.parseLong(p.getPolicyValue());
                    } catch (Exception e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public List<String> getOccupiedSeats(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        if (spaceId == null || startTime == null || endTime == null) {
            return Collections.emptyList();
        }
        expirePendingApproval(LocalDateTime.now());
        List<Booking> overlapping = bookingRepository.findOverlappingSpaceBookings(
                spaceId, startTime, endTime, OCCUPYING_STATUSES
        );

        boolean wholeRoomOccupied = overlapping.stream()
                .anyMatch(b -> b.getSelectedSeatsList().isEmpty());

        if (wholeRoomOccupied) {
            SpaceCatalogItem space = SPACE_CATALOG.get(spaceId);
            int capacity = (space != null) ? space.getCapacity() : 30;
            return generateDefaultSeatCodes(capacity);
        }

        return overlapping.stream()
                .flatMap(b -> b.getSelectedSeatsList().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
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
}
