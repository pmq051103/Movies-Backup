import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTiktok,
  FaHeart,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Logo from "@/components/common/Logo";
import ZaloIcon from "@/components/common/icons/ZaloIcon";
import { useCatalogStats } from "@/hooks";
import { ROUTES } from "@/constants";

interface FooterLink {
  label: string;
  path: string;
}

const footerLinks: FooterLink[] = [
  { label: "Hỏi-Đáp", path: "#" },
  { label: "Chính sách bảo mật", path: "#" },
  { label: "Điều khoản sử dụng", path: "#" },
  { label: "Giới thiệu", path: "#" },
  { label: "Liên hệ", path: "#" },
  { label: "Tải App", path: ROUTES.DOWNLOAD_APP },
  { label: "Donate", path: ROUTES.DONATE },
];

const socialLinks = [
  { icon: FaFacebookF, href: "https://www.facebook.com/", label: "Facebook" },
  { icon: FaTiktok, href: "https://www.tiktok.com/@khonggianphim.online", label: "TikTok" },
  { icon: ZaloIcon, href: "https://zalo.me/", label: "Zalo" },
] as const;

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const { data: catalogStats } = useCatalogStats();

  const totalMovies = catalogStats?.totalEstimated ?? 0;
  const totalLabel = totalMovies > 0 ? totalMovies.toLocaleString("vi-VN") : "—";

  return (
    <footer className="always-dark bg-[#0a0a0f] border-t border-white/5 mt-16 pb-12 w-full text-gray-300">
      <div className="max-w-[1400px] mx-auto px-4 pt-10">
        {/* Badges row */}
        <div className="mb-10 flex flex-wrap items-center gap-3 text-left">
          <div className="inline-flex items-center gap-2 bg-[#8c171e] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
            <span className="text-[15px] leading-none">🇻🇳</span>
            <span>Hoàng Sa &amp; Trường Sa là của Việt Nam</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#12121a] border border-white/5 text-white/80 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Tổng số phim:{" "}
              <strong className="text-white font-semibold">{totalLabel}</strong>
            </span>
          </div>
        </div>

        {/* Logo + socials */}
        <div className="flex flex-col md:flex-row md:items-center pt-2 pb-6 gap-8 justify-between">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="inline-block shrink-0 mx-auto md:mx-0">
              <Logo size="md" animated={false} />
            </div>
            <div className="hidden md:block w-px h-10 bg-white/10" />
          </div>

          <div className="flex flex-nowrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 overflow-x-auto overflow-y-hidden w-full md:w-auto pb-2 md:pb-0 shrink-0">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-[#12121a] flex items-center justify-center text-white/80 hover:bg-[#1c1c28] transition-colors"
              >
                <Icon className="h-[18px] w-[18px] opacity-80 hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        {/* Link rows */}
        <div className="flex flex-wrap items-center gap-6 mt-8 mb-6 justify-start">
          {footerLinks.map((link) =>
            link.path.startsWith("#") ? (
              <a
                key={link.label}
                href={link.path}
                className="text-[15px] font-medium text-white/90 hover:text-yellow-400 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.path}
                className="text-[15px] font-medium text-white/90 hover:text-yellow-400 transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Description */}
        <div className="mt-4 max-w-5xl text-left">
          <p className="text-[14px] leading-[1.8] text-white/60 max-w-[85ch]">
            {t("footer.description")}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
          <p className="text-[14px] text-white/80">
            © {currentYear} Không Gian Phim
          </p>
          <p className="text-[14px] text-white/60">
            Tổng số phim:{" "}
            <span className="text-yellow-400 font-semibold">{totalLabel}</span>
            <span className="ml-2">
              <FaHeart className="h-3 w-3 inline text-[#ffd166]" />
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
