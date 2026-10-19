# Lab

NestJS + MongoDB + Next.js: đăng ký / đăng nhập bằng username + mật khẩu, trang quản trị người dùng.

| Thư mục     | Mô tả                         | Cổng mặc định |
| ----------- | ----------------------------- | ------------- |
| `backend/`  | NestJS API (prefix `/api`)    | 4000          |
| `frontend/` | Next.js (App Router)          | 3000          |
| MongoDB     | `docker-compose.yml`          | 27017         |

## Chạy dự án

```bash
# 1. MongoDB
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# 3. Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Mở http://localhost:3000.

## Tài khoản admin

Tài khoản admin được fix cứng trong `backend/src/auth/admin.constants.ts`, không lưu trong DB:

- Username: `admin`
- Password: `123456aA@`

Đăng nhập bằng admin sẽ được chuyển tới `/admin/users`. Username `admin` không thể đăng ký.

## API

| Method | Endpoint               | Quyền | Mô tả                                            |
| ------ | ---------------------- | ----- | ------------------------------------------------ |
| POST   | `/api/auth/register`   | —     | Đăng ký `{ username, password, fullName? }`      |
| POST   | `/api/auth/login`      | —     | Đăng nhập, trả về `{ accessToken, refreshToken, user }` |
| POST   | `/api/auth/refresh`    | —     | Đổi token mới bằng `{ refreshToken }` (rotate)   |
| POST   | `/api/auth/logout`     | —     | Thu hồi `{ refreshToken }`                       |
| GET    | `/api/auth/me`         | login | Thông tin người đang đăng nhập                   |
| GET    | `/api/admin/users`     | admin | Danh sách, query `q`, `page`, `limit`            |
| GET    | `/api/admin/users/:id` | admin | Chi tiết                                         |
| POST   | `/api/admin/users`     | admin | Tạo `{ username, password, fullName?, isActive? }` |
| PATCH  | `/api/admin/users/:id` | admin | Sửa `{ fullName?, password?, isActive? }`        |
| DELETE | `/api/admin/users/:id` | admin | Xóa                                              |

Gửi access token qua header `Authorization: Bearer <accessToken>`. Access token mặc định hết hạn sau `15m`; refresh token sau `7d` và được lưu hash trong MongoDB. Mỗi lần `/auth/refresh` sẽ rotate (thu hồi token cũ, cấp cặp mới). Tài khoản bị khóa / đổi mật khẩu / xóa sẽ thu hồi toàn bộ refresh token.
