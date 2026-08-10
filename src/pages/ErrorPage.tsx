import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

export default function ErrorPage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>{t('error.title')}</title>
      </Helmet>

      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            className="mb-6 flex justify-center"
          >
            <FaExclamationTriangle className="text-7xl text-orange-500 md:text-8xl" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 text-3xl font-bold text-white md:text-4xl"
          >
            {t('error.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-base text-zinc-400 md:text-lg"
          >
            {t('error.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30"
            >
              <FaRedo />
              {t('common.retry')}
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-3 text-base font-semibold text-zinc-300 transition-all duration-300 hover:bg-zinc-700 hover:text-white"
            >
              <FaHome />
              {t('common.goHome')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
