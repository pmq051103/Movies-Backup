import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaAndroid,
  FaBan,
  FaBolt,
  FaBookmark,
  FaDownload,
  FaGift,
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
/* Feature card                                                        */
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
    <div className="flex gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-700">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/15 text-red-500">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-400">{description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DownloadAppPage                                                     */
/* ------------------------------------------------------------------ */

export default function DownloadAppPage() {
  const { t: _t } = useTranslation();

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

      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/30">
              <FaMobileAlt className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Tải ứng dụng{' '}
              <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                Không Gian Phim
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
              Xem phim HD miễn phí trên điện thoại — không quảng cáo, không đăng
              nhập, không giới hạn. Trải nghiệm mượt hơn web nhờ player gốc của
              hệ điều hành.
            </p>
          </motion.div>

          {/* Download button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <a
              href={APK_DOWNLOAD_URL}
              download="khonggianphim.apk"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98]"
            >
              <FaAndroid className="h-6 w-6" />
              Tải APK cho Android
              <FaDownload className="h-4 w-4" />
            </a>

            <a
              href={APK_DOWNLOAD_URL}
              download="khonggianphim.apk"
              className="text-xs text-gray-500 underline transition-colors hover:text-gray-300"
            >
              Tải trực tiếp (nếu nút trên không hoạt động)
            </a>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Phiên bản {APP_VERSION}</span>
              <span>·</span>
              <span>Android 6.0+</span>
              <span>·</span>
              <span>~25 MB</span>
            </div>

            <p className="mt-1 max-w-md text-center text-xs leading-5 text-gray-500">
              Sau khi tải, mở file APK → Android sẽ hỏi cho phép cài từ nguồn
              không xác định → vào <strong className="text-gray-400">Cài đặt → Bảo mật</strong> → bật
              cho Chrome/Files → quay lại bấm Cài đặt.
            </p>
          </motion.div>

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-16"
          >
            <h2 className="mb-6 text-center text-xl font-bold">
              Vì sao nên dùng app?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
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
                title="Giao diện thiết kế cho điện thoại"
                description="Thanh điều hướng dễ bấm, bộ lọc thông minh, intro động như Netflix."
              />
            </div>
          </motion.div>

          {/* iOS note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-12 max-w-lg rounded-xl border border-blue-500/30 bg-blue-950/70 p-4 text-center"
          >
            <p className="text-sm text-blue-50">
              <strong className="text-blue-300">Vì sao chưa có trên iOS?</strong>{' '}
              Apple bắt buộc trả một khoảng chi phí lớn chỉ để được ký và cài
              app lên iPhone — dù cài trực tiếp hay không, khác với Android cho
              phép tải file APK và cài thẳng, miễn phí, không cần xin phép ai.
              Dự án làm phi lợi nhuận nên hiện chưa đủ kinh phí để duy trì
              khoản đó. Người dùng iPhone tạm dùng{' '}
              <a
                href="/"
                className="underline transition-colors hover:text-white"
              >
                bản web
              </a>{' '}
              nhé — vẫn đầy đủ tính năng, chỉ khác là mở qua Safari/Chrome thôi.
            </p>
          </motion.div>

          {/* Footer note */}
          <p className="mt-12 text-center text-xs text-gray-600">
            Ứng dụng không lưu trữ nội dung phim. Toàn bộ dữ liệu và luồng phát
            đến từ các API công khai của bên thứ ba.
          </p>
        </div>
      </div>
    </>
  );
}