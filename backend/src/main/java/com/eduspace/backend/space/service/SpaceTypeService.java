package com.eduspace.backend.space.service;

import com.eduspace.backend.space.dto.request.SpaceTypeCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTypeUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTypeResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceType;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceTypeService {

    private final SpaceTypeRepository spaceTypeRepository;
    private final SpaceRepository spaceRepository;
    private final SeatRepository seatRepository;
    private final SpaceTableRepository spaceTableRepository;

    @Transactional(readOnly = true)
    public List<SpaceTypeResponseKT> getAllSpaceTypes() {
        return spaceTypeRepository.findAllByDeletedAtIsNull().stream()
                .map(SpaceTypeResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SpaceTypeResponseKT getSpaceTypeById(Long id) {
        SpaceType spaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_TYPE_NOT_FOUND",
                        "Không tìm thấy loại phòng với id: " + id
                ));
        return SpaceTypeResponseKT.fromEntity(spaceType);
    }

    @Transactional
    public SpaceTypeResponseKT createSpaceType(SpaceTypeCreateRequestKT request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên loại phòng không được để trống.");
        }

        if (spaceTypeRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(HttpStatus.CONFLICT, "SPACE_TYPE_NAME_EXISTS", "Tên loại phòng '" + name + "' đã tồn tại.");
        }

        SpaceType spaceType = SpaceType.builder()
                .name(name)
                .description(request.getDescription())
                .bookingMode(request.getBookingMode())
                .requiresApproval(request.getRequiresApproval() != null ? request.getRequiresApproval() : false)
                .build();

        return SpaceTypeResponseKT.fromEntity(spaceTypeRepository.save(spaceType));
    }

    @Transactional
    public SpaceTypeResponseKT updateSpaceType(Long id, SpaceTypeUpdateRequestKT request) {
        SpaceType spaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_TYPE_NOT_FOUND",
                        "Không tìm thấy loại phòng với id: " + id
                ));

        String newName = request.getName() != null ? request.getName().trim() : "";
        if (newName.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên loại phòng không được để trống.");
        }

        if (!newName.equalsIgnoreCase(spaceType.getName())) {
            if (spaceTypeRepository.existsByNameIgnoreCase(newName)) {
                throw new AppException(HttpStatus.CONFLICT, "SPACE_TYPE_NAME_EXISTS", "Tên loại phòng '" + newName + "' đã tồn tại.");
            }
            spaceType.setName(newName);
        }

        // Quy tắc khi đổi bookingMode từ PER_SEAT sang loại khác
        if (spaceType.getBookingMode() == BookingMode.PER_SEAT && request.getBookingMode() != null && request.getBookingMode() != BookingMode.PER_SEAT) {
            List<Space> activeSpaces = spaceRepository.findAllBySpaceTypeIdAndDeletedAtIsNull(id);
            for (Space sp : activeSpaces) {
                if (seatRepository.countBySpaceIdAndDeletedAtIsNull(sp.getId()) > 0) {
                    throw new AppException(
                            HttpStatus.CONFLICT,
                            "SPACE_TYPE_HAS_ACTIVE_SEATS",
                            "Không thể chuyển sang loại phòng khác vì vẫn còn không gian thuộc loại này đang có chỗ ngồi hoạt động."
                    );
                }
            }
        }

        // Quy tắc khi đổi bookingMode từ PER_TABLE sang loại khác
        if (spaceType.getBookingMode() == BookingMode.PER_TABLE && request.getBookingMode() != null && request.getBookingMode() != BookingMode.PER_TABLE) {
            List<Space> activeSpaces = spaceRepository.findAllBySpaceTypeIdAndDeletedAtIsNull(id);
            for (Space sp : activeSpaces) {
                if (spaceTableRepository.countBySpaceIdAndDeletedAtIsNull(sp.getId()) > 0) {
                    throw new AppException(
                            HttpStatus.CONFLICT,
                            "SPACE_TYPE_HAS_ACTIVE_TABLES",
                            "Không thể chuyển sang loại phòng khác vì vẫn còn không gian thuộc loại này đang có bàn hoạt động."
                    );
                }
            }
        }

        if (request.getDescription() != null) {
            spaceType.setDescription(request.getDescription());
        }
        if (request.getBookingMode() != null) {
            spaceType.setBookingMode(request.getBookingMode());
        }
        if (request.getRequiresApproval() != null) {
            spaceType.setRequiresApproval(request.getRequiresApproval());
        }

        return SpaceTypeResponseKT.fromEntity(spaceTypeRepository.save(spaceType));
    }

    @Transactional
    public void deleteSpaceType(Long id) {
        SpaceType spaceType = spaceTypeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_TYPE_NOT_FOUND",
                        "Không tìm thấy loại phòng với id: " + id
                ));

        if (spaceRepository.existsBySpaceTypeIdAndDeletedAtIsNull(id)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SPACE_TYPE_IN_USE",
                    "Không thể xóa loại phòng: Vẫn còn phòng đang hoạt động thuộc loại này."
            );
        }

        spaceType.setDeletedAt(LocalDateTime.now());
        spaceTypeRepository.save(spaceType);
    }
}
