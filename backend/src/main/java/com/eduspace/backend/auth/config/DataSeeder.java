package com.eduspace.backend.auth.config;

import com.eduspace.backend.auth.entity.Role;
import com.eduspace.backend.auth.entity.User;
import com.eduspace.backend.auth.repository.UserRepository;
import com.eduspace.backend.booking.entity.Booking;
import com.eduspace.backend.booking.entity.BookingStatus;
import com.eduspace.backend.booking.repository.BookingRepository;
import com.eduspace.backend.space.entity.BookingMode;
import com.eduspace.backend.space.entity.Space;
import com.eduspace.backend.space.entity.SpaceStatus;
import com.eduspace.backend.space.entity.SpaceType;
import com.eduspace.backend.space.repository.SpaceRepository;
import com.eduspace.backend.space.repository.SpaceTypeRepository;
import com.eduspace.backend.checkin.policy.entity.BookingPolicy;
import com.eduspace.backend.checkin.policy.repository.BookingPolicyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SpaceRepository spaceRepository;
    private final SpaceTypeRepository spaceTypeRepository;
    private final BookingRepository bookingRepository;
    private final BookingPolicyRepository bookingPolicyRepository;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      SpaceRepository spaceRepository,
                      SpaceTypeRepository spaceTypeRepository,
                      BookingRepository bookingRepository,
                      BookingPolicyRepository bookingPolicyRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.spaceRepository = spaceRepository;
        this.spaceTypeRepository = spaceTypeRepository;
        this.bookingRepository = bookingRepository;
        this.bookingPolicyRepository = bookingPolicyRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Khởi tạo tài khoản test nếu bảng users trống
        if (userRepository.count() == 0) {
            String defaultPassword = passwordEncoder.encode("123456");

            User admin = new User();
            admin.setEmail("admin@eduspace.vn");
            admin.setPassword(defaultPassword);
            admin.setFullName("Quản Trị Viên");
            admin.setPhoneNumber("0988000111");
            admin.setRole(Role.ADMIN);
            admin.setActive(true);

            User staff = new User();
            staff.setEmail("staff@eduspace.vn");
            staff.setPassword(defaultPassword);
            staff.setFullName("Nhân Viên Quầy");
            staff.setPhoneNumber("0988000222");
            staff.setRole(Role.STAFF);
            staff.setActive(true);

            User student = new User();
            student.setEmail("student@eduspace.vn");
            student.setPassword(defaultPassword);
            student.setFullName("Lê Minh Tân");
            student.setPhoneNumber("0988000333");
            student.setRole(Role.STUDENT);
            student.setActive(true);

            userRepository.saveAll(List.of(admin, staff, student));
            System.out.println("Đã khởi tạo thành công 3 tài khoản test!");
        }

        // 2. Khởi tạo một số không gian mẫu để test thống kê nếu chưa có
        if (spaceRepository.count() == 0) {
            SpaceType defaultType = spaceTypeRepository.findAll().stream().findFirst().orElseGet(() ->
                    spaceTypeRepository.save(SpaceType.builder()
                            .name("Phòng họp / Học nhóm")
                            .bookingMode(BookingMode.WHOLE_SPACE)
                            .build())
            );

            Space s1 = Space.builder().name("Phòng học nhóm A101").spaceType(defaultType).building("Tòa A").floor("1").capacity(6).status(SpaceStatus.AVAILABLE).build();
            Space s2 = Space.builder().name("Phòng học nhóm A102").spaceType(defaultType).building("Tòa A").floor("1").capacity(8).status(SpaceStatus.AVAILABLE).build();
            Space s3 = Space.builder().name("Phòng thuyết trình B201").spaceType(defaultType).building("Tòa B").floor("2").capacity(20).status(SpaceStatus.AVAILABLE).build();
            Space s4 = Space.builder().name("Phòng kỹ thuật C301").spaceType(defaultType).building("Tòa C").floor("3").capacity(4).status(SpaceStatus.MAINTENANCE).build();
            spaceRepository.saveAll(List.of(s1, s2, s3, s4));
            System.out.println("Đã khởi tạo không gian mẫu!");
        }

        // 3. Khởi tạo một số booking mẫu để test số liệu thống kê nếu chưa có
        if (bookingRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            Booking b1 = Booking.builder().studentId(3L).spaceId(1L).startTime(now.minusHours(4)).endTime(now.minusHours(2)).participantCount(4).purpose("Học nhóm Toán").status(BookingStatus.COMPLETED).createdAt(now.minusDays(1)).build();
            Booking b2 = Booking.builder().studentId(3L).spaceId(2L).startTime(now.minusMinutes(30)).endTime(now.plusMinutes(90)).participantCount(6).purpose("Ôn thi Lý").status(BookingStatus.CHECKED_IN).createdAt(now.minusHours(2)).build();
            Booking b3 = Booking.builder().studentId(3L).spaceId(3L).startTime(now.plusHours(2)).endTime(now.plusHours(4)).participantCount(10).purpose("Thuyết trình Đồ án").status(BookingStatus.PENDING_APPROVAL).createdAt(now.minusMinutes(10)).build();
            Booking b4 = Booking.builder().studentId(3L).spaceId(1L).startTime(now.minusDays(2)).endTime(now.minusDays(2).plusHours(2)).participantCount(3).purpose("Học nhóm Hóa").status(BookingStatus.NO_SHOW).createdAt(now.minusDays(3)).build();
            Booking b5 = Booking.builder().studentId(3L).spaceId(2L).startTime(now.minusDays(1)).endTime(now.minusDays(1).plusHours(2)).participantCount(5).purpose("Học nhóm Anh").status(BookingStatus.EXPIRED).createdAt(now.minusDays(2)).build();
            bookingRepository.saveAll(List.of(b1, b2, b3, b4, b5));
            System.out.println("Đã khởi tạo booking mẫu để test thống kê!");
        }

        // 4. Khởi tạo cấu hình chính sách mặc định nếu chưa có
        if (bookingPolicyRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            bookingPolicyRepository.saveAll(List.of(
                BookingPolicy.builder().policyKey("DAILY_BOOKING_QUOTA").policyValue("2").description("Số lượt đặt tối đa trong ngày").updatedBy("SYSTEM_INIT").updatedAt(now).build(),
                BookingPolicy.builder().policyKey("MAX_DURATION_MINUTES").policyValue("180").description("Thời lượng tối đa mỗi lượt đặt (phút)").updatedBy("SYSTEM_INIT").updatedAt(now).build(),
                BookingPolicy.builder().policyKey("RATE_LIMIT_HOURLY").policyValue("10").description("Giới hạn số request tạo booking mỗi giờ").updatedBy("SYSTEM_INIT").updatedAt(now).build(),
                BookingPolicy.builder().policyKey("CHECKIN_OPEN_MINUTES").policyValue("15").description("Thời gian mở check-in sớm (phút)").updatedBy("SYSTEM_INIT").updatedAt(now).build(),
                BookingPolicy.builder().policyKey("CHECKIN_GRACE_MINUTES").policyValue("15").description("Thời gian ân hạn check-in trễ (phút)").updatedBy("SYSTEM_INIT").updatedAt(now).build()
            ));
            System.out.println("Đã khởi tạo cấu hình chính sách mặc định!");
        }
    }
}
