# Siêu GiaPha 1.0.0 · Bản phát hành chính thức

Ngày phát hành: 01/11/2026. Kênh: `official` (xem `window.SGP_RELEASE` trong app).

Siêu GiaPha gồm hai app song song, dùng chung một cơ sở dữ liệu:

- **Siêu Gia Phả** (màu xanh lá): gia phả cá nhân 8 đời, gia phả riêng 20 đời, dòng họ chung, lịch sử dòng họ, mã ráp nối, đối chiếu 3 nguồn.
- **Siêu Từ Điển** (màu xanh dương): từ điển Việt – Việt – Anh, bài học, sổ tay, bot cộng đồng.

## Khác với bản thử nghiệm

- Không còn gia đình mẫu 17 người. Gia phả của tài khoản mới luôn trống.
- Không còn ví dụ gắn với một dòng họ có thật trong ô nhập, thư mục Drive mặc định và ô tìm mã.
- Không chứa ảnh, gia phả hay thông tin cá nhân nào từ giai đoạn thử nghiệm.
- Điều khoản phiên bản 2: có đơn vị vận hành, liên hệ, quyền của người dùng với dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP), và bỏ chữ "phi lợi nhuận". Người dùng cũ phải đồng ý lại.
- Sự đồng ý góp dữ liệu vào Cây gia phả Việt Nam vẫn là tùy chọn, rút lại được trong Cài đặt.

## Việc chủ sở hữu cần làm trước khi mở bán

1. Điền tên pháp nhân và email hỗ trợ: đặt `window.SGP_OPERATOR={name:"…",contact:"…"}` trong `web/config.js` (bản web) hoặc sửa mặc định trong `index.html`.
2. Nhờ luật sư rà Điều khoản và chính sách dữ liệu cá nhân, nhất là phần thu phí và chuyển dữ liệu ra nước ngoài.
3. Tạo Supabase riêng theo `CAI-DAT.md`. Không đặt khóa bí mật (service_role, khóa Claude API) vào mã nguồn.
4. Bản trong Claude dùng cơ sở dữ liệu mới, tách hẳn khỏi bản thử nghiệm.

## Kiểm thử

```
SGP_FILE=$PWD/index.html node tests/release-smoke.test.cjs
```

Kiểm tra: không còn dữ liệu demo, điều khoản v2 bắt buộc, chạy không lỗi trên máy tính (1280px) và điện thoại (390px).
