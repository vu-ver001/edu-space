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

    @Transactional
    public SpaceResponseKT createSpace(SpaceCreateRequestKT request) {
        SpaceType spaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(request.getSpaceTypeId())
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_TYPE_NOT_FOUND",
                        "Không tìm thấy loại phòng với id: " + request.getSpaceTypeId()
                ));

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

        String spaceCode = request.getSpaceCode() != null ? request.getSpaceCode().trim() : "";
        if (spaceCode.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_CODE_REQUIRED",
                    "Mã không gian không được để trống."
            );
        }

        if (spaceRepository.existsBySpaceCodeIgnoreCaseAndDeletedAtIsNull(spaceCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SPACE_CODE_EXISTS",
                    "Mã không gian '" + spaceCode + "' đã tồn tại trong hệ thống."
            );
        }

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

        Space savedSpace = spaceRepository.save(space);
        return toResponseDto(savedSpace);
    }

    @Transactional
    public SpaceResponseKT updateSpace(Long id, SpaceUpdateRequestKT request) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + id
                ));

        String newCode = request.getSpaceCode() != null ? request.getSpaceCode().trim() : "";
        if (newCode.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_CODE_REQUIRED",
                    "Mã không gian không được để trống."
            );
        }

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

        // Kiểm tra toàn bộ ràng buộc sức chứa và loại không gian trước khi trả lỗi,
        // để frontend có thể hiển thị đồng thời lỗi dưới tất cả trường liên quan.
        long activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(id);
        String capacityErrorCode = null;
        String capacityErrorMessage = null;

        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT) {
            if (request.getCapacity() < activeSeatCount) {
                capacityErrorCode = "CAPACITY_LOWER_THAN_ACTIVE_SEATS";
                capacityErrorMessage = "Sức chứa mới (" + request.getCapacity()
                        + ") không thể nhỏ hơn số chỗ ngồi đang hoạt động (" + activeSeatCount + " chỗ).";
            }
        }

        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE) {
            int activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(id);
            if (request.getCapacity() < activeTableCapacity) {
                capacityErrorCode = "CAPACITY_LOWER_THAN_ACTIVE_TABLE_CAPACITY";
                capacityErrorMessage = "Sức chứa mới (" + request.getCapacity()
                        + ") không thể nhỏ hơn tổng sức chứa của các bàn đang hoạt động ("
                        + activeTableCapacity + " chỗ).";
            }
        }

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

            if (space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT
                    && targetSpaceType.getBookingMode() != BookingMode.PER_SEAT
                    && activeSeatCount > 0) {
                spaceTypeErrorCode = "SPACE_HAS_ACTIVE_SEATS";
                spaceTypeErrorMessage = "Không thể chuyển loại phòng vì không gian đang có "
                        + activeSeatCount + " chỗ ngồi hoạt động.";
            }

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

        // Quy tắc 3: Cập nhật facilities (thay thế toàn bộ, báo lỗi nếu ID không tồn tại/đã xóa)
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
    @Transactional
    public void deleteSpace(Long id) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + id
                ));

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

        space.setStatus(SpaceStatus.INACTIVE);
        space.setDeletedAt(now);

        // Soft delete toàn bộ seat active thuộc space
        List<Seat> activeSeats = seatRepository.findBySpaceIdAndDeletedAtIsNull(id);
        for (Seat seat : activeSeats) {
            seat.setStatus(SeatStatus.INACTIVE);
            seat.setDeletedAt(now);
        }
        seatRepository.saveAll(activeSeats);

        // Soft delete toàn bộ table active thuộc space
        List<SpaceTable> activeTables = spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(id);
        for (SpaceTable table : activeTables) {
            table.setStatus(SpaceTableStatus.INACTIVE);
            table.setDeletedAt(now);
        }
        spaceTableRepository.saveAll(activeTables);

        spaceRepository.save(space);
    }

    private SpaceResponseKT toResponseDto(Space space) {
        long activeSeatCount = 0;
        long activeTableCount = 0;
        int activeTableCapacity = 0;

        if (space.getSpaceType() != null) {
            if (space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT) {
                activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
            } else if (space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE) {
                activeTableCount = spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(space.getId());
                activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(space.getId());
            }
        }
        List<SpaceImage> spaceImages = spaceImageRepository.findBySpaceIdOrderBySortOrderAscIdAsc(space.getId());
        List<SpaceImageResponseKT> imageDtos = spaceImages.stream()
                .map(SpaceImageResponseKT::fromEntity)
                .collect(Collectors.toList());
        String primaryImageUrl = spaceImages.stream()
                .filter(SpaceImage::isPrimary)
                .findFirst()
                .map(SpaceImage::getImageUrl)
                .orElse(null);

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
