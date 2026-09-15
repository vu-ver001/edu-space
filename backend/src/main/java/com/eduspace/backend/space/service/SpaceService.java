package com.eduspace.backend.space.service;

import com.eduspace.backend.space.dto.request.SpaceCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceResponseKT;
import com.eduspace.backend.space.entity.*;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.FacilityRepository;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceTypeRepository spaceTypeRepository;
    private final FacilityRepository facilityRepository;
    private final SeatRepository seatRepository;
    private final SpaceTableRepository spaceTableRepository;

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
        return spaceRepository.findAllByDeletedAtIsNull().stream()
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

        Space space = Space.builder()
                .name(request.getName().trim())
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

        // Quy tắc 1: Nếu là PER_SEAT và giảm capacity dưới số active seats -> 409 CAPACITY_LOWER_THAN_ACTIVE_SEATS
        long activeSeatCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(id);
        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_SEAT) {
            if (request.getCapacity() < activeSeatCount) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "CAPACITY_LOWER_THAN_ACTIVE_SEATS",
                        "Sức chứa mới (" + request.getCapacity() + ") không thể nhỏ hơn số chỗ ngồi đang hoạt động (" + activeSeatCount + " chỗ)."
                );
            }
        }

        // Quy tắc 1b: Nếu là PER_TABLE và giảm capacity dưới tổng capacity của active tables -> 409 CAPACITY_LOWER_THAN_ACTIVE_TABLE_CAPACITY
        if (space.getSpaceType() != null && space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE) {
            int activeTableCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(id);
            if (request.getCapacity() < activeTableCapacity) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "CAPACITY_LOWER_THAN_ACTIVE_TABLE_CAPACITY",
                        "Sức chứa mới (" + request.getCapacity() + ") không thể nhỏ hơn tổng sức chứa của các bàn đang hoạt động (" + activeTableCapacity + " chỗ)."
                );
            }
        }

        // Quy tắc 2: Nếu đổi SpaceType
        SpaceType targetSpaceType = space.getSpaceType();
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
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SPACE_HAS_ACTIVE_SEATS",
                        "Không thể chuyển loại phòng vì không gian đang có " + activeSeatCount + " chỗ ngồi hoạt động."
                );
            }

            if (space.getSpaceType().getBookingMode() == BookingMode.PER_TABLE
                    && targetSpaceType.getBookingMode() != BookingMode.PER_TABLE) {
                long activeTableCount = spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(id);
                if (activeTableCount > 0) {
                    throw new AppException(
                            HttpStatus.CONFLICT,
                            "SPACE_HAS_ACTIVE_TABLES",
                            "Không thể chuyển loại phòng vì không gian đang có " + activeTableCount + " bàn hoạt động."
                    );
                }
            }
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
     * 3. set status = INACTIVE
     * 4. set deleted_at = now
     * 5. Soft delete toàn bộ Seat active thuộc Space (status = INACTIVE, deleted_at = now)
     * 6. Soft delete toàn bộ SpaceTable active thuộc Space (status = INACTIVE, deleted_at = now)
     * 7. save (Toàn bộ trong @Transactional)
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
        return SpaceResponseKT.fromEntity(space, activeSeatCount, activeTableCount, activeTableCapacity);
    }
}
