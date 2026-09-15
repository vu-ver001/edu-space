package com.eduspace.backend.space.service;

import com.eduspace.backend.space.dto.request.FacilityCreateRequestKT;
import com.eduspace.backend.space.dto.request.FacilityUpdateRequestKT;
import com.eduspace.backend.space.dto.response.FacilityResponseKT;
import com.eduspace.backend.space.entity.Facility;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;

    @Transactional(readOnly = true)
    public List<FacilityResponseKT> getAllFacilities() {
        return facilityRepository.findAllByDeletedAtIsNull().stream()
                .map(FacilityResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FacilityResponseKT getFacilityById(Long id) {
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));
        return FacilityResponseKT.fromEntity(facility);
    }

    @Transactional
    public FacilityResponseKT createFacility(FacilityCreateRequestKT request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên tiện ích không được để trống.");
        }

        if (facilityRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(HttpStatus.CONFLICT, "FACILITY_NAME_EXISTS", "Tên tiện ích '" + name + "' đã tồn tại.");
        }

        Facility facility = Facility.builder()
                .name(name)
                .description(request.getDescription())
                .build();

        return FacilityResponseKT.fromEntity(facilityRepository.save(facility));
    }

    @Transactional
    public FacilityResponseKT updateFacility(Long id, FacilityUpdateRequestKT request) {
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));

        String newName = request.getName() != null ? request.getName().trim() : "";
        if (newName.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên tiện ích không được để trống.");
        }

        if (!newName.equalsIgnoreCase(facility.getName())) {
            if (facilityRepository.existsByNameIgnoreCase(newName)) {
                throw new AppException(HttpStatus.CONFLICT, "FACILITY_NAME_EXISTS", "Tên tiện ích '" + newName + "' đã tồn tại.");
            }
            facility.setName(newName);
        }

        if (request.getDescription() != null) {
            facility.setDescription(request.getDescription());
        }

        return FacilityResponseKT.fromEntity(facilityRepository.save(facility));
    }

    @Transactional
    public void deleteFacility(Long id) {
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));

        facility.setDeletedAt(LocalDateTime.now());
        facilityRepository.save(facility);
    }
}
