import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'pmq-welcome-tip-dismissed';

/**
 * First-visit tip explaining that the search icon in the header pulls
 * from BOTH phimapi and vsmov, so users can find fresh titles that
 * aren't in the primary catalog. Shows once, then remembers the
 * dismissal in localStorage forever.
 */
export default function WelcomeTip() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // small delay so the tip doesn't collide with the initial render
        const timer = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      /* privacy mode / SSR */
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-900/40">
              <FaSearch className="h-5 w-5 text-white" />
            </div>

            <h3 className="mb-2 text-xl font-bold text-white">
              {t('welcome.title', 'Mẹo nhỏ cho bạn')}
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">
              {t(
                'welcome.body',
                'Không Gian Phim gộp phim từ nhiều nguồn — nếu bạn không thấy phim mình cần trong danh mục, hãy dùng',
              )}{' '}
              <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                <FaSearch className="h-2.5 w-2.5" />
                {t('welcome.searchBtn', 'Tìm kiếm')}
              </span>{' '}
              {t(
                'welcome.bodyTail',
                'ở góc trên phải — chúng tôi sẽ tìm ở cả nhiều kho phim để trả kết quả tốt nhất.',
              )}
            </p>

            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              {t('welcome.gotIt', 'Đã hiểu, cảm ơn!')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
