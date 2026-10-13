package com.eduspace.backend.space.service;

import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.space.dto.request.SpaceCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.entity.*;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.common.exception.BusinessException;
import com.eduspace.backend.space.dto.response.SpaceImageResponseKT;
import com.eduspace.backend.space.repository.FacilityRepository;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceImageRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import com.eduspace.backend.staff.repository.MaintenanceBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private static final Set<BookingStatus> DELETE_BLOCKING_BOOKING_STATUSES = Set.of(
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    private final SpaceRepository spaceRepository;
    private final SpaceTypeRepository spaceTypeRepository;
    private final FacilityRepository facilityRepository;
    private final SeatRepository seatRepository;
    private final SpaceTableRepository spaceTableRepository;
    private final SpaceImageRepository spaceImageRepository;
    private final BookingRepository bookingRepository;
    private final MaintenanceBlockRepository maintenanceBlockRepository;

    @Transactional(readOnly = true)
    public List<SpaceResponseKT> getSpacesFiltered(
            Long spaceTypeId,
            SpaceStatus status,
            String building,
            Integer minCapacity,
            Long facilityId,
            BookingMode bookingMode
    ) {
        List<Space> spaces = spaceRepository.filterSpaces(
                spaceTypeId,
                status,
                building != null && !building.trim().isEmpty() ? building.trim() : null,
                minCapacity,
                facilityId,
                bookingMode
        );

        return spaces.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpaceResponseKT> getAllSpaces() {
        return spaceRepository.findAllByDeletedAtIsNullOrderByIdDesc().stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    // Lấy thông tin chi tiết một phòng theo ID
    @Transactional(readOnly = true)
    public SpaceResponseKT getSpaceById(Long id) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + id
                ));
        return toResponseDto(space);
    }

    // Tạo mới không gian (phòng) kèm tiện ích và kiểm tra trùng mã phòng
    @Transactional
    public SpaceResponseKT createSpace(SpaceCreateRequestKT request) {
        // 1. Kiểm tra loại phòng có tồn tại và chưa bị xóa mềm
        SpaceType spaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(request.getSpaceTypeId())
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_TYPE_NOT_FOUND",
                        "Không tìm thấy loại phòng với id: " + request.getSpaceTypeId()
                ));

        // 2. Tìm và nạp danh sách tiện ích hợp lệ từ facilityIds
        Set<Facility> facilities = new HashSet<>();
        if (request.getFacilityIds() != null && !request.getFacilityIds().isEmpty()) {
            for (Long facId : request.getFacilityIds()) {
                Facility fac = facilityRepository.findByIdAndDeletedAtIsNull(facId)
                        .orElseThrow(() -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "FACILITY_NOT_FOUND",
                                "Không tìm thấy tiện ích với id: " + facId
                        ));
                facilities.add(fac);
            }
        }

        // 3. Kiểm tra mã phòng không được để trống
        String spaceCode = request.getSpaceCode() != null ? request.getSpaceCode().trim() : "";
        if (spaceCode.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_CODE_REQUIRED",
                    "Mã không gian không được để trống."
            );
        }

        // 4. Kiểm tra trùng mã phòng trong hệ thống (không phân biệt hoa thường)
        if (spaceRepository.existsBySpaceCodeIgnoreCaseAndDeletedAtIsNull(spaceCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SPACE_CODE_EXISTS",
                    "Mã không gian '" + spaceCode + "' đã tồn tại trong hệ thống."
            );
        }

        // 5. Tạo đối tượng Space mới từ dữ liệu gửi lên
        Space space = Space.builder()
                .name(request.getName().trim())
                .spaceCode(spaceCode)
                .spaceType(spaceType)
                .building(request.getBuilding().trim())
                .floor(request.getFloor().trim())
                .capacity(request.getCapacity())
                .status(request.getStatus())
                .description(request.getDescription())
                .facilities(facilities)
                .build();

        // 6. Lưu vào database và chuyển đổi sang DTO trả về cho client
        Space savedSpace = spaceRepository.save(space);
        return toResponseDto(savedSpace);
    }

    // Cập nhật thông tin phòng (kiểm tra trùng mã phòng, ràng buộc sức chứa bàn/ghế)
    @Transactional
    public SpaceResponseKT updateSpace(Long id, SpaceUpdateRequestKT request) {
        // 1. Tìm phòng cần sửa theo ID (phải chưa bị xóa mềm)
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + id
                ));

        // 2. Kiểm tra mã phòng không được để trống
        String newCode = request.getSpaceCode() != null ? request.getSpaceCode().trim() : "";
        if (newCode.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_CODE_REQUIRED",
                    "Mã không gian không được để trống."
            );
        }

        // 3. Nếu đổi sang mã phòng mới, kiểm tra xem mã mới có trùng với phòng khác không
        if (!newCode.equalsIgnoreCase(space.getSpaceCode())) {
            if (spaceRepository.existsBySpaceCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(newCode, id)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SPACE_CODE_EXISTS",
                        "Mã không gian '" + newCode + "' đã tồn tại trong hệ thống."
                );
            }
            space.setSpaceCode(newCode);
        }

        // 4. Lấy số ghế đang hoạt động trong phòng để kiểm tra ràng buộc
        long activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(id);
        String capacityErrorCode = null;
        String capacityErrorMessage = null;

        // Ràng buộc 1: Phòng theo ghế thì Sức chứa mới KHÔNG ĐƯỢC nhỏ hơn số ghế đang có
        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT) {
            if (request.getCapacity() < activeSeatCount) {
                capacityErrorCode = "CAPACITY_LOWER_THAN_ACTIVE_SEATS";
                capacityErrorMessage = "Sức chứa mới (" + request.getCapacity()
                        + ") không thể nhỏ hơn số chỗ ngồi đang hoạt động (" + activeSeatCount + " chỗ).";
            }
        }

        // Ràng buộc 2: Phòng theo bàn thì Sức chứa mới KHÔNG ĐƯỢC nhỏ hơn tổng sức chứa các bàn
        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE) {
            int activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(id);
            if (request.getCapacity() < activeTableCapacity) {
                capacityErrorCode = "CAPACITY_LOWER_THAN_ACTIVE_TABLE_CAPACITY";
                capacityErrorMessage = "Sức chứa mới (" + request.getCapacity()
                        + ") không thể nhỏ hơn tổng sức chứa của các bàn đang hoạt động ("
                        + activeTableCapacity + " chỗ).";
            }
        }

        // 5. Kiểm tra ràng buộc khi đổi sang Loại phòng mới
        SpaceType targetSpaceType = space.getSpaceType();
        String spaceTypeErrorCode = null;
        String spaceTypeErrorMessage = null;

        if (request.getSpaceTypeId() != null && !request.getSpaceTypeId().equals(space.getSpaceType().getId())) {
            targetSpaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(request.getSpaceTypeId())
                    .orElseThrow(() -> new AppException(
                            HttpStatus.NOT_FOUND,
                            "SPACE_TYPE_NOT_FOUND",
                            "Không tìm thấy loại phòng với id: " + request.getSpaceTypeId()
                    ));

            // Nếu đang có ghế hoạt động thì không cho đổi sang loại phòng không hỗ trợ ghế
            if (space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT
                    && targetSpaceType.getBookingMode() != BookingMode.PER_SEAT
                    && activeSeatCount > 0) {
                spaceTypeErrorCode = "SPACE_HAS_ACTIVE_SEATS";
                spaceTypeErrorMessage = "Không thể chuyển loại phòng vì không gian đang có "
                        + activeSeatCount + " chỗ ngồi hoạt động.";
            }

            // Nếu đang có bàn hoạt động thì không cho đổi sang loại phòng không hỗ trợ bàn
            if (space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE
                    && targetSpaceType.getBookingMode() != BookingMode.PER_TABLE) {
                long activeTableCount = spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(id);
                if (activeTableCount > 0) {
                    spaceTypeErrorCode = "SPACE_HAS_ACTIVE_TABLES";
                    spaceTypeErrorMessage = "Không thể chuyển loại phòng vì không gian đang có "
                            + activeTableCount + " bàn hoạt động.";
                }
            }
        }

        // Tổng hợp các lỗi ràng buộc để báo cho client
        List<String> constraintDetails = new ArrayList<>();
        if (capacityErrorMessage != null) {
            constraintDetails.add("capacity: " + capacityErrorMessage);
        }
        if (spaceTypeErrorMessage != null) {
            constraintDetails.add("spaceTypeId: " + spaceTypeErrorMessage);
        }

        if (constraintDetails.size() > 1) {
            throw BusinessException.conflict(
                    "SPACE_UPDATE_CONSTRAINT_VIOLATIONS",
                    "Không thể cập nhật không gian vì có nhiều thông tin chưa phù hợp.",
                    constraintDetails
            );
        }
        if (capacityErrorMessage != null) {
            throw new AppException(HttpStatus.CONFLICT, capacityErrorCode, capacityErrorMessage);
        }
        if (spaceTypeErrorMessage != null) {
            throw new AppException(HttpStatus.CONFLICT, spaceTypeErrorCode, spaceTypeErrorMessage);
        }

        // 6. Cập nhật danh sách tiện ích mới cho phòng
        if (request.getFacilityIds() != null) {
            Set<Facility> newFacilities = new HashSet<>();
            for (Long facId : request.getFacilityIds()) {
                Facility fac = facilityRepository.findByIdAndDeletedAtIsNull(facId)
                        .orElseThrow(() -> new AppException(
                                HttpStatus.NOT_FOUND,
                                "FACILITY_NOT_FOUND",
                                "Không tìm thấy tiện ích với id: " + facId
                        ));
                newFacilities.add(fac);
            }
            space.setFacilities(newFacilities);
        }

        // 7. Cập nhật các thông số cơ bản và lưu vào database
        space.setName(request.getName().trim());
        space.setSpaceType(targetSpaceType);
        space.setBuilding(request.getBuilding().trim());
        space.setFloor(request.getFloor().trim());
        space.setCapacity(request.getCapacity());
        space.setStatus(request.getStatus());
        space.setDescription(request.getDescription());

        Space updatedSpace = spaceRepository.save(space);
        return toResponseDto(updatedSpace);
    }

    /**
     * Soft delete Space:
     * 1. Tìm Space có deleted_at IS NULL
     * 2. Nếu không có -> 404 SPACE_NOT_FOUND
     * 3. Chặn xóa nếu còn booking chiếm chỗ chưa kết thúc hoặc lịch bảo trì chưa kết thúc
     * 4. set status = INACTIVE
     * 5. set deleted_at = now
     * 6. Soft delete toàn bộ Seat active thuộc Space (status = INACTIVE, deleted_at = now)
     * 7. Soft delete toàn bộ SpaceTable active thuộc Space (status = INACTIVE, deleted_at = now)
     * 8. save (Toàn bộ trong @Transactional)
     */
    // Xóa mềm phòng (chặn xóa nếu còn booking/bảo trì, tự động xóa mềm cả bàn và ghế con)
    @Transactional
    public void deleteSpace(Long id) {
        // 1. Tìm phòng cần xóa (phải chưa bị xóa mềm)
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + id
                ));

        // 2. Đếm số lượng booking và lịch bảo trì chưa kết thúc
        LocalDateTime now = LocalDateTime.now();
        long blockingBookingCount = bookingRepository.countBlockingBookingsForSpaceDeletion(
                id,
                DELETE_BLOCKING_BOOKING_STATUSES,
                now
        );
        long blockingMaintenanceCount = maintenanceBlockRepository.countBlockingBlocksForSpaceDeletion(id, now);

        List<String> deleteConstraintDetails = new ArrayList<>();
        if (blockingBookingCount > 0) {
            deleteConstraintDetails.add("bookings: Không gian đang có " + blockingBookingCount
                    + " booking đang diễn ra hoặc sắp diễn ra.");
        }
        if (blockingMaintenanceCount > 0) {
            deleteConstraintDetails.add("maintenances: Không gian đang có " + blockingMaintenanceCount
                    + " lịch bảo trì đang diễn ra hoặc sắp diễn ra.");
        }

        // 3. Nếu còn booking hoặc lịch bảo trì -> CHẶN XÓA và ném lỗi 409 Conflict
        if (!deleteConstraintDetails.isEmpty()) {
            String errorCode;
            String errorMessage;
            if (blockingBookingCount > 0 && blockingMaintenanceCount > 0) {
                errorCode = "SPACE_HAS_ACTIVE_BOOKINGS_AND_MAINTENANCES";
                errorMessage = "Không thể xóa không gian vì còn booking và lịch bảo trì chưa kết thúc.";
            } else if (blockingBookingCount > 0) {
                errorCode = "SPACE_HAS_ACTIVE_BOOKINGS";
                errorMessage = "Không thể xóa không gian vì còn booking chưa kết thúc.";
            } else {
                errorCode = "SPACE_HAS_ACTIVE_MAINTENANCES";
                errorMessage = "Không thể xóa không gian vì còn lịch bảo trì chưa kết thúc.";
            }

            throw BusinessException.conflict(errorCode, errorMessage, deleteConstraintDetails);
        }

        // 4. Đổi trạng thái phòng sang INACTIVE và set thời gian xóa mềm
        space.setStatus(SpaceStatus.INACTIVE);
        space.setDeletedAt(now);

        // 5. Cascade soft-delete: Tự động xóa mềm toàn bộ Ghế (Seat) đang hoạt động thuộc phòng này
        List<Seat> activeSeats = seatRepository.findBySpaceIdAndDeletedAtIsNull(id);
        for (Seat seat : activeSeats) {
            seat.setStatus(SeatStatus.INACTIVE);
            seat.setDeletedAt(now);
        }
        seatRepository.saveAll(activeSeats);

        // 6. Cascade soft-delete: Tự động xóa mềm toàn bộ Bàn (SpaceTable) đang hoạt động thuộc phòng này
        List<SpaceTable> activeTables = spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(id);
        for (SpaceTable table : activeTables) {
            table.setStatus(SpaceTableStatus.INACTIVE);
            table.setDeletedAt(now);
        }
        spaceTableRepository.saveAll(activeTables);

        // 7. Lưu lại phòng vào database
        spaceRepository.save(space);
    }

    // Chuyển đổi Entity Space sang DTO Response (kèm đếm số bàn/ghế hoạt động và lấy ảnh đại diện)
    private SpaceResponseKT toResponseDto(Space space) {
        long activeSeatCount = 0;
        long activeTableCount = 0;
        int activeTableCapacity = 0;

        // 1. Đếm số ghế hoặc số bàn đang hoạt động tùy theo hình thức đặt phòng
        if (space.getSpaceType() != null) {
            if (space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT) {
                activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
            } else if (space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE) {
                activeTableCount = spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
                activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(space.getId());
            }
        }

        // 2. Lấy danh sách hình ảnh của phòng (xếp theo thứ tự hiển thị)
        List<SpaceImage> spaceImages = spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(space.getId());
        List<SpaceImageResponseKT> imageDtos = spaceImages.stream()
                .map(SpaceImageResponseKT::fromEntity)
                .collect(Collectors.toList());

        // 3. Tìm link ảnh đại diện chính (isPrimary = true)
        String primaryImageUrl = spaceImages.stream()
                .filter(SpaceImage::isPrimary)
                .findFirst()
                .map(SpaceImage::getImageUrl)
                .orElse(null);

        // 4. Đóng gói tất cả vào DTO Response trả về
        return SpaceResponseKT.fromEntity(
                space,
                activeSeatCount,
                activeTableCount,
                activeTableCapacity,
                primaryImageUrl,
                imageDtos
        );
    }
}
