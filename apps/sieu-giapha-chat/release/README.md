# Siêu GiaPha

**Bản chính thức 1.0.0.** Xem [PHAT-HANH.md](PHAT-HANH.md).

Ứng dụng web một tệp (`index.html`) gồm hai phần chạy song song:

1. **Gia phả**: cây gia phả có chat, ngày giỗ âm lịch, cách xưng hô, nhập từ ảnh và sách, đặt gia phả song song với lịch sử Việt Nam.
2. **Siêu Từ Điển**: từ điển Việt – Anh 10 tầng (Fact / Inference / Unknown), bài học tiếng Việt, sách lớp 1–12 tự soạn theo chủ đề chương trình 2018, khóa tiếng Anh giao tiếp từ số 0.

Giao diện tối giản theo tông màu Apple, icon kiểu iPhone, kiểu chat và menu gọn của Claude. Mọi trang luôn có thanh tìm kiếm (thư viện, AI, Google Drive) và nút + mở 6 cách nhập.

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

## Tài khoản, bot và gia phả riêng

- **Đăng nhập** bằng chính tài khoản Claude của người xem, không có mật khẩu riêng.
- **Mỗi tài khoản một bot.** Mỗi ngày, khi chủ tài khoản mở app, bot kiểm chứng đề xuất của các bot khác và đề xuất từ mới, sự kiện lịch sử mới (có nguồn). Một mục chỉ vào thư viện chung khi có ít nhất 2 bot khác xác nhận đúng và không bot nào báo sai. Biên tập viên có thể duyệt tay.
- **Gia phả riêng 🔒** lưu ở `data/users/<id>/fam/people`, chỉ chủ tài khoản đọc được, kể cả chủ app cũng không đọc được.
- **Gia phả dòng họ chung 👪**: khi chia sẻ từ gia phả riêng, app ẩn 4 đời gần nhất và người còn sống, không đưa số điện thoại, nơi ở, ghi chú lên. Nút “Rà soát riêng tư” tìm và chuyển người vi phạm về gia phả riêng.
- **Nút ✨** ở mọi trang: làm mới dữ liệu, AI bổ sung chi tiết, đồng bộ Drive, cho bot chạy, tìm trong thư viện, hỏi AI, tìm trong Google Drive.

## 6 cách nhập ở mọi chỗ nhập liệu

⌨️ Gõ tay · 🎤 Nói · 📷 Chụp ảnh · 🖼️ Ảnh hoặc PDF · 📋 Dán chữ · 📄 Tệp

Chúng có ở hai màn Nhập liệu, ở nút **+** của hai khung chat và trong biểu mẫu.

Với gia phả, ảnh chụp **bản viết tay, sách in, bản in hoặc Hán Nôm** được Claude đọc từng trang. Claude chép lại chữ rồi tách ra từng người, kèm cha mẹ và vợ chồng. Người dùng duyệt lại trước khi lưu: người trùng tên được báo, chỗ chữ khó đọc được ghi chú. Bản chép lại được lưu kèm.

## Chạy thực tế (ngoài Claude)

Thư mục [`web/`](web/) là bản web chạy độc lập, cài được lên điện thoại như app và mở được khi mất mạng. Có hai chế độ: **trên máy** (không cần máy chủ) và **Supabase** (đăng nhập Google/email, dữ liệu chung, gia phả riêng, bot, AI qua máy chủ). Hướng dẫn từng bước: [CAI-DAT.md](CAI-DAT.md).

- `web/sgp-runtime.js`: lớp thay cho môi trường Claude, cùng một app chạy được cả hai nơi.
- `supabase/schema.sql`: bảng và Row Level Security. `supabase/functions/ai`: máy chủ AI giữ khóa của 7 hãng (Claude, ChatGPT, Gemini, Grok, DeepSeek, Mistral, Qwen). Mỗi tài khoản và mỗi bot chọn hãng riêng.
- `node web/build.cjs`: tạo lại `web/index.html` từ `index.html`.

## Chạy thử

- **Đầy đủ tính năng**: mở trang dưới dạng Artifact trong Claude. Cần cấp quyền cho kho dữ liệu (`db`), Claude (`sample`), người dùng (`user`), tải tệp (`downloads`) và Google Drive (`mcp`).
- **Ngoài Claude**: mở `index.html` bằng trình duyệt. App chạy trên máy, bắt đầu với gia phả trống. Các tính năng cần Claude (đọc ảnh, soạn bài, chat AI) và đồng bộ Drive sẽ báo là không dùng được.

Thư viện tải từ CDN: html2pdf.js 0.10.1 (xuất PDF sách lớp) và pdf.js 3.11.174 (đọc tệp PDF), cả hai từ cdnjs, cùng phông Google Fonts.

## Dữ liệu

| Bộ sưu tập (`db`) | Nội dung |
|---|---|
| `words` | Mục từ của Siêu Từ Điển |
| `people` | Gia phả gia đình (bản chính thức không kèm dữ liệu mẫu) |
| `lineage_le` | Cây triều Lê, đồng bộ từ tệp `trieu-le.ged` (Wikidata CC0) |
| `clan` | Từ điển gia phả họ Lê (INDEX-LE, FULL-LE 10 tầng) |
| `gpsources` | Bản chép lại từ ảnh và tài liệu gia phả |
| `deep`, `books` | Bài học sâu và sách lớp 1–12 do Claude soạn, lưu lại để mở lần sau |
| `bots`, `botx` | Hồ sơ bot (mỗi người chỉ sửa bot của mình) và các đề xuất cùng phiếu kiểm chứng |
| `histv` | Sự kiện lịch sử đã được các bot kiểm chứng |
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

Có 8 bộ kiểm thử, mỗi bộ chạy ở khổ máy tính (1280 px) và điện thoại (390 px):

| Bộ kiểm thử | Phạm vi |
|---|---|
| `giapha-clan` | Nhúng cây gia phả, đồng bộ từ điển họ Lê từ Drive (giả lập), cây triều Lê |
| `accounts` | Bot của 3 tài khoản kiểm chéo rồi đưa vào thư viện, gia phả riêng, chia sẻ ẩn 4 đời, menu ✨, thanh tìm kiếm |
| `standalone` | Bản web: chế độ trên máy (lưu IndexedDB, sao lưu, AI bằng khóa riêng, PWA) và Supabase giả lập (đăng nhập, gia phả riêng không lộ, không sửa được bot người khác, AI qua máy chủ) |
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
