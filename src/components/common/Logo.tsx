import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
  className?: string;
  animated?: boolean;
}

/**
 * PMQMovies brand mark. Uses the pre-rendered PNG logo asset shipped at
 * /logo.png (transparent background, ~25KB). Adds two subtle animations
 * so the mark feels alive without being distracting:
 *   1. A very slight vertical bob (like a film reel gently turning).
 *   2. An angled "cinematic sheen" that sweeps left-to-right across the
 *      artwork every few seconds — the classic film-reel scroll feel.
 * Both can be turned off via `animated={false}` (e.g. in Loading overlays
 * where too much motion becomes noisy).
 *
 * Brand wordmark ("KHÔNG GIAN PHIM") uses a cinematic serif pairing
 * (Playfair Display + Cormorant Garamond) with a slow-moving gold
 * gradient shimmer and a hairline sprocket-style divider, so the text
 * reads as an engraved marquee rather than plain UI type. Make sure the
 * fonts are loaded once globally, e.g. in index.html:
 *
 *   <link
 *     href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Cormorant+Garamond:wght@500&display=swap"
 *     rel="stylesheet"
 *   />
 */
export default function Logo({
  size = "md",
  withLink = true,
  className = "",
  animated = true,
}: LogoProps) {
  const heights = { sm: 48, md: 68, lg: 96 };
  const h = heights[size];

  // Text scales down on phone-width screens so it doesn't crowd the header,
  // then returns to full size from `lg` up (tablet/desktop).
  const textSizes = {
    sm: "text-xs lg:text-sm",
    md: "text-sm lg:text-lg",
    lg: "text-lg lg:text-2xl",
  };

  const inner = (
    <span
      className={`relative inline-flex items-center gap-0 select-none ${className}`}
      style={{ height: h }}
      aria-label="Không Gian Phim"
    >
      <motion.img
        src="/logo.png"
        alt="Không Gian Phim"
        style={{
          height: h,
          width: "auto",
          filter:
            "drop-shadow(0 0 8px rgba(212,175,55,0.5)) drop-shadow(0 0 20px rgba(212,175,55,0.2))",
        }}
        draggable={false}
        {...(animated
          ? {
              animate: { y: [0, -1.5, 0, 1.5, 0] },
              transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }
          : {})}
      />

      {/* Brand name text — always visible (header + footer), regardless of viewport width */}
      <span className={`flex flex-col justify-center -ml-2 ${textSizes[size]}`}>
        <motion.span
          className="font-bold tracking-[0.08em] text-transparent bg-clip-text
            bg-[linear-gradient(90deg,#8a6212_0%,#a8791a_25%,#caa23e_50%,#a8791a_75%,#8a6212_100%)]
            [text-shadow:0_1px_1px_rgba(255,255,255,0.4)]
            dark:bg-[linear-gradient(90deg,#b8860b_0%,#f5d485_25%,#fff6d9_50%,#f5d485_75%,#b8860b_100%)]
            dark:[text-shadow:0_0_18px_rgba(212,175,55,0.35)]
            bg-[length:200%_100%]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            lineHeight: 1.35,
            paddingTop: "0.15em",
            display: "inline-block",
          }}
          animate={
            animated
              ? { backgroundPositionX: ["0%", "100%", "0%"] }
              : undefined
          }
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          KHÔNG GIAN
        </motion.span>

        {/* Thin gold divider — echoes a film-reel sprocket line */}
        <span
          className="my-[3px] h-[1px] w-full
            bg-[linear-gradient(90deg,transparent,rgba(138,98,18,0.55)_50%,transparent)]
            dark:bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.7)_50%,transparent)]"
        />

        <span
          className="text-[0.55em] font-medium tracking-[0.45em] text-neutral-600 dark:text-gray-400/90"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          PHIM
        </span>
      </span>

      {/* Cinematic sheen — a slim diagonal white gradient that sweeps
          across the logo, imitating light bouncing off metallic film.
          Sits above the img via absolute positioning + mix-blend-overlay
          so it lights the letters without darkening transparent pixels. */}
      {animated && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: 6 }}
        >
          <motion.span
            className="absolute top-0 h-full"
            style={{
              width: "35%",
              background:
                "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
              mixBlendMode: "overlay",
              filter: "blur(2px)",
            }}
            animate={{ left: ["-40%", "120%"] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeInOut",
            }}
          />
        </motion.span>
      )}
    </span>
  );

  if (!withLink) return inner;

  return (
    <Link
      to={ROUTES.HOME}
      className="flex-shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      aria-label="Không Gian Phim — Trang chủ"
    >
      {inner}
    </Link>
  );
}