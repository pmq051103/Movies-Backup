import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTools, FaHome } from "react-icons/fa";
import Logo from "@/components/common/Logo";
import { useMaintenance } from "@/hooks/useMaintenance";

/* ------------------------------------------------------------------ */
/* MaintenancePage — public page shown to all visitors whenever the    */
/* admin has enabled maintenance mode. Renders the rich-text content   */
/* the admin authored in the /admin dashboard (ReactQuill output).     */
/* ------------------------------------------------------------------ */

export default function MaintenancePage() {
  const { loading, title, contentHtml } = useMaintenance();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-16 text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-sm md:p-12"
      >
        <div className="mb-6 flex justify-center">
          <Logo size="md" withLink={false} animated={false} />
        </div>

        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-600/30">
          <FaTools className="h-7 w-7 text-white" />
        </span>

        <h1 className="mb-3 text-2xl font-bold md:text-3xl">
          {title || 'Hệ thống đang bảo trì'}
        </h1>

        {loading ? (
          <div className="mx-auto my-6 h-1 w-24 animate-pulse rounded-full bg-gray-800" />
        ) : contentHtml ? (
          <div
            className="maintenance-content prose prose-invert prose-red mx-auto max-w-none text-gray-300 [&_a]:text-red-400 [&_a]:underline [&_img]:mx-auto [&_img]:rounded-xl [&_h2]:text-white [&_h3]:text-white [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p className="text-gray-400">
            Chúng tôi đang nâng cấp và bảo trì hệ thống. Vui lòng quay lại sau ít phút.
          </p>
        )}

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-red-500 hover:to-red-400"
        >
          <FaHome className="h-3.5 w-3.5" />
          Về trang chủ
        </Link>
      </motion.div>
    </div>
  );
}
