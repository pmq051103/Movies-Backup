import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaPlay, FaTrash, FaTimes } from 'react-icons/fa';
import { useHistoryStore } from '@/store';
import { EmptyState } from '@/components/common';
import { getMoviePoster, onImgError } from '@/utils';

export default function HistoryPage() {
  const { t } = useTranslation();
  const { history, removeFromHistory, clearHistory } = useHistoryStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearAll = () => {
    clearHistory();
    setShowConfirm(false);
  };

  const getProgressPercent = (progress: number, duration: number) => {
    if (!duration || duration === 0) return 0;
    return Math.min((progress / duration) * 100, 100);
  };

  return (
    <>
      <Helmet>
        <title>{t('seo.historyTitle')}</title>
        <meta name="description" content="Lịch sử xem phim của bạn tại Không Gian Phim." />
        <meta property="og:title" content={t('seo.historyTitle')} />
        <meta property="og:url" content="https://khonggianphim.online/lich-su" />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://khonggianphim.online/lich-su" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen px-4 py-8 md:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {t('history.title')}
            </h1>

            {history.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-red-600/20 hover:text-red-500"
              >
                <FaTrash className="text-xs" />
                {t('common.clearAll')}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/30 p-4"
              >
                <p className="text-sm text-red-300">{t('history.clearAll')}?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg bg-zinc-700 px-4 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600"
                  >
                    <FaTimes />
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {history.length === 0 ? (
            <EmptyState
              icon={<FaHistory className="text-5xl text-zinc-500" />}
              title={t('history.empty')}
              description={t('history.emptyDesc')}
            />
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => {
                const progressPercent = getProgressPercent(item.progress, item.duration);

                return (
                  <motion.div
                    key={item.slug}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group relative flex items-center gap-4 rounded-xl bg-zinc-900/60 p-3 transition-all duration-300 hover:bg-zinc-800/80 md:p-4"
                  >
                    <Link
                      to={`/xem/${item.slug}?tap=${item.episode}${item.server ? `&sv=${encodeURIComponent(item.server)}` : ''}`}
                      className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg md:h-28 md:w-20"
                    >
                      <img
                        src={getMoviePoster(item.poster_url, item.thumb_url)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={onImgError}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <FaPlay className="text-lg text-white" />
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col gap-2">
                      <Link
                        to={`/xem/${item.slug}?tap=${item.episode}${item.server ? `&sv=${encodeURIComponent(item.server)}` : ''}`}
                        className="text-base font-semibold text-white transition-colors hover:text-red-500 md:text-lg"
                      >
                        {item.name}
                      </Link>

                      <p className="text-sm text-zinc-400">
                        {item.episode && `Ep ${item.episode}`}
                        {item.server && ` - ${item.server}`}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-red-600 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>

                      <Link
                        to={`/xem/${item.slug}?tap=${item.episode}${item.server ? `&sv=${encodeURIComponent(item.server)}` : ''}`}
                        className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                      >
                        <FaPlay className="text-[10px]" />
                        {t('history.continueWatching')}
                      </Link>
                    </div>

                    <button
                      onClick={() => removeFromHistory(item.slug)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-zinc-400 opacity-0 transition-all duration-200 hover:bg-red-600 hover:text-white group-hover:opacity-100"
                      aria-label={t('common.remove')}
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
