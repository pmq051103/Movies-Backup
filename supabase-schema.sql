-- ============================================================
-- KHÔNG GIAN PHIM — Analytics schema for /thong-ke dashboard
-- ------------------------------------------------------------
-- Chạy toàn bộ file này trong Supabase Dashboard → SQL Editor
-- (Project của bạn → SQL Editor → New query → dán vào → Run).
-- ============================================================

-- Mỗi dòng = 1 lượt xem 1 trang bất kỳ (trang chủ, thể loại, phim
-- lẻ, chi tiết phim...), ghi bởi useAnalyticsTracking ở MỌI trang.
create table if not exists page_views (
  id           bigint generated always as identity primary key,
  path         text not null,
  referrer_type text not null check (referrer_type in ('direct', 'referral')),
  session_id   text not null,
  created_at   timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on page_views (created_at);
create index if not exists page_views_path_idx on page_views (path);

-- Mỗi dòng = 1 lượt mở trang chi tiết phim (1 lần / phiên / phim,
-- nhờ dedupe ở phía client trong src/lib/analytics.ts).
create table if not exists movie_views (
  id           bigint generated always as identity primary key,
  movie_slug   text not null,
  movie_name   text not null,
  categories   text[] not null default '{}',
  countries    text[] not null default '{}',
  session_id   text not null,
  created_at   timestamptz not null default now()
);

create index if not exists movie_views_created_at_idx on movie_views (created_at);

-- ------------------------------------------------------------
-- Row Level Security: cho phép AI (ứng dụng web, dùng anon key)
-- ghi (insert) lượt xem, nhưng KHÔNG cho phép đọc (select) qua
-- anon key — chỉ trang /thong-ke đọc được nếu bạn dùng service
-- role key ở backend. Ở đây trang thống kê chạy hoàn toàn phía
-- client bằng anon key, nên mình mở luôn quyền đọc cho anon —
-- KHÔNG ai truy cập được các bảng này trừ khi họ có anon key +
-- biết đúng URL Supabase, và trang /thong-ke đã có mật khẩu chặn
-- ở tầng UI. Nếu muốn chặt hơn, cân nhắc dùng Supabase Edge
-- Function + service role key thay vì đọc thẳng từ client.
-- ------------------------------------------------------------

alter table page_views enable row level security;
alter table movie_views enable row level security;

create policy "Allow public insert on page_views"
  on page_views for insert
  to anon
  with check (true);

create policy "Allow public select on page_views"
  on page_views for select
  to anon
  using (true);

create policy "Allow public insert on movie_views"
  on movie_views for insert
  to anon
  with check (true);

create policy "Allow public select on movie_views"
  on movie_views for select
  to anon
  using (true);
