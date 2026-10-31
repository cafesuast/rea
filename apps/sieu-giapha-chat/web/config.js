/* Cấu hình máy chủ. Để trống = app chạy trên máy (dữ liệu trong trình duyệt).
 * Điền Project URL và anon public key của Supabase (Project Settings › API) để
 * bật đăng nhập, dữ liệu chung và AI qua máy chủ. Anon key là khóa công khai,
 * an toàn khi đặt ở đây vì quyền truy cập do Row Level Security quyết định.
 * Tuyệt đối KHÔNG đặt service_role key hay khóa Claude API vào tệp này. */
window.SGP_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
