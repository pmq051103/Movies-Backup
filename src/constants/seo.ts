// ==========================================================================
// Default SEO configuration used as a fallback for pages that don't
// provide their own metadata, plus a helper to build page-specific SEO.
// ==========================================================================

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  siteName: string;
  ogImage: string;
  ogType: "website" | "video.movie" | "video.tv_show" | "profile";
  twitterCard: "summary" | "summary_large_image";
  locale: string;
  themeColor: string;
  canonicalBaseUrl: string;
}

export const SITE_NAME = "Không Gian Phim";

export const DEFAULT_SEO: SEOConfig = {
  title: "Không Gian Phim - Xem phim online chất lượng cao, miễn phí",
  description:
    "Xem phim online miễn phí chất lượng cao, cập nhật phim mới nhanh nhất: phim lẻ, phim bộ, hoạt hình, TV Shows với phụ đề Vietsub, thuyết minh và lồng tiếng.",
  keywords:
    "xem phim online, phim mới, phim lẻ, phim bộ, hoạt hình, tv shows, phim vietsub, phim thuyết minh, phim hd",
  siteName: SITE_NAME,
  ogImage: "/og-image.jpg",
  ogType: "website",
  twitterCard: "summary_large_image",
  locale: "vi_VN",
  themeColor: "#0f0f0f",
  canonicalBaseUrl: "https://khonggianphim.online",
};

/** Build a page-specific SEO config, merging with the defaults. */
export function buildSEO(overrides: Partial<SEOConfig>): SEOConfig {
  return { ...DEFAULT_SEO, ...overrides };
}

/** Build SEO metadata for a movie detail page. */
export function buildMovieSEO(params: {
  name: string;
  originName?: string;
  description?: string;
  posterUrl?: string;
  year?: number;
  type?: "single" | "series" | "hoathinh" | "tvshows";
}): SEOConfig {
  const { name, originName, description, posterUrl, year, type } = params;
  const title = `${name}${originName ? ` (${originName})` : ""}${
    year ? ` (${year})` : ""
  } - ${SITE_NAME}`;

  return buildSEO({
    title,
    description:
      description ??
      `Xem phim ${name} full HD Vietsub, thuyết minh, lồng tiếng miễn phí tại ${SITE_NAME}.`,
    ogImage: posterUrl ?? DEFAULT_SEO.ogImage,
    ogType: type === "series" || type === "tvshows" ? "video.tv_show" : "video.movie",
  });
}
