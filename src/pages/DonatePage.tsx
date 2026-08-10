import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FaHeart,
  FaCopy,
  FaCheck,
  FaMobileAlt,
  FaUser,
  FaQrcode,
} from "react-icons/fa";

/**
 * Donate page — supports the project by sending money via MoMo. Shows a
 * QR code + copyable phone number + account holder name. Fully bilingual
 * via i18n keys under `donate.*`.
 */
export default function DonatePage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"phone" | "name" | null>(null);

  const phone = "0346991600";
  const holder = "PHẠM MINH QUANG";

  const copyToClipboard = useCallback(
    async (text: string, key: "phone" | "name") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        /* no-op */
      }
    },
    [],
  );

  return (
    <>
      <Helmet>
        <title>{t("donate.title", "Ủng hộ Không Gian Phim")} - Không Gian Phim</title>
        <meta
          name="description"
          content={t(
            "donate.description",
            "Ủng hộ Không Gian Phim để chúng tôi tiếp tục duy trì và phát triển dịch vụ xem phim online miễn phí chất lượng cao.",
          )}
        />
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-900/40">
              <FaHeart className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
              {t("donate.title", "Ủng hộ Không Gian Phim")}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-400 sm:text-lg">
              {t(
                "donate.subtitle",
                "Cảm ơn bạn đã ghé thăm! Nếu bạn thấy Không Gian Phim hữu ích, hãy cân nhắc ủng hộ để chúng tôi có thêm động lực duy trì và phát triển.",
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]"
          >
            {/* MoMo QR card */}
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#a50064] to-[#7a0049] p-6 text-center shadow-2xl">
              <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <FaQrcode /> MoMo
              </div>
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl bg-white p-3">
                <img
                  src="/momo-qr.png"
                  alt="MoMo QR Không Gian Phim"
                  className="h-full w-full"
                />
              </div>
              <p className="mt-4 text-xs text-white/80">
                {t("donate.scanQr", "Quét mã trong ứng dụng MoMo")}
              </p>
            </div>

            {/* Info card */}
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">
                {t("donate.accountInfo", "Thông tin tài khoản")}
              </h2>

              {/* Phone */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FaMobileAlt className="h-4 w-4 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      {t("donate.phone", "Số điện thoại / MoMo")}
                    </p>
                    <p className="truncate text-base font-semibold text-white">
                      {phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(phone, "phone")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {copied === "phone" ? (
                    <>
                      <FaCheck className="h-3 w-3" /> {t("donate.copied", "Đã sao chép")}
                    </>
                  ) : (
                    <>
                      <FaCopy className="h-3 w-3" /> {t("donate.copy", "Sao chép")}
                    </>
                  )}
                </button>
              </div>

              {/* Account holder */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FaUser className="h-4 w-4 shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      {t("donate.holder", "Chủ tài khoản")}
                    </p>
                    <p className="truncate text-base font-semibold text-white">
                      {holder}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(holder, "name")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {copied === "name" ? (
                    <>
                      <FaCheck className="h-3 w-3" /> {t("donate.copied")}
                    </>
                  ) : (
                    <>
                      <FaCopy className="h-3 w-3" /> {t("donate.copy")}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                {t(
                  "donate.note",
                  "Vui lòng ghi nội dung chuyển khoản là 'PMQ ủng hộ' để chúng tôi dễ dàng ghi nhận. Xin cảm ơn!",
                )}
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center text-sm text-gray-500"
          >
            {t(
              "donate.thanks",
              "❤ Cảm ơn bạn — Every donation keeps the servers running.",
            )}
          </motion.p>
        </div>
      </div>
    </>
  );
}
