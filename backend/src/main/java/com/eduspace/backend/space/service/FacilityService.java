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

    // Lấy danh sách tất cả tiện ích chưa bị xóa (kèm đếm số không gian đang dùng)
    @Transactional(readOnly = true)
    public List<FacilityResponseKT> getAllFacilities() {
        // 1. Thống kê số lượng không gian đang sử dụng từng tiện ích
        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
        try {
            for (Object[] row : facilityRepository.countSpacesPerFacility()) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    countMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                }
            }
        } catch (Exception ignored) {}

        // 2. Chuyển đổi sang danh sách DTO Response gửi về cho Client
        return facilityRepository.findAllByDeletedAtIsNull().stream()
                .map(f -> FacilityResponseKT.fromEntity(f, countMap.getOrDefault(f.getId(), 0L)))
                .collect(Collectors.toList());
    }

    // Lấy thông tin chi tiết một tiện ích theo ID (kèm số không gian đang dùng)
    @Transactional(readOnly = true)
    public FacilityResponseKT getFacilityById(Long id) {
        // 1. Tìm tiện ích theo ID (phải chưa bị xóa mềm)
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));

        // 2. Đếm số lượng phòng đang sử dụng tiện ích này
        long count = 0;
        try {
            count = facilityRepository.countSpacesByFacilityId(id);
        } catch (Exception ignored) {}
        return FacilityResponseKT.fromEntity(facility, count);
    }

    // Tạo mới tiện ích (kiểm tra không để trống và không trùng tên)
    @Transactional
    public FacilityResponseKT createFacility(FacilityCreateRequestKT request) {
        // 1. Kiểm tra tên tiện ích không được để trống
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên tiện ích không được để trống.");
        }

        // 2. Kiểm tra trùng tên tiện ích trong hệ thống (không phân biệt hoa/thường)
        if (facilityRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(HttpStatus.CONFLICT, "FACILITY_NAME_EXISTS", "Tên tiện ích '" + name + "' đã tồn tại.");
        }

        // 3. Tạo Entity Facility mới và lưu vào database
        Facility facility = Facility.builder()
                .name(name)
                .description(request.getDescription())
                .build();

        return FacilityResponseKT.fromEntity(facilityRepository.save(facility), 0L);
    }

    // Cập nhật thông tin tiện ích (kiểm tra trùng tên mới nếu có đổi tên)
    @Transactional
    public FacilityResponseKT updateFacility(Long id, FacilityUpdateRequestKT request) {
        // 1. Tìm tiện ích cần sửa theo ID
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));

        // 2. Kiểm tra tên mới không được để trống
        String newName = request.getName() != null ? request.getName().trim() : "";
        if (newName.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên tiện ích không được để trống.");
        }

        // 3. Nếu đổi sang tên mới, kiểm tra xem tên mới có trùng với tiện ích khác không
        if (!newName.equalsIgnoreCase(facility.getName())) {
            if (facilityRepository.existsByNameIgnoreCase(newName)) {
                throw new AppException(HttpStatus.CONFLICT, "FACILITY_NAME_EXISTS", "Tên tiện ích '" + newName + "' đã tồn tại.");
            }
            facility.setName(newName);
        }

        if (request.getDescription() != null) {
            facility.setDescription(request.getDescription());
        }

        // 4. Đếm số phòng đang dùng và lưu lại
        long count = 0;
        try {
            count = facilityRepository.countSpacesByFacilityId(id);
        } catch (Exception ignored) {}

        return FacilityResponseKT.fromEntity(facilityRepository.save(facility), count);
    }

    // Xóa mềm tiện ích (chặn xóa nếu đang có phòng sử dụng tiện ích này)
    @Transactional
    public void deleteFacility(Long id) {
        // 1. Tìm tiện ích cần xóa
        Facility facility = facilityRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "FACILITY_NOT_FOUND",
                        "Không tìm thấy tiện ích với id: " + id
                ));

        // 2. Kiểm tra xem có phòng nào đang sử dụng tiện ích này không
        long count = 0;
        try {
            count = facilityRepository.countSpacesByFacilityId(id);
        } catch (Exception ignored) {}

        // 3. Nếu đang được sử dụng -> CHẶN XÓA để tránh gãy dữ liệu của phòng
        if (count > 0) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "FACILITY_IN_USE",
                    "Không thể xóa tiện ích '" + facility.getName() + "' vì đang được sử dụng bởi " + count + " không gian."
            );
        }

        // 4. Xóa mềm (gán deleted_at = now)
        facility.setDeletedAt(LocalDateTime.now());
        facilityRepository.save(facility);
    }
}
