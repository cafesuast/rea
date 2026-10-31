# Cài Siêu GiaPha chat thành app chạy thực tế

Bản web nằm trong thư mục `web/`. App có hai chế độ:

| Chế độ | Khi nào | Có gì |
|---|---|---|
| **Trên máy** | `web/config.js` để trống | Chạy ngay, miễn phí. Dữ liệu lưu trong trình duyệt của từng máy. AI dùng khóa Claude API riêng của người dùng (nhập trong Tài khoản › Cài đặt app). Không có dữ liệu chung, bot chỉ chạy một mình. |
| **Supabase** | `web/config.js` có địa chỉ Supabase | Đăng nhập Google hoặc email, dữ liệu chung cho cả dòng họ, gia phả riêng của từng người, bot trao đổi với nhau, AI qua máy chủ (người dùng không cần khóa riêng). |

Cả hai chế độ đều cài được lên điện thoại như app (PWA) và mở được khi mất mạng.

## Bước 1. Tạo dự án Supabase (miễn phí)

1. Vào https://supabase.com, đăng nhập bằng GitHub hoặc Google, bấm **New project**.
2. Đặt tên (ví dụ `sieu-giapha-chat`), đặt mật khẩu cơ sở dữ liệu, chọn vùng **Southeast Asia (Singapore)**.
3. Chờ khoảng 2 phút cho dự án chạy.

## Bước 2. Tạo bảng và quyền truy cập

1. Trong dự án, mở **SQL Editor** › **New query**.
2. Dán toàn bộ nội dung tệp [`supabase/schema.sql`](supabase/schema.sql), bấm **Run**.

Tệp này tạo bảng `docs` (mọi dữ liệu của app), `profiles` (tên, ảnh đại diện), `editors` (biên tập viên), `ai_usage` (đếm lượt AI), và bật Row Level Security:

- Dữ liệu chung (từ điển, gia phả dòng họ, đề xuất của bot, lịch sử đã kiểm chứng): ai cũng xem được, người đã đăng nhập mới sửa được.
- Gia phả riêng `data/users/<id>/...`: chỉ chủ tài khoản đọc và sửa được.
- Hồ sơ bot `bots/<id>`: chỉ chủ bot sửa được.
- Xóa mục ở dữ liệu chung: chỉ người tạo mục đó hoặc biên tập viên.

## Bước 3. Bật đăng nhập

1. **Authentication › Sign In / Providers**:
   - **Email**: bật sẵn. App gửi link đăng nhập qua email, không cần mật khẩu.
   - **Google**: bật lên. Cần Client ID và Client Secret từ Google Cloud Console (APIs & Services › Credentials › OAuth client ID, loại Web application). Ở Google, thêm *Authorized redirect URI* là địa chỉ callback mà Supabase hiện ngay trong trang cấu hình Google.
2. **Authentication › URL Configuration**:
   - **Site URL**: địa chỉ web của app (bước 6), ví dụ `https://cafesuast.github.io/sieu-giapha-chat/`.
   - **Redirect URLs**: thêm cùng địa chỉ đó.

## Bước 4. Máy chủ AI (Edge Function)

Cần cài [Supabase CLI](https://supabase.com/docs/guides/cli) trên máy tính, rồi trong thư mục `apps/sieu-giapha-chat`:

```bash
supabase login
supabase init                                     # chỉ lần đầu, nếu CLI báo thiếu cấu hình
supabase link --project-ref <mã-dự-án>          # mã nằm trong địa chỉ dự án
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... # khóa Claude API của bạn
supabase secrets set DAILY_LIMIT=200              # số lượt AI tối đa mỗi người mỗi ngày
supabase functions deploy claude
```

Khóa Claude API lấy ở https://console.anthropic.com (Settings › API Keys). Khóa chỉ nằm trên máy chủ Supabase, không bao giờ gửi xuống trình duyệt. Mọi lượt AI của mọi người đều tính tiền vào tài khoản Claude API này, nên hãy đặt `DAILY_LIMIT` và giới hạn chi tiêu trong console.anthropic.com.

Có thể đặt thêm `ALLOWED_ORIGIN` bằng địa chỉ web của app để chỉ trang của bạn gọi được máy chủ AI.

## Bước 5. Nối app với Supabase

Mở **Project Settings › API**, chép **Project URL** và **anon public key** vào `web/config.js`:

```js
window.SGP_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",
};
```

Anon key là khóa công khai, đặt trong trang web là bình thường; quyền truy cập do Row Level Security ở bước 2 quyết định. **Không bao giờ** đặt `service_role` key hay khóa Claude API vào tệp này.

## Bước 6. Đăng app lên web

Cách đơn giản nhất là một kho GitHub riêng cho app:

1. Tạo kho mới, ví dụ `cafesuast/sieu-giapha-chat`.
2. Chép thư mục `web/` vào gốc kho, và chép [`deploy/github-pages.yml`](deploy/github-pages.yml) vào `.github/workflows/pages.yml`.
3. Trong kho mới: **Settings › Pages › Source: GitHub Actions**.
4. Đẩy lên nhánh `main`. Vài phút sau app có ở `https://cafesuast.github.io/sieu-giapha-chat/`.

Cách khác: kéo thả thư mục `web/` vào https://app.netlify.com/drop hoặc Cloudflare Pages.

Kho `rea` hiện tại không dùng được GitHub Pages cho app này vì kho đã dùng Pages cho website của rea.

## Bước 7. Làm biên tập viên

Đăng nhập app một lần, rồi chạy trong SQL Editor (thay email):

```sql
insert into public.editors (user_id)
select id from auth.users where email = 'email-cua-ban@gmail.com';
```

Biên tập viên được duyệt tay đề xuất của bot và xóa mục sai ở dữ liệu chung.

## Cài lên điện thoại

- **iPhone (Safari)**: mở địa chỉ app › nút Chia sẻ › **Thêm vào MH chính**.
- **Android (Chrome)**: mở địa chỉ app › menu ⋮ › **Cài đặt ứng dụng**.

## Cập nhật app

Bản trong Claude (`index.html`) là bản gốc. Sau khi sửa, chạy:

```bash
node web/build.cjs
```

lệnh này tạo lại `web/index.html`. Sau đó đẩy thư mục `web/` lên nơi đăng app.

## Chuyển dữ liệu từ bản trong Claude

Trong app trên Claude, dùng 💾 Sao lưu (gia phả, .json) hoặc 📒 Sổ tay & xuất (từ điển, .md/.zip), rồi nhập vào bản web bằng tab Nhập liệu tương ứng.

## Những gì chưa có ở bản web

- **Google Drive**: đồng bộ thư mục "Siêu Từ Điển" từ Drive chỉ chạy trong Claude. Bản web nhập bằng tệp tải lên.
- **Bot**: chỉ chạy khi chủ tài khoản mở app.
