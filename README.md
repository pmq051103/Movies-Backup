# 🎬 PMQMovies

Xem phim online HD miễn phí — nền tảng streaming giao diện Netflix, tích hợp API `phimapi.com` (29,000+ phim).

**Tech stack:** React 19 · Vite 6 · TypeScript · TailwindCSS v4 · TanStack Query · Zustand · Framer Motion · i18next · React Router 7 · React Icons.

---

## 🚀 Chạy local

```bash
npm install --legacy-peer-deps
npm run dev
# mở http://localhost:3000
```

> Cần `--legacy-peer-deps` vì `react-helmet-async` chưa cập nhật peer dep React 19 (thư viện vẫn chạy tốt).

Build production:
```bash
npm run build      # sinh ra dist/
npm run preview    # preview dist ở port 3000
```

---

## 📦 Đẩy code lên GitHub

### Bước 1 — Cài Git (nếu chưa có)
- Windows: [git-scm.com/download/win](https://git-scm.com/download/win)
- Mac: `brew install git`
- Ubuntu: `sudo apt install git`

Kiểm tra: `git --version`

### Bước 2 — Tạo repo trống trên GitHub
1. Vào [github.com/new](https://github.com/new)
2. Repository name: **`pmq-movies`** (hoặc tên bạn muốn)
3. **KHÔNG** tick "Add README" / "Add .gitignore" / "Add license" (dự án đã có sẵn)
4. Bấm **Create repository**
5. Copy URL HTTPS của repo: `https://github.com/<username>/pmq-movies.git`

### Bước 3 — Init & push từ máy local
Ở thư mục `movie-streaming/`, mở terminal:

```bash
# Khởi tạo git repo
git init
git branch -M main

# Set identity (chỉ lần đầu)
git config user.name  "Phạm Minh Quang"
git config user.email "pmquang05112003@gmail.com"

# Kiểm tra .gitignore đã loại node_modules
git status
# Nếu thấy node_modules trong danh sách → check .gitignore

# Add + commit
git add .
git commit -m "Initial commit: PMQMovies streaming site"

# Kết nối remote (thay URL bằng repo của bạn)
git remote add origin https://github.com/<username>/pmq-movies.git

# Push lần đầu
git push -u origin main
```

Nếu Git yêu cầu login: dùng **Personal Access Token** (không phải mật khẩu GitHub).
Lấy token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → tick `repo` → Copy token → paste khi Git hỏi password.

---

## ☁️ Deploy Vercel (miễn phí)

### Bước 1 — Tạo tài khoản
- [vercel.com/signup](https://vercel.com/signup) → **Continue with GitHub** (khỏi tạo mật khẩu riêng)

### Bước 2 — Import project
1. Dashboard Vercel → **Add New** → **Project**
2. Chọn repo `pmq-movies` bạn vừa push
3. Vercel tự nhận diện **Vite** + auto config:
   - Framework Preset: **Vite** ✓
   - Build Command: `npm run build` ✓
   - Output Directory: `dist` ✓
   - Install Command: `npm install --legacy-peer-deps` ← **nhấn "Override" và điền dòng này**
4. Environment Variables: bỏ trống (dự án có fallback mặc định)
5. Bấm **Deploy** → chờ ~90 giây

### Bước 3 — Kiểm tra
- Vercel cho URL free dạng: `https://pmq-movies-<random>.vercel.app`
- Test các route:
  - `/` (home + hero + rows)
  - `/phim-le` (grid + filter)
  - `/the-loai/hanh-dong?type=series` (tab phim bộ)
  - `/quoc-gia/viet-nam` (filter country)
  - `/donate` (QR MoMo)
  - Bấm 1 phim → `/phim/[slug]` → `/xem/[slug]` (player iframe)

Vercel tự đọc `vercel.json` trong repo và setup rewrite `/api/*` → `phimapi.com/*` — không cần config thêm.

Mỗi lần bạn `git push` lên `main`, Vercel auto redeploy sau ~1 phút.

---

## 🌐 Sau khi mua domain

1. Đăng ký domain ở [Namecheap](https://namecheap.com) / [Cloudflare](https://cloudflare.com/products/registrar) / [PA Vietnam](https://pavietnam.vn) / [TenTen](https://tenten.vn)
2. Vercel Dashboard → project của bạn → **Settings** → **Domains** → **Add**
3. Nhập domain (VD: `pmqmovies.com`), Vercel hiện 2 DNS records:
   - `A` record `@` → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`
4. Vào trang quản lý DNS của nhà cung cấp domain → dán 2 record đó → Save
5. Đợi 5-30 phút → Vercel tự cấp SSL (HTTPS) → domain live
6. Update SEO:
   - Sửa `og:image`, `canonical` trong `index.html` từ path tương đối sang absolute `https://pmqmovies.com/...`
   - Sửa `canonicalBaseUrl` trong `src/constants/seo.ts`
   - Submit `https://pmqmovies.com/sitemap.xml` lên [Google Search Console](https://search.google.com/search-console)

---

## 📁 Cấu trúc

```
src/
├─ api/          Axios client + services (phimapi.com)
├─ components/
│  ├─ common/    Skeleton, Modal, Toast, ThemeSwitcher, Logo, ...
│  ├─ layout/    Header, Footer, MainLayout
│  ├─ movie/     MovieCard, MovieRow, HeroBanner, SpotlightGrid,
│  │             TopRankingRow, MovieGrid, EpisodeList, FilterSidebar
│  ├─ search/    SearchModal (voice search)
│  └─ player/    EpisodeList
├─ pages/        Home, MovieDetail, Watch, Search, Movies, TVShows,
│                Genre, Country, TopRated, Favorites, History,
│                Donate, 404
├─ hooks/        useMovies, useDebounce, useScrollPosition, ...
├─ store/        Zustand (theme, language, favorites, history, ...)
├─ i18n/         vi + en translations
├─ types/        TypeScript definitions
├─ constants/    ROUTES, API_ENDPOINTS, LIST_SLUGS, ...
├─ utils/        Helpers (formatDate, cn, getImageUrl, ...)
├─ styles/       TailwindCSS v4 + custom utilities
└─ routes/       React Router lazy config

public/
├─ logo.png      Brand mark
├─ favicon.png   Browser tab icon
├─ momo-qr.png   Donation QR code
├─ robots.txt
└─ sitemap.xml
```

---

## 📞 Contact

- Phone: **0346991600**
- Email: **pmquang05112003@gmail.com**
- Facebook: [pmq05](https://www.facebook.com/pmq05)
- TikTok: [@q05.11](https://www.tiktok.com/@q05.11)
- Zalo: [0346991600](https://zalo.me/0346991600)
- Donate (MoMo): trên trang `/donate`

Made with ❤ by Phạm Minh Quang.
