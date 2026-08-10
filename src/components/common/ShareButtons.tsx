import { useState, useCallback } from 'react';
import { FaFacebook, FaTwitter, FaLink, FaShareAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Use the deployed URL — on localhost, build a production-like URL
  // so share previews work correctly when the site is deployed.
  const shareUrl = url.includes('localhost')
    ? url.replace(/https?:\/\/localhost:\d+/, window.location.origin)
    : url;

  // Native Web Share API — works on mobile (WhatsApp, Zalo, Telegram, etc.)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title,
        text: `Xem phim ${title}`,
        url: shareUrl,
      });
    } catch {
      // User cancelled or API not available — silently ignore
    }
  }, [shareUrl, title]);

  const shareToFacebook = useCallback(() => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [shareUrl]);

  const shareToTwitter = useCallback(() => {
    const twUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [shareUrl, title]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <div className="flex items-center gap-2">
      {/* Native share — mobile (WhatsApp, Zalo, Telegram...) */}
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="Share"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
        >
          <FaShareAlt className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={shareToFacebook}
        aria-label={t('common.shareToFacebook')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-blue-600 hover:text-white"
      >
        <FaFacebook className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={shareToTwitter}
        aria-label={t('common.shareToTwitter')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-sky-500 hover:text-white"
      >
        <FaTwitter className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={copyLink}
        aria-label={t('common.copyLink')}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
      >
        <FaLink className="h-4 w-4" />
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
            {t('common.copied')}
          </span>
        )}
      </button>
    </div>
  );
}
