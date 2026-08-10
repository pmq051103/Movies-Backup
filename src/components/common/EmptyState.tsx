import { type ReactElement } from 'react';
import { FaFilm } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: ReactElement;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl text-gray-500">{icon ?? <FaFilm />}</div>
      <h3 className="mb-2 text-xl font-semibold text-gray-200">{title ?? t('common.noData')}</h3>
      {description && <p className="mb-6 max-w-md text-sm text-gray-400">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
