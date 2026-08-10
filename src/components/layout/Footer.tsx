import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTiktok,
  FaEnvelope,
  // FaPhone,
  // FaHeart,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Logo from "@/components/common/Logo";
import ZaloIcon from "@/components/common/icons/ZaloIcon";
// import { ROUTES } from "@/constants";

interface FooterLink {
  labelKey: string;
  path: string;
}

/** Quick links — every route we don't own yet points to `#` so the user
 *  never lands on a 404. Real routes point to real pages (donate). */
const quickLinks: FooterLink[] = [
  { labelKey: "footer.about", path: "#" },
  { labelKey: "footer.contact", path: "#" },
  { labelKey: "footer.privacy", path: "#" },
  { labelKey: "footer.terms", path: "#" },
  { labelKey: "footer.donate", path: "/donate" },
];

const socialLinks = [
  {
    icon: FaFacebook,
    href: "https://www.facebook.com/",
    label: "Facebook",
    hoverBg: "hover:bg-[#1877f2]",
  },
  {
    icon: FaTiktok,
    href: "https://www.tiktok.com/",
    label: "TikTok",
    hoverBg: "hover:bg-black",
  },
  {
    icon: ZaloIcon,
    href: "https://zalo.me/",
    label: "Zalo",
    hoverBg: "hover:bg-[#0068ff]",
  },
] as const;

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="always-dark border-t border-gray-800 bg-[#111] text-gray-300">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Logo size="md" />
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              {t("footer.description")}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.labelKey}>
                  {link.path.startsWith("#") ? (
                    <a
                      href={link.path}
                      className="text-sm text-gray-400 transition-colors duration-200 hover:text-red-500"
                    >
                      {t(link.labelKey)}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 transition-colors duration-200 hover:text-red-500"
                    >
                      {t(link.labelKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              {t("footer.followUs")}
            </h3>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label, hoverBg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-all duration-200 ${hoverBg} hover:text-white`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {t("footer.socialTagline")}
            </p>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:pmquang05112003@gmail.com"
                  className="flex items-center gap-2 transition-colors hover:text-red-500"
                >
                  <FaEnvelope className="h-3.5 w-3.5 shrink-0" />
                  pmquang05112003@gmail.com
                </a>
              </li>
              {/* <li>
                <a
                  href="tel:+84346991600"
                  className="flex items-center gap-2 transition-colors hover:text-red-500"
                >
                  <FaPhone className="h-3.5 w-3.5 shrink-0" />
                  0346991600
                </a>
              </li> */}
              {/* <li>
                <Link
                  to={ROUTES.DONATE}
                  className="mt-1 inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <FaHeart className="h-3 w-3" />
                  {t("footer.donateCta", "Ủng hộ Không Gian Phim")}
                </Link>
              </li> */}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Không Gian Phim. {t("footer.rights")}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Website được phát triển bởi{' '}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              Phạm Minh Quang
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
