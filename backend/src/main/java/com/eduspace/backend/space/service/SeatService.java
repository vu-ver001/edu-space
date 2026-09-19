package com.eduspace.backend.space.service;

import com.eduspace.backend.space.dto.request.SeatBulkCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatCreateRequestKT;
import com.eduspace.backend.space.dto.request.SeatUpdateRequestKT;
import com.eduspace.backend.space.dto.response.SeatResponseKT;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Seat;
import com.eduspace.backend.space.entity.SeatStatus;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.common.exception.AppException;
import com.eduspace.backend.space.repository.SeatRepository;
import com.eduspace.backend.space.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
public class SeatService {

    private final SeatRepository seatRepository;
    private final SpaceRepository spaceRepository;

    @Transactional(readOnly = true)
    public List<SeatResponseKT> getSeatsBySpace(Long spaceId) {
        validateSpaceSupportsSeats(spaceId);
        return seatRepository.findBySpaceIdAndDeletedAtIsNull(spaceId).stream()
                .map(SeatResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SeatResponseKT getSeatById(Long seatId) {
        Seat seat = seatRepository.findByIdAndDeletedAtIsNull(seatId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SEAT_NOT_FOUND",
                        "Không tìm thấy chỗ ngồi với id: " + seatId
                ));
        return SeatResponseKT.fromEntity(seat);
    }

    @Transactional
    public SeatResponseKT createSeat(Long spaceId, SeatCreateRequestKT request) {
        Space space = validateSpaceSupportsSeats(spaceId);

        String seatCode = request.getSeatCode() != null ? request.getSeatCode().trim() : "";
        if (seatCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã chỗ không được để trống.");
        }

        if (seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(spaceId, seatCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_CODE_EXISTS",
                    "Mã chỗ '" + seatCode + "' đã tồn tại trong không gian này."
            );
        }

        long currentCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(spaceId);
        if (currentCount >= space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_SEAT_CAPACITY_REACHED",
                    "Không thể tạo thêm chỗ: Đã đạt sức chứa tối đa của không gian (" + space.getCapacity() + " chỗ)."
            );
        }

        Seat seat = Seat.builder()
                .space(space)
                .seatCode(seatCode)
                .status(request.getStatus() != null ? request.getStatus() : SeatStatus.AVAILABLE)
                .description(request.getDescription())
                .build();

        try {
            return SeatResponseKT.fromEntity(seatRepository.save(seat));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_CODE_EXISTS",
                    "Mã chỗ '" + seatCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    @Transactional
    public List<SeatResponseKT> bulkCreateSeats(Long spaceId, SeatBulkCreateRequestKT request) {
        Space space = validateSpaceSupportsSeats(spaceId);

        List<String> rawCodes = request.getSeatCodes();
        if (rawCodes == null || rawCodes.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Danh sách mã chỗ không được rỗng.");
        }

        List<String> trimmedCodes = new ArrayList<>();
        for (String code : rawCodes) {
            String trimmed = code != null ? code.trim() : "";
            if (trimmed.isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Danh sách mã chỗ chứa phần tử rỗng.");
            }
            trimmedCodes.add(trimmed);
        }

        // Kiểm tra duplicate trong request list
        Set<String> uniqueCodes = new HashSet<>();
        for (String code : trimmedCodes) {
            if (!uniqueCodes.add(code.toUpperCase())) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SEAT_CODE_EXISTS",
                        "Danh sách mã chỗ gửi lên chứa các mã bị trùng lặp: " + code
                );
            }
        }

        long currentCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(spaceId);
        if (currentCount + trimmedCodes.size() > space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_SEAT_CAPACITY_REACHED",
                    "Không thể tạo thêm " + trimmedCodes.size() + " chỗ: Sẽ vượt sức chứa tối đa (" +
                            space.getCapacity() + " chỗ, hiện có " + currentCount + " chỗ hoạt động)."
            );
        }

        // Kiểm tra duplicate trong DB
        for (String code : trimmedCodes) {
            if (seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(spaceId, code)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SEAT_CODE_EXISTS",
                        "Mã chỗ '" + code + "' đã tồn tại trong không gian này."
                );
            }
        }

        List<Seat> newSeats = new ArrayList<>();
        for (String code : trimmedCodes) {
            newSeats.add(Seat.builder()
                    .space(space)
                    .seatCode(code)
                    .status(SeatStatus.AVAILABLE)
                    .build());
        }

        try {
            return seatRepository.saveAll(newSeats).stream()
                    .map(SeatResponseKT::fromEntity)
                    .collect(Collectors.toList());
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_CODE_EXISTS",
                    "Xung đột dữ liệu: Một hoặc nhiều mã chỗ đã tồn tại trong không gian này."
            );
        }
    }

    @Transactional
    public SeatResponseKT updateSeat(Long seatId, SeatUpdateRequestKT request) {
        Seat seat = seatRepository.findByIdAndDeletedAtIsNull(seatId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SEAT_NOT_FOUND",
                        "Không tìm thấy chỗ ngồi với id: " + seatId
                ));

        String newCode = request.getSeatCode() != null ? request.getSeatCode().trim() : "";
        if (newCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã chỗ không được để trống.");
        }

        if (!newCode.equalsIgnoreCase(seat.getSeatCode())) {
            if (seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(seat.getSpace().getId(), newCode)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SEAT_CODE_EXISTS",
                        "Mã chỗ '" + newCode + "' đã tồn tại trong không gian này."
                );
            }
            seat.setSeatCode(newCode);
        }

        if (request.getStatus() != null) {
            seat.setStatus(request.getStatus());
        }
        if (request.getDescription() != null) {
            seat.setDescription(request.getDescription());
        }

        try {
            return SeatResponseKT.fromEntity(seatRepository.save(seat));
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_CODE_EXISTS",
                    "Mã chỗ '" + newCode + "' đã tồn tại trong không gian này."
            );
        }
    }

    @Transactional
    public void deleteSeat(Long seatId) {
        Seat seat = seatRepository.findByIdAndDeletedAtIsNull(seatId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SEAT_NOT_FOUND",
                        "Không tìm thấy chỗ ngồi với id: " + seatId
                ));

        seat.setStatus(SeatStatus.INACTIVE);
        seat.setDeletedAt(LocalDateTime.now());
        seatRepository.save(seat);
    }

    private Space validateSpaceSupportsSeats(Long spaceId) {
        Space space = spaceRepository.findByIdAndDeletedAtIsNull(spaceId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SPACE_NOT_FOUND",
                        "Không tìm thấy không gian với id: " + spaceId
                ));

        if (space.getSpaceType() == null ||
                space.getSpaceType().getBookingMode() != BookingMode.PER_SEAT) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_DOES_NOT_SUPPORT_SEATS",
                    "Không gian '" + space.getName() + "' có kiểu đặt WHOLE_SPACE, không hỗ trợ quản lý chỗ ngồi (seats)."
            );
        }

        return space;
    }
}
