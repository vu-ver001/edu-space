package com.eduspace.backend.space.service;

import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.dto.request.SpaceTableCreateRequestKT;
import com.eduspace.backend.space.dto.request.SpaceTableUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SpaceTableResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceTable;
import com.eduspace.backend.space.entity.SpaceTableStatus;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceTableService {

    private final SpaceTableRepository spaceTableRepository;
    private final SpaceRepository spaceRepository;

    @Transactional(readOnly = true)
    public List<SpaceTableResponseKT> getTablesBySpace(Long spaceId) {
        validateSpaceSupportsTables(spaceId);
        return spaceTableRepository.findBySpaceIdAndDeletedAtIsNull(spaceId).stream()
                .map(SpaceTableResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SpaceTableResponseKT getTableById(Long tableId) {
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));
        return SpaceTableResponseKT.fromEntity(table);
    }

    @Transactional
    public SpaceTableResponseKT createTable(Long spaceId, SpaceTableCreateRequestKT request) {
        Space space = validateSpaceSupportsTables(spaceId);

        String tableCode = request.getTableCode() != null ? request.getTableCode().trim() : "";
        if (tableCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã bàn không được để trống.");
        }

        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Sức chứa bàn phải lớn hơn 0.");
        }

        if (spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(spaceId, tableCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + tableCode + "' đã tồn tại trong không gian này."
            );
        }

        int currentTotalCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(spaceId);
        if (currentTotalCapacity + request.getCapacity() > space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_TABLE_CAPACITY_REACHED",
                    "Không thể tạo thêm bàn: Tổng sức chứa các bàn (" + (currentTotalCapacity + request.getCapacity()) +
                            ") sẽ vượt quá sức chứa tối đa của không gian (" + space.getCapacity() + " chỗ)."
            );
        }

        SpaceTable table = SpaceTable.builder()
                .space(space)
                .tableCode(tableCode)
                .capacity(request.getCapacity())
                .status(request.getStatus() != null ? request.getStatus() : SpaceTableStatus.AVAILABLE)
                .description(request.getDescription())
                .build();

        try {
            return SpaceTableResponseKT.fromEntity(spaceTableRepository.save(table));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + tableCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    @Transactional
    public SpaceTableResponseKT updateTable(Long tableId, SpaceTableUpdateRequestKT request) {
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));

        String newCode = request.getTableCode() != null ? request.getTableCode().trim() : "";
        if (newCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã bàn không được để trống.");
        }

        if (request.getCapacity() == null || request.getCapacity() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Sức chứa bàn phải lớn hơn 0.");
        }

        if (!newCode.equalsIgnoreCase(table.getTableCode())) {
            if (spaceTableRepository.existsBySpaceIdAndTableCodeIgnoreCase(table.getSpace().getId(), newCode)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "TABLE_CODE_EXISTS",
                        "Mã bàn '" + newCode + "' đã tồn tại trong không gian này."
                );
            }
            table.setTableCode(newCode);
        }

        int currentTotalCapacity = spaceTableRepository.sumActiveCapacityBySpaceId(table.getSpace().getId());
        int newTotalCapacity = currentTotalCapacity - table.getCapacity() + request.getCapacity();
        if (newTotalCapacity > table.getSpace().getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_TABLE_CAPACITY_REACHED",
                    "Không thể cập nhật bàn: Tổng sức chứa các bàn (" + newTotalCapacity +
                            ") sẽ vượt quá sức chứa tối đa của không gian (" + table.getSpace().getCapacity() + " chỗ)."
            );
        }
        table.setCapacity(request.getCapacity());

        if (request.getStatus() != null) {
            table.setStatus(request.getStatus());
        }
        if (request.getDescription() != null) {
            table.setDescription(request.getDescription());
        }

        try {
            return SpaceTableResponseKT.fromEntity(spaceTableRepository.save(table));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "TABLE_CODE_EXISTS",
                    "Mã bàn '" + newCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    @Transactional
    public void deleteTable(Long tableId) {
        SpaceTable table = spaceTableRepository.findByIdAndDeletedAtIsNull(tableId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "TABLE_NOT_FOUND",
                        "Không tìm thấy bàn với id: " + tableId
                ));

        table.setStatus(SpaceTableStatus.INACTIVE);
        table.setDeletedAt(LocalDateTime.now());
        spaceTableRepository.save(table);
    }

    private Space validateSpaceSupportsTables(Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + spaceId
                ));

        if (space.getSpaceType() == null ||
                space.getSpaceType().getBookingMode() != BookingMode.PER_TABLE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_DOES_NOT_SUPPORT_TABLES",
                    "Không gian '" + space.getName() + "' có kiểu đặt " +
                            (space.getSpaceType() != null ? space.getSpaceType().getBookingMode() : "N/A") +
                            ", không hỗ trợ quản lý bàn (tables)."
            );
        }

        return space;
    }
}
