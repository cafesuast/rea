# Siêu GiaPha chat

Ứng dụng web một tệp (`index.html`) gồm hai phần chạy song song:

1. **Gia phả**: cây gia phả có chat, ngày giỗ âm lịch, cách xưng hô, nhập từ ảnh và sách, đặt gia phả song song với lịch sử Việt Nam.
2. **Siêu Từ Điển**: từ điển Việt – Anh 10 tầng (Fact / Inference / Unknown), bài học tiếng Việt, sách lớp 1–12 tự soạn theo chủ đề chương trình 2018, khóa tiếng Anh giao tiếp từ số 0.

Giao diện dùng màu Zalo, kiểu chat và menu gọn của Claude.

**Mới dùng?** Đọc [HUONG-DAN.md](HUONG-DAN.md). Trong app, bấm nút **?** trên cùng để mở hướng dẫn có đọc to (🔊) từng đoạn.

## Hai phần, cùng 8 tab

| Tab | Gia phả | Siêu Từ Điển |
|---|---|---|
| 💬 | Trò chuyện với trợ lý gia phả | Trò chuyện, hỏi nghĩa từ |
| 🌳 / 🔎 | Cây gia phả | Tra cứu A–Z, lọc 5 trục |
| 👥 / ✅ | Thành viên | Kiểm duyệt mục từ |
| 🕯️ / 📈 | Ngày giỗ (âm lịch) | Kế hoạch 1–2 triệu từ |
| 📥 | Nhập liệu | Nhập liệu |
| 📜 / 📚 | Dòng họ & Lịch sử, gia phả họ Lê | Bài học, sách lớp 1–12 |
| 😊 | Dễ dùng (ô hình lớn cho người cao tuổi) | Dễ dùng · Tiếng Anh giao tiếp |
| 💾 / 📒 | Sao lưu JSON, xuất GEDCOM | Sổ tay, xuất .md / .zip |

## 6 cách nhập ở mọi chỗ nhập liệu

⌨️ Gõ tay · 🎤 Nói · 📷 Chụp ảnh · 🖼️ Ảnh hoặc PDF · 📋 Dán chữ · 📄 Tệp

Chúng có ở hai màn Nhập liệu, ở nút **+** của hai khung chat và trong biểu mẫu.

Với gia phả, ảnh chụp **bản viết tay, sách in, bản in hoặc Hán Nôm** được Claude đọc từng trang. Claude chép lại chữ rồi tách ra từng người, kèm cha mẹ và vợ chồng. Người dùng duyệt lại trước khi lưu: người trùng tên được báo, chỗ chữ khó đọc được ghi chú. Bản chép lại được lưu kèm.

## Chạy thử

- **Đầy đủ tính năng**: mở trang dưới dạng Artifact trong Claude. Cần cấp quyền cho kho dữ liệu (`db`), Claude (`sample`), người dùng (`user`), tải tệp (`downloads`) và Google Drive (`mcp`).
- **Ngoài Claude**: mở `index.html` bằng trình duyệt. App chạy ở chế độ xem thử với dữ liệu mẫu. Các tính năng cần Claude (đọc ảnh, soạn bài, chat AI) và đồng bộ Drive sẽ báo là không dùng được.

Thư viện tải từ CDN: html2pdf.js 0.10.1 (xuất PDF sách lớp) và pdf.js 3.11.174 (đọc tệp PDF), cả hai từ cdnjs, cùng phông Google Fonts.

## Dữ liệu

| Bộ sưu tập (`db`) | Nội dung |
|---|---|
| `words` | Mục từ của Siêu Từ Điển |
| `people` | Gia phả gia đình. Dữ liệu mẫu họ Lê có cờ `sample:true` và nút "Xóa dữ liệu mẫu" |
| `lineage_le` | Cây triều Lê, đồng bộ từ tệp `trieu-le.ged` (Wikidata CC0) |
| `clan` | Từ điển gia phả họ Lê (INDEX-LE, FULL-LE 10 tầng) |
| `gpsources` | Bản chép lại từ ảnh và tài liệu gia phả |
| `deep`, `books` | Bài học sâu và sách lớp 1–12 do Claude soạn, lưu lại để mở lần sau |
| `data/users/<id>` | Sổ tay, tiến độ học và phả hệ 19 đời riêng của từng người |

Tiến độ khóa tiếng Anh (chuỗi ngày, XP, thẻ ôn) lưu trên trình duyệt (`localStorage`).

## Quy tắc riêng tư

- Không ghi đời tư của người đang sống (nhà riêng, số điện thoại, email, tài khoản) vào kho chung.
- Danh sách con cháu đang sống của gia phả tư gia không đưa vào kho công khai.
- Không bịa dữ liệu. Chỗ chưa rõ ghi `Unknown`.
- Bài luyện phỏng vấn visa chỉ để luyện nói, không phải tư vấn pháp lý.

## Kiểm thử

Cần Node 18+ và Playwright có Chromium (`npm i -D playwright && npx playwright install chromium`).

```bash
node tests/run-all.cjs
```

Có 6 bộ kiểm thử, mỗi bộ chạy ở khổ máy tính (1280 px) và điện thoại (390 px):

| Bộ kiểm thử | Phạm vi |
|---|---|
| `giapha-clan` | Nhúng cây gia phả, đồng bộ từ điển họ Lê từ Drive (giả lập), cây triều Lê |
| `guide` | Trang hướng dẫn: lời chào lần đầu, đủ 5 nhóm nội dung, đọc to, nút ? |
| `english-course` | Đủ 5 bước của một bài, luyện tập, nói với Claude (giả lập và kịch bản dự phòng), ôn thẻ |
| `import-and-history` | Nhập gia phả từ ảnh và văn bản, nối cha mẹ và vợ chồng, phát hiện trùng, dòng thời gian song song lịch sử |
| `parallel-tabs` | Đủ 8 tab của cả hai phần, menu + với 6 cách nhập |
| `two-sections` | Chuyển giữa hai phần, menu và thanh tab |

Mỗi bộ kiểm tra rằng trang không có lỗi JavaScript và không bị tràn ngang. Ảnh chụp màn hình được ghi vào `tests/out/`.

## Nguồn và giấy phép

- Lịch âm dương theo thuật toán của Hồ Ngọc Đức.
- Cây triều Lê lấy từ Wikidata (CC0). Danh mục họ Lê dẫn bài Wikipedia tiếng Việt (CC BY-SA 4.0).
- Bài học, sách lớp 1–12 và khóa tiếng Anh đều tự soạn, không sao chép sách giáo khoa.
- Mã nguồn theo giấy phép MIT của kho này.
