# EduSpace — Hệ Thống Quản Lý & Đặt Chỗ Không Gian Học Tập

> **Phân hệ phụ trách:** Nguyễn Thị Khánh Vân (Thành viên 3 — Lead kỹ thuật)  
> **Nghiệm thu nghiệp vụ cốt lõi:**
> - **Module M03:** Tìm kiếm không gian khả dụng & Kiểm tra khả dụng tổng hợp (Availability Engine)
> - **Module M04:** Quản lý đặt chỗ, chống đặt trùng (Pessimistic Lock), vòng đời booking, tự phục vụ check-in & Scheduler tự động
> - **Giao diện người dùng:** Thiết kế chuẩn **Trắng Tinh Khôi + Xanh Dương Pastel Cao Cấp (Porcelain White & Luxury Pastel Blue)**, kính mờ Glassmorphism, phông chữ Plus Jakarta Sans.

---

## 1. Cấu Trúc Dự Án

```
edu-space/
├── database/
│   ├── schema.sql              # Định nghĩa bảng CSDL (MySQL 8.0)
│   └── seed.sql                # Dữ liệu mẫu (tài khoản, phòng, tiện ích, lịch học)
├── backend/                    # Spring Boot 4.x / Java 17 / Maven
│   ├── src/main/java/com/eduspace/backend/
│   │   ├── controller/
│   │   │   ├── AvailabilityController.java  # API kiểm tra khả dụng & tìm kiếm
│   │   │   └── BookingController.java       # API tạo, hủy, duyệt, check-in booking
│   │   ├── service/
│   │   │   ├── AvailabilityService.java     # Lõi kiểm tra khả dụng tổng hợp
│   │   │   └── BookingService.java          # 10 bước validate tuần tự & khóa chống trùng
│   │   ├── scheduler/
│   │   │   └── BookingStateScheduler.java   # Quét định kỳ EXPIRED, NO_SHOW, COMPLETED
│   │   ├── entity/                          # Booking, Space, SpaceType, Facility, StudentSchedule...
│   │   ├── repository/                      # Spring Data JPA Repositories
│   │   └── exception/                       # BusinessException & GlobalExceptionHandler
│   └── src/main/resources/application.yml   # Cấu hình cổng 8080 và kết nối MySQL
└── frontend/                   # React 19 + TypeScript + Vite (Port 5173)
    └── src/
        ├── components/
        │   ├── Navbar.tsx                   # Thanh điều hướng & chuyển nhanh vai trò demo
        │   ├── FilterBar.tsx                # Bộ lọc ngày giờ, sức chứa, tiện ích
        │   ├── RoomCard.tsx                 # Thẻ hiển thị phòng học sang trọng
        │   ├── BookingModal.tsx             # Hộp thoại đặt chỗ (bắt lỗi 409 chi tiết)
        │   ├── StatusBadge.tsx              # Huy hiệu 8 trạng thái booking
        │   └── AuditLogModal.tsx            # Nhật ký kiểm toán vòng đời đặt chỗ
        └── pages/
            ├── SearchSpacesPage.tsx         # [M03] Tìm kiếm phòng khả dụng (/spaces)
            ├── MyBookingsPage.tsx           # [M04] Lịch booking & Check-in (/my-bookings)
            └── CoreApprovalDemo.tsx         # [M04] Bàn làm việc duyệt đặt chỗ (/core-approval)
```

---

## 2. Hướng Dẫn Chạy Chương Trình

### Bước 1: Cơ sở dữ liệu MySQL (Đã nạp sẵn)
CSDL `eduspace` đã được nạp trên MySQL Server 8.0 local (Port 3306, User: `root`, Mật khẩu: `123456`).
* Bạn có thể mở **MySQL Workbench**, kết nối vào `Local instance MySQL80` và bấm nút refresh tại tab **SCHEMAS** sẽ thấy ngay database `eduspace` với 10 bảng đầy đủ dữ liệu.
* Nếu muốn nạp lại CSDL từ đầu bất kỳ lúc nào:
  ```bash
  cd database
  mysql -u root -p123456 < schema.sql
  mysql -u root -p123456 < seed.sql
  ```

### Bước 2: Chạy Backend Spring Boot
Mở cửa sổ Terminal 1:
```bash
cd backend
.\mvnw.cmd spring-boot:run (Windows)
Hoặc .\mvnw spring-boot:run (MacOS, Linux)
```
* Backend sẽ khởi động tại: `http://localhost:8080`
* Kiểm tra trạng thái máy chủ: `http://localhost:8080/health` $\rightarrow$ `{"status":"OK"}`

### Bước 3: Chạy Frontend React
Mở cửa sổ Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
* Mở trình duyệt truy cập: `http://localhost:5173`

---

## 3. Các Luồng Demo & Quy Tắc Nghiệp Vụ Chính

### Luồng 1: Tìm phòng khả dụng (`/spaces`)
1. Truy cập `http://localhost:5173/spaces`.
2. Chọn ngày, giờ bắt đầu (`09:00`), giờ kết thúc (`11:00`), số người tham gia.
3. Bấm **"Tìm Phòng Khả Dụng Ngay"**: Hệ thống tự động lọc các phòng trống, loại bỏ các phòng đang bảo trì (như *Phòng Lab Delta 102*).

### Luồng 2: Đặt chỗ phòng học nhóm thường (`CONFIRMED` ngay)
1. Chọn *Phòng Thảo Luận Alpha 101* hoặc *Phòng Học Nhóm Beta 202*.
2. Bấm **"Đặt Không Gian Này"** $\rightarrow$ Nhập số người và mục đích $\rightarrow$ Bấm **Xác Nhận Đặt**.
3. Do phòng học nhóm không yêu cầu duyệt, booking được tạo ngay ở trạng thái `CONFIRMED`.

### Luồng 3: Đặt chỗ phòng thuyết trình (`PENDING_APPROVAL` cần duyệt)
1. Chọn *Phòng Thuyết Trình Diamond 401* (hoặc Platinum 402).
2. Bấm đặt phòng $\rightarrow$ Hệ thống thông báo phòng cần Staff duyệt.
3. Sau khi đặt, booking bắt đầu ở trạng thái `PENDING_APPROVAL`.

### Luồng 4: Bàn làm việc duyệt đặt chỗ (`/core-approval`)
1. Truy cập `http://localhost:5173/core-approval`.
2. Thấy danh sách các booking đang chờ duyệt (`PENDING_APPROVAL`).
3. **Thao tác Duyệt:** Bấm **"Phê Duyệt Ngay"** $\rightarrow$ Hệ thống tự động re-check phòng còn trống không $\rightarrow$ Chuyển sang `CONFIRMED`.
4. **Thao tác Từ chối:** Bấm **"Từ Chối"** $\rightarrow$ Popup bắt buộc nhập lý do từ chối (quy tắc R-20) $\rightarrow$ Chuyển sang `REJECTED`.
5. **Kiểm tra biên (R-18):** Nếu một booking có `startTime` đã trôi qua mà Staff cố tình duyệt, API sẽ tự động chuyển booking sang `EXPIRED` và từ chối duyệt với mã lỗi `BOOKING_APPROVAL_EXPIRED`.

### Luồng 5: Quản lý lịch cá nhân, Hủy & Check-in (`/my-bookings`)
1. Truy cập `http://localhost:5173/my-bookings`.
2. Xem danh sách theo các tab: *Đang Hoạt Động*, *Chờ Phê Duyệt*, *Đã Xác Nhận*, *Lịch Sử Kết Thúc*.
3. **Nút Hủy đặt chỗ:** Cho phép hủy booking trước giờ bắt đầu ($now < startTime$). Sau khi hủy, phòng được giải phóng ngay lập tức.
4. **Nút Check-in:** Bật sáng khi thời gian hiện tại nằm trong cửa sổ $[startTime - 15', startTime + 15']$. Nếu chưa đến giờ hoặc đã quá giờ, nút sẽ hiển thị thông báo chi tiết.
5. **Nút Xem Nhật Ký:** Mở popup Timeline hiển thị toàn bộ lịch sử truy vết ai đã tạo, duyệt, hủy, check-in kèm lý do.

### Luồng 6: Kiểm tra các quy tắc chống xung đột (Conflict Handling)
* **Xung đột đặt trùng (Race Condition / Double Booking):** Hai yêu cầu cùng đặt 1 phòng trong cùng khoảng thời gian $\rightarrow$ Request thứ 2 sẽ bị chặn với mã `BOOKING_TIME_CONFLICT` và chi tiết phòng đã bận.
* **Xung đột lịch học chính khóa (SIS Schedule):** Sinh viên đặt phòng vào khung giờ đang có tiết học chính khóa (bảng `student_schedules`) $\rightarrow$ Bị chặn với mã `STUDENT_SCHEDULE_CONFLICT`.
* **Xung đột bảo trì (Maintenance Block):** Đặt phòng vào khung giờ đang có lịch bảo trì (bảng `maintenance_blocks`) $\rightarrow$ Bị chặn với mã `SPACE_MAINTENANCE_CONFLICT`.
* **Hạn mức đặt chỗ trong ngày (Daily Quota):** Đặt quá 2 booking chiếm chỗ trong 1 ngày $\rightarrow$ Bị chặn với mã `QUOTA_EXCEEDED`.
