import React, { useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

const toastConfig: Record<ToastType, { borderColor: string; icon: React.ReactNode }> = {
  success: {
    borderColor: 'border-l-green-500',
    icon: <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />,
  },
  error: {
    borderColor: 'border-l-red-500',
    icon: <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />,
  },
  info: {
    borderColor: 'border-l-blue-500',
    icon: <FaInfoCircle className="text-blue-500 text-lg flex-shrink-0" />,
  },
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useToastStore();
  const config = toastConfig[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 bg-gray-800 border-l-4 ${config.borderColor} rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-[420px]`}
    >
      {config.icon}
      <p className="text-sm text-gray-200 flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
