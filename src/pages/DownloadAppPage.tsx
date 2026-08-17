import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  FaAndroid,
  FaBan,
  FaBolt,
  FaBookmark,
  FaDownload,
  FaGift,
  FaLaptop,
  FaLock,
  FaMobileAlt,
} from 'react-icons/fa';

/* ------------------------------------------------------------------ */
/* Config — update the APK URL after each new build                    */
/* ------------------------------------------------------------------ */

/**
 * Direct APK download from this website.
 *
 * Place the APK file at `public/khonggianphim.apk` in the web project.
 * Vercel/Netlify serves everything in `public/` as static files, so
 * visitors get a direct browser download — no Expo account needed, no
 * redirect, no extra clicks.
 *
 * After each new EAS build:
 *   1. Download the APK from the Expo build page
 *   2. Rename it to `khonggianphim.apk`
 *   3. Drop it into `public/` folder
 *   4. Commit + deploy
 */
const APK_DOWNLOAD_URL = 'https://github.com/pmq051103/khonggianphim-releases/releases/download/1.0.0/khonggianphim.apk';

const APP_VERSION = '1.0.0';

/* ------------------------------------------------------------------ */
/* Feature card — tophim dark surface (#18181b) + gold accent          */
/* ------------------------------------------------------------------ */

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex gap-4 rounded-xl border border-white/5 bg-[#18181b] p-4 transition-colors hover:border-white/10 hover:bg-[#1e1e24]">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD166]/10 text-[#FFD166]">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DownloadAppPage — styled to match the site's tophim dark+gold theme */
/* ------------------------------------------------------------------ */

export default function DownloadAppPage() {
  return (
    <>
      <Helmet>
        <title>Tải ứng dụng — Không Gian Phim</title>
        <meta
          name="description"
          content="Tải app Không Gian Phim cho Android — xem phim HD miễn phí, không quảng cáo, không cần đăng nhập."
        />
        <meta property="og:title" content="Tải ứng dụng — Không Gian Phim" />
        <meta property="og:url" content="https://khonggianphim.online/tai-app" />
        <link rel="canonical" href="https://khonggianphim.online/tai-app" />
      </Helmet>

      <div className="min-h-screen bg-[#0f111a] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFD166]/10 text-[#FFD166] shadow-[0_0_0_1px_rgba(255,209,102,0.2)]">
              <FaMobileAlt className="h-9 w-9" />
            </div>

            <h1
              className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              Tải ứng dụng{' '}
              <span className="bg-gradient-to-r from-[#FFD166] to-[#fff1cc] bg-clip-text text-transparent">
                Không Gian Phim
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              Xem phim HD miễn phí trên điện thoại — không quảng cáo, không
              đăng nhập, không giới hạn. Trải nghiệm mượt hơn web nhờ player
              gốc của hệ điều hành.
            </p>
          </motion.div>

          {/* ── Download CTA ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <a
              href={APK_DOWNLOAD_URL}
              download="khonggianphim.apk"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#fff1cc] px-10 py-4 text-lg font-bold text-[#171717] shadow-[0_10px_40px_rgba(255,209,102,0.25)] transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <FaAndroid className="h-6 w-6" />
              Tải APK cho Android
              <FaDownload className="h-4 w-4" />
            </a>

            <a
              href={APK_DOWNLOAD_URL}
              download="khonggianphim.apk"
              className="text-xs text-white/40 underline transition-colors hover:text-[#FFD166]"
            >
              Tải trực tiếp (nếu nút trên không hoạt động)
            </a>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
              <span>Phiên bản {APP_VERSION}</span>
              <span className="text-white/20">·</span>
              <span>Android 6.0+</span>
              <span className="text-white/20">·</span>
              <span>~25 MB</span>
            </div>

            <p className="mt-1 max-w-md text-center text-xs leading-5 text-white/40">
              Sau khi tải, mở file APK → Android sẽ hỏi cho phép cài từ nguồn
              không xác định → vào <strong className="text-white/70">Cài đặt → Bảo mật</strong> → bật
              cho Chrome/Files → quay lại bấm Cài đặt.
            </p>
          </motion.div>

          {/* ── Features grid ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-16"
          >
            <h2
              className="mb-6 text-center text-[22px] font-bold leading-tight sm:text-[26px]"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              Vì sao nên dùng app?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<FaBan className="h-4 w-4" />}
                title="Không quảng cáo"
                description="Không banner, không pop-up, không video quảng cáo chen ngang. Bấm là xem."
              />
              <Feature
                icon={<FaGift className="h-4 w-4" />}
                title="Miễn phí hoàn toàn"
                description="Không tài khoản, không gói cước, không giới hạn lượt xem."
              />
              <Feature
                icon={<FaBolt className="h-4 w-4" />}
                title="Player gốc, mượt hơn web"
                description="Phát HLS bằng trình phát hệ điều hành: tua nhanh, toàn màn hình, Picture-in-Picture."
              />
              <Feature
                icon={<FaBookmark className="h-4 w-4" />}
                title="Nhớ chỗ bạn đang xem"
                description="Tự lưu tiến độ từng tập và danh sách yêu thích ngay trên máy."
              />
              <Feature
                icon={<FaLock className="h-4 w-4" />}
                title="Không thu thập dữ liệu"
                description="Không đăng nhập, không theo dõi. Lịch sử xem nằm trong máy bạn."
              />
              <Feature
                icon={<FaMobileAlt className="h-4 w-4" />}
                title="Giao diện cho điện thoại"
                description="Thanh điều hướng dễ bấm, bộ lọc thông minh, intro động như Netflix."
              />
            </div>
          </motion.div>

          {/* ── iOS note ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-12 flex max-w-2xl items-start gap-4 rounded-2xl border border-white/10 bg-[#18181b] p-5"
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD166]/10 text-[#FFD166]">
              <FaLaptop className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">Vì sao chưa có trên iOS?</strong>{' '}
              Apple bắt buộc trả một khoảng chi phí lớn chỉ để được ký và cài
              app lên iPhone — khác với Android cho phép tải file APK và cài
              thẳng, miễn phí, không cần xin phép ai. Dự án làm phi lợi nhuận
              nên hiện chưa đủ kinh phí để duy trì khoản đó. Người dùng iPhone
              tạm dùng{' '}
              <a
                href="/"
                className="font-semibold text-[#FFD166] underline-offset-2 transition-colors hover:text-white"
              >
                bản web
              </a>{' '}
              nhé — vẫn đầy đủ tính năng, chỉ khác là mở qua Safari/Chrome thôi.
            </p>
          </motion.div>

          {/* ── Install steps ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-8"
          >
            <h2
              className="mb-6 text-center text-[22px] font-bold leading-tight sm:text-[26px]"
              style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}
            >
              Cách cài đặt
            </h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { title: 'Tải file APK', desc: 'Bấm nút vàng Tải APK phía trên' },
                { title: 'Cho phép cài đặt', desc: 'Bật "Cài từ nguồn không xác định"' },
                { title: 'Mở file vừa tải', desc: 'Trong mục Tải xuống của trình duyệt' },
                { title: 'Bấm Cài đặt', desc: 'Đợi vài giây là xong' },
              ].map((step, i) => (
                <div
                  key={step.title}
                  className="relative rounded-xl border border-white/5 bg-[#18181b] p-4 text-center"
                >
                  <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD166] text-[13px] font-bold text-[#171717]">
                    {i + 1}
                  </span>
                  <p className="text-[13px] font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/50">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Footer note ── */}
          <p className="mt-12 text-center text-xs text-white/30">
            Ứng dụng không lưu trữ nội dung phim. Toàn bộ dữ liệu và luồng phát
            đến từ các API công khai của bên thứ ba.
          </p>
        </div>
      </div>
    </>
  );
}
