import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface LoadingOverlayProps {
  isLoading?: boolean;
}

export default function LoadingOverlay({ isLoading = true }: LoadingOverlayProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            <p className="text-sm text-gray-300">{t('common.loading')}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
