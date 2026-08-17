-- ============================================================
-- Không Gian Phim — Tracking / Thống kê (Supabase)
-- ------------------------------------------------------------
-- Chạy script này trong Supabase: Dashboard → SQL Editor → New query
-- Mọi lệnh chạy được lặp lại an toàn (idempotent).
-- ============================================================

-- 1) Bảng ghi nhận sự kiện (pageview + movie view)
create table if not exists public.tracking_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type       text        not null,            -- 'pageview' | 'movie'
  path       text,                            -- path đang xem (pageview)
  source     text        not null default 'direct', -- direct | search | social | external
  referrer   text,
  movie_name text,                            -- tên phim (movie)
  movie_slug text,
  genres     text[]      not null default '{}',
  countries  text[]      not null default '{}'
);

create index if not exists tracking_events_created_at_idx on public.tracking_events (created_at);
create index if not exists tracking_events_type_idx on public.tracking_events (type);

-- 2) Function ghi sự kiện — gọi từ api/track.ts
create or replace function public.track_event(
  p_type      text,
  p_path      text,
  p_source    text,
  p_referrer  text default null,
  p_movie_name text default null,
  p_movie_slug text default null,
  p_genres    text[] default '{}',
  p_countries text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tracking_events
    (type, path, source, referrer, movie_name, movie_slug, genres, countries)
  values
    (p_type, p_path, p_source, p_referrer, p_movie_name, p_movie_slug, p_genres, p_countries);
end;
$$;

-- 3) Function tổng hợp số liệu — gọi từ api/stats.ts
create or replace function public.get_stats(days int default 7)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  since  timestamptz := date_trunc('day', now() - (days || ' days')::interval);
  result json;
begin
  select json_build_object(
    'total',       (select count(*) from public.tracking_events),
    'today',       (select count(*) from public.tracking_events
                      where created_at >= date_trunc('day', now())),
    'movieTotal',  (select count(*) from public.tracking_events where type = 'movie'),
    'bySource',    (select coalesce(json_agg(x order by x.value desc), '[]'::json) from (
                      select source as name, count(*) as value
                      from public.tracking_events
                      group by source
                    ) x),
    'byDay',       (select coalesce(json_agg(x order by x.day), '[]'::json) from (
                      select to_char(d, 'YYYY-MM-DD') as day,
                             count(e.id) as visits
                      from generate_series(since, now(), '1 day') d
                      left join public.tracking_events e
                        on e.created_at >= d
                       and e.created_at <  d + interval '1 day'
                      group by d
                    ) x),
    'topPaths',    (select coalesce(json_agg(x order by x.value desc), '[]'::json) from (
                      select path as name, count(*) as value
                      from public.tracking_events
                      where path is not null
                      group by path
                      order by value desc
                      limit 10
                    ) x),
    'topMovies',   (select coalesce(json_agg(x order by x.value desc), '[]'::json) from (
                      select movie_name as name, count(*) as value
                      from public.tracking_events
                      where type = 'movie' and movie_name is not null
                      group by movie_name
                      order by value desc
                      limit 10
                    ) x),
    'topGenres',   (select coalesce(json_agg(x order by x.value desc), '[]'::json) from (
                      select g as name, count(*) as value
                      from public.tracking_events, unnest(genres) g
                      where type = 'movie'
                      group by g
                      order by value desc
                      limit 15
                    ) x),
    'topCountries',(select coalesce(json_agg(x order by x.value desc), '[]'::json) from (
                      select c as name, count(*) as value
                      from public.tracking_events, unnest(countries) c
                      where type = 'movie'
                      group by c
                      order by value desc
                      limit 15
                    ) x)
  ) into result;

  return result;
end;
$$;

-- 4) Mở quyền gọi functions qua API (service_role đã có quyền;
--    mở thêm anon để chạy local/test nếu cần — tự quyết định có
--    giữ hay không; service_role trong Vercel vẫn hoạt động kể cả
--    khi bỏ dòng này).
grant execute on function public.track_event(text, text, text, text, text, text, text[], text[]) to anon, authenticated, service_role;
grant execute on function public.get_stats(int) to anon, authenticated, service_role;

-- ============================================================
-- PHẦN QUẢN TRỊ (ADMIN)
-- ------------------------------------------------------------
-- Bảng tài khoản admin, phiên đăng nhập, và nội dung bảo trì.
-- Mật khẩu được hash bằng pgcrypto `crypt()` — KHÔNG lưu plaintext.
--
-- TẠO TÀI KHOẢN ĐẦU TIÊN:
--   Chạy lệnh sau trong SQL Editor (thay admin / matkhau / Tên hiển thị):
--     select public.create_admin_user('admin', 'matkhau', 'Admin');
--
-- Khi bật bảo trì (maintenance.enabled = true), toàn bộ trang công
-- khai sẽ hiển thị trang bảo trì với nội dung HTML do admin soạn
-- (trừ /admin vẫn truy cập được để quản lý).
-- ============================================================

create extension if not exists pgcrypto;

-- 5) Tài khoản quản trị
create table if not exists public.admin_users (
  id           bigint generated always as identity primary key,
  username     text unique not null,
  password_hash text not null,
  display_name text,
  role         text not null default 'admin',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  last_login_at timestamptz
);

-- 6) Phiên đăng nhập (token được tạo bởi admin_login)
create table if not exists public.admin_sessions (
  token      text primary key,
  user_id    bigint not null references public.admin_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_sessions_user_idx on public.admin_sessions (user_id);
create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);

-- 7) Nội dung bảo trì — chỉ có 1 dòng (id = 1)
create table if not exists public.maintenance (
  id           int primary key default 1,
  enabled      boolean not null default false,
  title        text not null default 'Hệ thống đang bảo trì',
  content_html text not null default '',
  updated_at   timestamptz not null default now()
);

insert into public.maintenance (id) values (1)
on conflict (id) do nothing;

-- 8) Tạo tài khoản admin (dùng để tạo tài khoản ĐẦU TIÊN qua SQL Editor,
--    hoặc từ dashboard admin sau khi đăng nhập).
create or replace function public.create_admin_user(
  p_username text,
  p_password text,
  p_display_name text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  u admin_users%rowtype;
begin
  if p_username is null or length(trim(p_username)) < 3 then
    return json_build_object('ok', false, 'error', 'username_too_short');
  end if;
  if p_password is null or length(p_password) < 6 then
    return json_build_object('ok', false, 'error', 'password_too_short');
  end if;
  if exists (select 1 from public.admin_users where lower(username) = lower(trim(p_username))) then
    return json_build_object('ok', false, 'error', 'username_exists');
  end if;

  insert into public.admin_users (username, password_hash, display_name)
  values (trim(p_username), crypt(p_password, gen_salt('bf')), coalesce(p_display_name, p_username))
  returning * into u;

  return json_build_object(
    'ok', true,
    'id', u.id,
    'username', u.username,
    'display_name', u.display_name,
    'role', u.role
  );
end;
$$;

-- 9) Đăng nhập — trả về token phiên (tồn tại 30 ngày)
create or replace function public.admin_login(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  u     admin_users%rowtype;
  token text;
begin
  select * into u
  from public.admin_users
  where lower(username) = lower(trim(p_username)) and active = true;

  if u.id is null or u.password_hash is null then
    return json_build_object('ok', false, 'error', 'invalid_credentials');
  end if;

  if u.password_hash <> crypt(p_password, u.password_hash) then
    return json_build_object('ok', false, 'error', 'invalid_credentials');
  end if;

  token := encode(gen_random_bytes(32), 'hex');

  update public.admin_users set last_login_at = now() where id = u.id;

  insert into public.admin_sessions (token, user_id, expires_at)
  values (token, u.id, now() + interval '30 days');

  return json_build_object(
    'ok', true,
    'token', token,
    'user', json_build_object(
      'id', u.id,
      'username', u.username,
      'display_name', u.display_name,
      'role', u.role
    )
  );
end;
$$;

-- 10) Xác thực token phiên — trả về thông tin user hoặc null
create or replace function public.admin_verify(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  u admin_users%rowtype;
begin
  select au.* into u
  from public.admin_sessions s
  join public.admin_users au on au.id = s.user_id
  where s.token = p_token
    and s.expires_at > now()
    and au.active = true;

  if u.id is null then
    return null;
  end if;

  return json_build_object(
    'id', u.id,
    'username', u.username,
    'display_name', u.display_name,
    'role', u.role
  );
end;
$$;

-- 11) Đăng xuất — xoá token phiên
create or replace function public.admin_logout(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.admin_sessions where token = p_token;
end;
$$;

-- 12) Đọc nội dung bảo trì (public — để trang hiển thị khi bật)
create or replace function public.get_maintenance()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  m maintenance%rowtype;
begin
  select * into m from public.maintenance where id = 1;
  if m.id is null then
    return json_build_object('enabled', false, 'title', '', 'content_html', '', 'updated_at', null);
  end if;
  return json_build_object(
    'enabled', m.enabled,
    'title', m.title,
    'content_html', m.content_html,
    'updated_at', m.updated_at
  );
end;
$$;

-- 13) Cập nhật nội dung bảo trì (chỉ admin)
create or replace function public.set_maintenance(
  p_enabled boolean,
  p_title text,
  p_content_html text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.maintenance (id, enabled, title, content_html, updated_at)
  values (1, p_enabled, coalesce(p_title, ''), coalesce(p_content_html, ''), now())
  on conflict (id) do update
    set enabled = p_enabled,
        title   = coalesce(p_title, ''),
        content_html = coalesce(p_content_html, ''),
        updated_at = now();
end;
$$;

-- 14) Danh sách admin (dashboard hiển thị)
create or replace function public.list_admin_users()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select coalesce(json_agg(x order by x.created_at), '[]'::json) into result from (
    select id, username, display_name, role, active, created_at, last_login_at
    from public.admin_users
  ) x;
  return result;
end;
$$;

-- 15) Xoá tài khoản admin (dashboard; không cho xoá chính mình)
create or replace function public.delete_admin_user(p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.admin_users where id = p_id and role <> 'owner';
  return json_build_object('ok', true);
end;
$$;

-- Quyền: mở cho anon/authenticated/service_role để linh hoạt khi chạy
-- local/test. Trên production, Vercel dùng service_role nên vẫn hoạt
-- động. Nếu muốn chặt hơn, chỉ giữ service_role.
grant execute on function public.create_admin_user(text, text, text) to anon, authenticated, service_role;
grant execute on function public.admin_login(text, text) to anon, authenticated, service_role;
grant execute on function public.admin_verify(text) to anon, authenticated, service_role;
grant execute on function public.admin_logout(text) to anon, authenticated, service_role;
grant execute on function public.get_maintenance() to anon, authenticated, service_role;
grant execute on function public.set_maintenance(boolean, text, text) to anon, authenticated, service_role;
grant execute on function public.list_admin_users() to anon, authenticated, service_role;
grant execute on function public.delete_admin_user(bigint) to anon, authenticated, service_role;
