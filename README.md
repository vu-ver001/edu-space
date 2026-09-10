# EduSpace — 1 repo (backend + frontend)

Skeleton project rong cho team 5 nguoi (chua code nghiep vu).
Chi tiet phan cong: `../04_Phan_cong_cong_viec_EduSpace.md`.

## Cau truc

```
eduspace/
  backend/    Spring Boot 4.x, Java 17, port 8080 (Maven wrapper kem san)
  frontend/   React 19 + Vite + TS, port 5173
  docker-compose.yml  MySQL 8.x cho dev local
```

## Chay local (thu tu)

```bash
# 1. MySQL
docker compose up -d

# 2. Backend (cua so terminal 1)
cd backend
.\mvnw.cmd spring-boot:run
# kiem tra: http://localhost:8080/health -> {"status":"OK"}

# 3. Frontend (cua so terminal 2)
cd frontend
npm install
npm run dev
# mo http://localhost:5173, dong "Backend: ... OK" la noi duoc BE
```

Tai khoan that, seed data, JWT/RBAC: Tan lam o PR `feat/auth-users-tan`.
Logic booking/avail: Van lam o PR `feat/booking-core-van`.

## Quy uoc nhanh

- Loi API: `{code, message, details}` — 400/401/403/404/409.
- `studentId` lay tu JWT, khong tin client.
- Giao nhau thoi gian: `newStart < existingEnd AND newEnd > existingStart`.
- Moi domain FE co 1 service trong `frontend/src/services/`, chua co API that thi dung fixture cung shape.
