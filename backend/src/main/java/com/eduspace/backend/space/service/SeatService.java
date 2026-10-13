package com.eduspace.backend.space.service;

import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
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
    private final BookingRepository bookingRepository;

    private static final java.util.Set<BookingStatus> DELETE_BLOCKING_STATUSES = java.util.Set.of(
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
    );

    // Lấy danh sách toàn bộ chỗ ngồi trong không gian (phòng)
    @Transactional(readOnly = true)
    public List<SeatResponseKT> getSeatsBySpace(Long spaceId) {
        // 1. Kiểm tra phòng này có thuộc kiểu đặt theo chỗ ngồi (PER_SEAT) không
        validateSpaceSupportsSeats(spaceId);
        // 2. Lấy danh sách chỗ ngồi chưa bị xóa mềm và đổi sang DTO Response
        return seatRepository.findBySpaceIdAndDeletedAtIsNull(spaceId).stream()
                .map(SeatResponseKT::fromEntity)
                .collect(Collectors.toList());
    }

    // Lấy thông tin chi tiết một chỗ ngồi theo ID
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

    // Tạo mới một chỗ ngồi đơn lẻ (kiểm tra trùng mã và giới hạn sức chứa)
    @Transactional
    public SeatResponseKT createSeat(Long spaceId, SeatCreateRequestKT request) {
        // 1. Kiểm tra phòng có hỗ trợ đặt theo chỗ ngồi không
        Space space = validateSpaceSupportsSeats(spaceId);

        String seatCode = request.getSeatCode() != null ? request.getSeatCode().trim() : "";
        if (seatCode.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Mã chỗ không được để trống.");
        }

        // 2. Kiểm tra trùng mã ghế trong cùng một phòng
        if (seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(spaceId, seatCode)) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_CODE_EXISTS",
                    "Mã chỗ '" + seatCode + "' đã tồn tại trong không gian này."
            );
        }

        // 3. RÀNG BUỘC SỨC CHỨA: Số ghế không được vượt quá sức chứa tối đa của phòng
        long currentCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(spaceId);
        if (currentCount >= space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_SEAT_CAPACITY_REACHED",
                    "Không thể tạo thêm chỗ: Đã đạt sức chứa tối đa của không gian (" + space.getCapacity() + " chỗ)."
            );
        }

        // 4. Tạo Entity Seat và lưu vào database
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

    // Tạo hàng loạt chỗ ngồi (Bulk Create - kiểm tra trùng lặp và sức chứa phòng)
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

        // 1. Kiểm tra xem trong chính danh sách gửi lên có mã nào bị trùng nhau không
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

        // 2. Kiểm tra tổng số lượng ghế mới cộng dồn có vượt sức chứa phòng không
        long currentCount = seatRepository.countBySpaceIdAndDeletedAtIsNull(spaceId);
        if (currentCount + trimmedCodes.size() > space.getCapacity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "SPACE_SEAT_CAPACITY_REACHED",
                    "Không thể tạo thêm " + trimmedCodes.size() + " chỗ: Sẽ vượt sức chứa tối đa (" +
                            space.getCapacity() + " chỗ, hiện có " + currentCount + " chỗ hoạt động)."
            );
        }

        // 3. Kiểm tra từng mã xem đã có mã nào tồn tại trong database trước đó chưa
        for (String code : trimmedCodes) {
            if (seatRepository.existsBySpaceIdAndSeatCodeIgnoreCase(spaceId, code)) {
                throw new AppException(
                        HttpStatus.CONFLICT,
                        "SEAT_CODE_EXISTS",
                        "Mã chỗ '" + code + "' đã tồn tại trong không gian này."
                );
            }
        }

        // 4. Tạo danh sách các Entity Seat và lưu đồng loạt bằng saveAll
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

    // Cập nhật thông tin chỗ ngồi (kiểm tra trùng mã mới)
    @Transactional
    public SeatResponseKT updateSeat(Long seatId, SeatUpdateRequestKT request) {
        // 1. Tìm ghế cần cập nhật
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

        // 2. Nếu đổi mã ghế mới, kiểm tra có bị trùng trong phòng không
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

    // Xóa mềm chỗ ngồi (chặn xóa nếu ghế đang có sinh viên đặt chưa kết thúc)
    @Transactional
    public void deleteSeat(Long seatId) {
        // 1. Tìm ghế cần xóa
        Seat seat = seatRepository.findByIdAndDeletedAtIsNull(seatId)
                .orElseThrow(() -> new AppException(
                        HttpStatus.NOT_FOUND,
                        "SEAT_NOT_FOUND",
                        "Không tìm thấy chỗ ngồi với id: " + seatId
                ));

        // 2. Chặn xóa nếu ghế đang có booking chưa kết thúc
        LocalDateTime now = LocalDateTime.now();
        long blockingCount = bookingRepository.countBlockingBookingsForSeatDeletion(
                seat.getSpace().getId(),
                seat.getSeatCode(),
                DELETE_BLOCKING_STATUSES,
                now
        );
        if (blockingCount > 0) {
            throw new AppException(
                    HttpStatus.CONFLICT,
                    "SEAT_HAS_ACTIVE_BOOKINGS",
                    "Không thể xóa ghế '" + seat.getSeatCode() + "' vì đang có "
                            + blockingCount + " booking chưa kết thúc."
            );
        }

        // 3. Xóa mềm (đổi sang INACTIVE và set deleted_at = now)
        seat.setStatus(SeatStatus.INACTIVE);
        seat.setDeletedAt(now);
        seatRepository.save(seat);
    }

    // Hàm kiểm tra phòng có tồn tại và có hình thức đặt là PER_SEAT hay không
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
