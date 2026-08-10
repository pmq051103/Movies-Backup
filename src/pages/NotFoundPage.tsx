import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaHome } from 'react-icons/fa';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>404</title>
      </Helmet>

      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.2 }}
            className="mb-4 text-[8rem] font-black leading-none md:text-[12rem]"
            style={{
              background: 'linear-gradient(180deg, #e50914 0%, #b20710 40%, #2d0507 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-lg text-zinc-400 md:text-xl"
          >
            {t('notFound.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30"
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
