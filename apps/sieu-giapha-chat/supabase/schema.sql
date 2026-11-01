-- Siêu GiaPha chat · cơ sở dữ liệu Supabase
-- Chạy toàn bộ tệp này một lần trong Supabase › SQL Editor.
-- Mọi dữ liệu của app nằm trong bảng docs (giống kho tài liệu của bản Claude):
--   path = "bo-suu-tap/.../id", col = phần trước id, data = nội dung JSON.
-- Vùng riêng data/users/<uid>/... chỉ chủ tài khoản đọc và ghi được.

create table if not exists public.docs (
  path       text primary key,
  col        text not null,
  id         text not null,
  owner      uuid default auth.uid(),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint docs_path_ok check (path = col || '/' || id)
);
create index if not exists docs_col_idx on public.docs (col);

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Biên tập viên: được duyệt tay đề xuất của bot và xóa mục ở dữ liệu chung.
create table if not exists public.editors (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Đếm lượt dùng AI mỗi ngày (chỉ Edge Function đọc ghi, bằng service role).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  n       int  not null default 0,
  primary key (user_id, day)
);

-- Chủ của vùng riêng: data/users/<uid>/... -> '<uid>', còn lại -> null
create or replace function public.sgp_private_owner(p text) returns text
language sql immutable as $$
  select case when p like 'data/users/%' then split_part(p, '/', 3) else null end
$$;

create or replace function public.sgp_is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = auth.uid())
$$;

-- Ghi vào dữ liệu chung được phép? Hồ sơ bot bots/<uid> chỉ chủ của nó sửa.
create or replace function public.sgp_shared_write_ok(p_col text, p_id text) returns boolean
language sql stable as $$
  select auth.uid() is not null
     and (p_col <> 'bots' or p_id = auth.uid()::text or public.sgp_is_editor())
$$;

alter table public.docs     enable row level security;
alter table public.profiles enable row level security;
alter table public.editors  enable row level security;
alter table public.ai_usage enable row level security;

drop policy if exists docs_read_shared on public.docs;
drop policy if exists docs_read_own on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;

-- Đọc: dữ liệu chung ai cũng đọc được (kể cả khách); vùng riêng chỉ chủ.
create policy docs_read_shared on public.docs for select
  using (public.sgp_private_owner(path) is null);
create policy docs_read_own on public.docs for select to authenticated
  using (public.sgp_private_owner(path) = auth.uid()::text);

-- Thêm, sửa: người đã đăng nhập; vùng riêng chỉ chủ.
create policy docs_insert on public.docs for insert to authenticated
  with check (
    case when public.sgp_private_owner(path) is null then public.sgp_shared_write_ok(col, id)
         else public.sgp_private_owner(path) = auth.uid()::text end);
create policy docs_update on public.docs for update to authenticated
  using (
    case when public.sgp_private_owner(path) is null then public.sgp_shared_write_ok(col, id)
         else public.sgp_private_owner(path) = auth.uid()::text end)
  with check (
    case when public.sgp_private_owner(path) is null then public.sgp_shared_write_ok(col, id)
         else public.sgp_private_owner(path) = auth.uid()::text end);

-- Xóa: vùng riêng chỉ chủ; dữ liệu chung chỉ người tạo mục đó hoặc biên tập viên.
create policy docs_delete on public.docs for delete to authenticated
  using (
    case when public.sgp_private_owner(path) is null then (owner = auth.uid() or public.sgp_is_editor())
         else public.sgp_private_owner(path) = auth.uid()::text end);

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_write on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_write on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists editors_read on public.editors;
create policy editors_read on public.editors for select to authenticated using (user_id = auth.uid());

-- Giữ owner đúng người tạo, không cho đổi khi sửa.
create or replace function public.sgp_keep_owner() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then new.owner := old.owner; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists docs_keep_owner on public.docs;
create trigger docs_keep_owner before update on public.docs for each row execute function public.sgp_keep_owner();

-- Cập nhật trực tiếp (Realtime)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Sau khi đăng nhập lần đầu, thêm chính bạn làm biên tập viên (thay email):
-- insert into public.editors (user_id) select id from auth.users where email = 'email-cua-ban@gmail.com';
