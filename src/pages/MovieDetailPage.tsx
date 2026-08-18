import { useMemo, useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaHeart,
  FaRegHeart,
  FaEye,
  FaClock,
  FaShareAlt,
  FaUserCircle,
  FaListUl,
  FaClosedCaptioning,
  FaMicrophone,
  FaLanguage,
  FaServer,
  FaStar,
  FaChevronDown,
} from 'react-icons/fa';
import { MovieRow } from '@/components/movie';
import { DetailSkeleton } from '@/components/common';
import { useFavoriteStore, useHistoryStore } from '@/store';
import { useMovieDetail, useMoviesByGenre } from '@/hooks';
import { ROUTES, MOVIE_STATUS } from '@/constants';
import { getImageUrl, getMoviePoster, onImgError } from '@/utils';
import { trackMovieView } from '@/lib/analytics';
import type { MovieListItem } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function MovieDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // When a search/list result carries _source info, the card appends
  // ?src=vsmov or ?src=ophim so the detail page loads the correct movie
  // even when multiple APIs map the same slug to different films.
  const preferSource = searchParams.get('src') as 'phimapi' | 'vsmov' | 'ophim' | null;

  const { data, isLoading, isError, refetch } = useMovieDetail(
    slug,
    preferSource ?? undefined,
  );
  const movie = data?.movie;
  const episodes = data?.episodes ?? [];

  const firstCategorySlug = movie?.category?.[0]?.slug;
  const { data: recommendationsData } = useMoviesByGenre(firstCategorySlug, {
    page: 1,
  });

  // Records a "movie view" (name + genres + countries) once per session
  // for the /thong-ke dashboard's "Xem theo thể loại/quốc gia" panels.
  useEffect(() => {
    if (!movie) return;
    trackMovieView({
      slug: movie.slug,
      name: movie.name,
      categories: movie.category,
      countries: movie.country,
    });
  }, [movie]);

  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const { getHistoryItem } = useHistoryStore();
  const isFav = slug ? isFavorite(slug) : false;

  // Tabs mirror the CôBePhim layout: "Tập phim" / "Gallery" / "Diễn viên".
  // "Đề xuất" is no longer a tab — recommendations now live in their own
  // row at the very bottom of the page. This site has no comment feature,
  // so there's no "Bình luận" tab here either.
  type TabKey = 'episodes' | 'gallery' | 'cast';
  const [activeTab, setActiveTab] = useState<TabKey>('episodes');
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'episodes', label: 'Tập phim' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'cast', label: 'Diễn viên' },
  ];

  // "Rút gọn" / "Mở rộng" — collapsed shows a compact "Tập N" grid;
  // expanded shows landscape thumbnail cards (with cover image + play btn).
  const [episodesCollapsed, setEpisodesCollapsed] = useState(true);
  const [activeEpisodeServer, setActiveEpisodeServer] = useState(0);
  // Long series are paginated in chunks so the grid never gets huge.
  const EPISODES_PER_PAGE = 80;
  const [episodePage, setEpisodePage] = useState(0);
  const currentEpisodeServer = episodes[activeEpisodeServer];

  const episodeServerIcon = (serverName: string) => {
    const n = serverName.toLowerCase();
    if (n.includes('thuyết minh') || n.includes('lồng tiếng')) return FaMicrophone;
    if (n.includes('song ngữ')) return FaLanguage;
    if (n.includes('phụ đề') || n.includes('vietsub')) return FaClosedCaptioning;
    return FaServer;
  };

  const handleEpisodeSelect = useCallback(
    (episodeSlug: string, serverName: string) => {
      if (!slug) return;
      const srcParam = preferSource ? `&src=${preferSource}` : '';
      navigate(
        `${ROUTES.WATCH}/${slug}?tap=${episodeSlug}&sv=${encodeURIComponent(serverName)}${srcParam}`,
      );
    },
    [slug, preferSource, navigate],
  );

  const [copied, setCopied] = useState(false);
  // On mobile the descriptive info block is collapsed behind a "Thông tin
  // phim" toggle so the page stays compact; open by default on desktop.
  const [infoOpen, setInfoOpen] = useState(false);
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const title = movie?.name ?? '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Xem phim ${title}`, url: shareUrl });
        return;
      } catch {
        // User cancelled — fall through to clipboard copy.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing more we can do silently.
    }
  }, [movie?.name]);

  const movieAsListItem = useMemo<MovieListItem | null>(() => {
    if (!movie) return null;
    return {
      _id: movie._id,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      year: movie.year,
      tmdb: movie.tmdb,
      imdb: movie.imdb,
      modified: movie.modified,
      episode_current: movie.episode_current ?? '',
      episode_total: movie.episode_total ?? '',
      quality: movie.quality ?? '',
      lang: movie.lang ?? '',
      type: movie.type ?? '',
      chieurap: movie.chieurap ?? false,
    };
  }, [movie]);

  const handleToggleFavorite = useCallback(() => {
    if (!movieAsListItem || !slug) return;
    if (isFav) {
      removeFavorite(slug);
    } else {
      addFavorite(movieAsListItem);
    }
  }, [isFav, movieAsListItem, slug, addFavorite, removeFavorite]);

  const seoDescription = useMemo(() => {
    if (!movie?.content) return '';
    return stripHtml(movie.content).slice(0, 160);
  }, [movie?.content]);

  const recommendations = useMemo(() => {
    if (!recommendationsData?.items) return [];
    return recommendationsData.items.filter((m) => m.slug !== slug);
  }, [recommendationsData, slug]);

  /* ------------------------------------------------------------------ */
  /* Loading state                                                       */
  /* ------------------------------------------------------------------ */
  if (isLoading) {
    return <DetailSkeleton />;
  }

  /* ------------------------------------------------------------------ */
  /* Error state                                                         */
  /* ------------------------------------------------------------------ */
  if (isError || !movie) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-2xl font-bold text-white">{t('error.title')}</h2>
        <p className="text-gray-400">{t('error.description')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  const backdropUrl = getImageUrl(movie.thumb_url) || getImageUrl(movie.poster_url);
  const posterUrl = getMoviePoster(movie.poster_url, movie.thumb_url);
  const isSeries = movie.type === 'series';
  // Phim mới có trailer (chưa phát hành / chưa có nguồn xem thật) — ẩn nút
  // "Xem Ngay" và phần số tập/danh sách tập, vì lúc này chỉ có trailer để
  // xem chứ chưa có tập phim thật nào.
  const isTrailerOnly = movie.status === MOVIE_STATUS.TRAILER;
  // Vietnamese label for the production status badge.
  const statusLabel =
    movie.status === MOVIE_STATUS.COMPLETED
      ? 'Hoàn thành'
      : movie.status === MOVIE_STATUS.ONGOING
        ? 'Đang chiếu'
        : movie.status === MOVIE_STATUS.TRAILER
          ? 'Sắp chiếu'
          : '';
  // Colored quality chip — 4K/FHD/HD get distinct accent colors.
  const qualityStyle = (() => {
    const q = (movie.quality || '').toUpperCase();
    if (q.includes('4K') || q.includes('2160'))
      return { text: '#ff5c8a', border: '#ff5c8a', bg: 'rgba(255,92,138,0.12)' };
    if (q.includes('FHD') || q.includes('1080'))
      return { text: '#a78bfa', border: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
    if (q.includes('HD') || q.includes('720'))
      return { text: '#34d399', border: '#34d399', bg: 'rgba(52,211,153,0.12)' };
    return { text: '#60a5fa', border: '#60a5fa', bg: 'rgba(96,165,250,0.12)' };
  })();
  // Một phim được coi là "có tập" nếu có dữ liệu episode THỰC SỰ xem được
  // (server_data chứa link_embed hoặc link_m3u8 khác rỗng) — bất kể type
  // là series/hoathinh/tvshows/single, vì hoạt hình và TV shows nhiều tập
  // nhưng type khác 'series' vẫn cần hiện danh sách tập. Dùng cho nút
  // "Xem ngay" — phim lẻ (1 tập) vẫn cần nút này để bấm xem.
  // Chỉ đếm ep.server_data.length > 0 là chưa đủ: phim mới thêm vào catalog
  // (như phim vừa công chiếu rạp, chưa có bản online) đôi khi có sẵn 1 dòng
  // server_data "giữ chỗ" nhưng link_embed/link_m3u8 đều rỗng — nút Xem
  // Ngay khi đó dẫn tới player trống, nên phải kiểm tra link thật có dữ liệu.
  const hasEpisodes =
    !isTrailerOnly &&
    episodes.some((ep) =>
      ep.server_data?.some((sd) => sd.link_embed?.trim() || sd.link_m3u8?.trim()),
    );
  // True when the movie actually has more than 1 REAL episode to pick
  // between (a real series) — same "has a real link" filter as above.
  // Used to decide between showing "12 / 24" vs "1 Tập" in the badge, and
  // between a numbered grid vs a single "Full" entry in the episode list.
  const hasEpisodeList =
    !isTrailerOnly &&
    episodes.some(
      (ep) =>
        (ep.server_data?.filter((sd) => sd.link_embed?.trim() || sd.link_m3u8?.trim())
          .length ?? 0) > 1,
    );

  return (
    <>
      <Helmet>
        <title>{`${movie.name}${movie.origin_name && movie.origin_name !== movie.name ? ` (${movie.origin_name})` : ''} - Không Gian Phim`}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={movie.name} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={posterUrl} />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={`https://khonggianphim.online/phim/${movie.slug}`} />
        <link rel="canonical" href={`https://khonggianphim.online/phim/${movie.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": movie.name,
            "alternateName": movie.origin_name || undefined,
            "description": seoDescription,
            "thumbnailUrl": posterUrl,
            "uploadDate": (movie as any).modified?.time || new Date().toISOString(),
            "duration": movie.time ? `PT${parseInt(movie.time) || 0}M` : undefined,
            "aggregateRating": (movie as any).tmdb?.vote_average > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": (movie as any).tmdb.vote_average,
              "bestRating": 10,
              "ratingCount": (movie as any).tmdb.vote_count || 1
            } : undefined,
            "genre": (movie as any).category?.map((c: any) => c.name) || [],
            "countryOfOrigin": (movie as any).country?.map((c: any) => c.name) || [],
            "datePublished": movie.year > 0 ? String(movie.year) : undefined,
            "url": `https://khonggianphim.online/phim/${movie.slug}`,
            "potentialAction": {
              "@type": "WatchAction",
              "target": `https://khonggianphim.online/xem/${movie.slug}`
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* ---- Backdrop banner — same tall aspect ratio, dot-grid and
             gradient treatment as the homepage HeroBanner, so the detail
             page reads as one continuous visual language with the home
             page instead of a plain "movie poster header". ---- */}
        <div className="always-dark relative w-full aspect-[390/240] sm:aspect-video lg:aspect-[21/9] overflow-hidden rounded-b-[28px] bg-[#0f1115] lg:-mt-16 lg:rounded-b-[36px]">
          <img
            src={backdropUrl}
            alt={movie.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={onImgError}
          />

          {/* Dot grid overlay (desktop) — matches HeroBanner texture */}
          <div
            className="absolute inset-0 hidden pointer-events-none opacity-30 md:block"
            style={{
              backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.4) 0.4px, transparent 1px)',
              backgroundSize: '3px 3px',
            }}
          />

          {/* Mobile gradient */}
          <div
            className="absolute inset-0 pointer-events-none md:hidden"
            style={{
              background:
                'linear-gradient(to top, rgb(15, 17, 26) 8%, rgba(15, 17, 21, 0.7) 35%, transparent 65%), radial-gradient(transparent 60%, rgba(15, 17, 26, 0.7) 100%)',
            }}
          />

          {/* Desktop gradient */}
          <div
            className="absolute inset-0 pointer-events-none hidden md:block"
            style={{
              background:
                'linear-gradient(to right, rgba(15, 17, 26, 0.75) 0%, rgba(15, 17, 26, 0.25) 40%, transparent 65%), linear-gradient(to top, rgb(15, 17, 26) 0%, transparent 45%), radial-gradient(transparent 65%, rgba(15, 17, 26, 0.8) 100%)',
            }}
          />
        </div>

        {/* ---- Main content ---- */}
        <div className="relative z-10 mx-auto -mt-28 w-full max-w-[1400px] px-4 pb-12 sm:-mt-36 sm:px-6 lg:-mt-48 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* ================================================================
                LEFT SIDEBAR — poster + all metadata (badges, genres, status,
                overview, meta list). Mirrors CôBePhim's detail page, where
                every descriptive parameter about the movie lives in the
                left column, and the right column is reserved for actions
                + tabs (episodes / gallery / cast / recommendations).
               ================================================================ */}
            <motion.aside
              className="w-full shrink-0 space-y-5 text-left lg:w-80"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              {/* Poster */}
              <div className="relative w-40 sm:w-56 lg:w-full">
                <img
                  src={posterUrl}
                  alt={movie.name}
                  className="w-full rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10"
                  onError={onImgError}
                />
                {movie.lang && (
                  <span className="absolute left-2 top-2 rounded bg-[#01B4E4] px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
                    {movie.lang}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h1
                  className="text-2xl leading-[1.05] drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] sm:text-3xl"
                  style={{
                    fontFamily: "var(--font-display), 'Be Vietnam Pro', 'Inter', sans-serif",
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #fff 55%, #fecf59 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {movie.name}
                </h1>
                {movie.origin_name && movie.origin_name !== movie.name && (
                  <p className="mt-1.5 text-sm font-medium text-[#FECF59]/90 italic">
                    {movie.origin_name}
                  </p>
                )}
              </div>

              {/* Info toggle (mobile) — "Thông tin phim" collapses all the
                  descriptive metadata (badges, genres, status, overview,
                  meta list) behind a chevron so the page stays compact. On
                  desktop (lg+) everything is always shown. No frame — plain
                  text + chevron. */}
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                className="flex w-full items-center justify-between py-2 text-sm font-semibold text-white lg:hidden"
              >
                Thông tin phim
                <FaChevronDown
                  className={`h-3 w-3 transition-transform ${infoOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div className={`${infoOpen ? 'block' : 'hidden'} space-y-5 lg:block`}>
                {/* Badges — IMDb outline (gold border, transparent bg) + white
                    meta chips (year / quality / status / episodes). */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {(movie.tmdb?.vote_average || movie.imdb?.id) &&
                    (movie.imdb?.id ? (
                      <a
                        href={`https://www.imdb.com/title/${movie.imdb.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md border border-[#FECF59] bg-transparent px-2.5 py-1 transition hover:bg-[#FECF59]/10"
                      >
                        <span className="font-extrabold text-[#FECF59]">IMDb</span>
                        <span className="font-bold text-white">
                          {Number(movie.tmdb?.vote_average ?? 0).toFixed(1)}
                        </span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 rounded-md border border-[#FECF59] bg-transparent px-2.5 py-1">
                        <span className="font-extrabold text-[#FECF59]">IMDb</span>
                        <span className="font-bold text-white">
                          {Number(movie.tmdb?.vote_average ?? 0).toFixed(1)}
                        </span>
                      </span>
                    ))}
                  {movie.quality && (
                    <span
                      className="rounded-md border px-2.5 py-1 font-bold"
                      style={{
                        color: qualityStyle.text,
                        borderColor: qualityStyle.border,
                        backgroundColor: qualityStyle.bg,
                      }}
                    >
                      {movie.quality}
                    </span>
                  )}
                  {movie.year > 0 && (
                    <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-white">
                      {movie.year}
                    </span>
                  )}
                  {statusLabel && (
                    <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-white">
                      {statusLabel}
                    </span>
                  )}
                  {hasEpisodeList || (isSeries && !isTrailerOnly) ? (
                    <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-white">
                      {movie.episode_current}
                      {movie.episode_total ? ` / ${movie.episode_total}` : ''}
                    </span>
                  ) : hasEpisodes ? (
                    <span className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-white">
                      1 {t('movie.episodeUnit', 'Tập')}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5 rounded-md px-1 py-1 text-white/60">
                    <FaEye className="text-xs" />
                    {movie.view?.toLocaleString()}
                  </span>
                </div>

                {/* Genres */}
                {movie.category && movie.category.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {movie.category.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/the-loai/${cat.slug}`}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-300 transition hover:border-[#FECF59]/50 hover:text-[#FECF59]"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Progress / status pill — "Trạng thái: X / Y" */}
                {(hasEpisodeList || (isSeries && !isTrailerOnly)) && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400">
                    <FaClock className="text-[10px]" />
                    {t('movie.status')}: {movie.episode_current}
                    {movie.episode_total ? ` / ${movie.episode_total}` : ''}
                  </div>
                )}

                {/* Overview */}
                {movie.content && (
                  <div className="text-left">
                    <h3 className="mb-1.5 text-sm font-semibold text-white">Giới thiệu:</h3>
                    <div
                      className="prose prose-invert prose-sm max-w-none leading-relaxed text-gray-400"
                      dangerouslySetInnerHTML={{ __html: movie.content }}
                    />
                  </div>
                )}

                {/* Meta list */}
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm">
                  {movie.time && (
                    <>
                      <dt className="text-gray-500">{t('movie.duration')}:</dt>
                      <dd>{movie.time}</dd>
                    </>
                  )}
                  {movie.showtimes && (
                    <>
                      <dt className="text-gray-500">{t('movie.releaseDate')}:</dt>
                      <dd>{movie.showtimes}</dd>
                    </>
                  )}
                  {movie.country && movie.country.length > 0 && (
                    <>
                      <dt className="text-gray-500">{t('movie.country')}:</dt>
                      <dd className="flex flex-wrap gap-1">
                        {movie.country.map((c, i) => (
                          <span key={c.slug}>
                            <Link
                              to={`/quoc-gia/${c.slug}`}
                              className="text-blue-400 transition hover:text-blue-300 hover:underline"
                            >
                              {c.name}
                            </Link>
                            {i < movie.country.length - 1 && ', '}
                          </span>
                        ))}
                      </dd>
                    </>
                  )}
                  {movie.director && movie.director.length > 0 && (
                    <>
                      <dt className="text-gray-500">{t('movie.director')}:</dt>
                      <dd>{movie.director.join(', ')}</dd>
                    </>
                  )}
                </dl>
              </div>
            </motion.aside>

            {/* ================================================================
                RIGHT COLUMN — actions row + tabs (Tập phim / Gallery /
                Diễn viên / Đề xuất). Comments are intentionally not part
                of this site, so there's no "Bình luận" tab or count here.
               ================================================================ */}
            <motion.div
              className="min-w-0 flex-1"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              {/* ================================================================
                  Action buttons + rating badge + tabs + tab panels all sit
                  together on ONE shared panel surface (no border, larger
                  corner radius) — mirrors the CôBePhim layout.
                 ================================================================ */}
              <div className="rounded-[28px] bg-white/[0.035] p-4 backdrop-blur-sm sm:p-6">
                {/* Action buttons + rating badge.
                    Mobile: "Xem Ngay" full-width on its own row, then
                    Yêu thích / Chia sẻ / Đánh giá together on the next row. */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {hasEpisodes && (
                    <button
                      type="button"
                      onClick={() => {
                        const h = getHistoryItem(movie.slug);
                        const parts: string[] = [];
                        if (h?.episode) parts.push(`tap=${h.episode}`);
                        if (h?.server) parts.push(`sv=${encodeURIComponent(h.server)}`);
                        if (preferSource) parts.push(`src=${preferSource}`);
                        const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
                        navigate(`${ROUTES.WATCH}/${movie.slug}${qs}`);
                      }}
                      title={t('movie.watchNow')}
                      className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full px-6 font-bold text-[#0f1115] shadow-[0_0_15px_rgba(254,207,89,0.5)] transition-transform hover:scale-[1.02] sm:h-14 sm:w-auto"
                      style={{
                        background: 'linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))',
                      }}
                    >
                      <FaPlay className="text-sm" />
                      {t('movie.watchNow')}
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-5 sm:justify-end sm:gap-6">
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      title={isFav ? t('movie.removeFavorite') : t('movie.addFavorite')}
                      aria-label={isFav ? t('movie.removeFavorite') : t('movie.addFavorite')}
                      className="group/btn flex flex-col items-center gap-1.5 text-white/80 transition-colors hover:text-white"
                    >
                      {isFav ? (
                        <FaHeart className="h-5 w-5 text-[#FECF59] transition-transform duration-300 group-hover/btn:scale-110" />
                      ) : (
                        <FaRegHeart className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110" />
                      )}
                      <span className="text-xs font-medium">{t('movie.addFavorite')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      title={t('movie.share')}
                      className="group/share flex flex-col items-center gap-1.5 text-white/80 transition-colors hover:text-white"
                    >
                      <FaShareAlt className="h-4 w-4 transition-transform duration-300 group-hover/share:scale-110" />
                      <span className="relative text-xs font-medium">
                        {copied ? t('common.copied') : t('movie.share')}
                      </span>
                    </button>

                    {/* Rating badge — blue bg, star + number only */}
                    <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#01B4E4] px-3.5 text-sm font-bold text-white">
                      <FaStar className="h-3.5 w-3.5" />
                      {Number(movie.tmdb?.vote_average ?? 0).toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 flex gap-6 overflow-x-auto border-b border-white/10 text-sm font-semibold">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`shrink-0 whitespace-nowrap border-b-2 pb-3 pt-1 transition-colors ${
                        activeTab === tab.key
                          ? 'border-[#FECF59] text-[#FECF59]'
                          : 'border-transparent text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div className="mt-6">
                  {/* ---- Tập phim ---- */}
                  {activeTab === 'episodes' &&
                    (!hasEpisodes ? (
                      <p className="py-8 text-center text-sm text-gray-500">
                        {t('movie.singleMovieNote')}
                      </p>
                    ) : hasEpisodeList ? (
                      /* ---- Phim bộ: danh sách tập ---- */
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <FaListUl className="text-[#FECF59]" />
                            Danh sách tập
                          </div>

                          {episodes.length > 1 && (
                            <div className="flex flex-wrap items-center gap-1">
                              {episodes.map((ep, idx) => {
                                const Icon = episodeServerIcon(ep.server_name);
                                const active = idx === activeEpisodeServer;
                                return (
                                  <button
                                    key={ep.server_name}
                                    type="button"
                                    onClick={() => {
                                      setActiveEpisodeServer(idx);
                                      setEpisodePage(0);
                                    }}
                                    title={ep.server_name}
                                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                      active
                                        ? 'border-[#FECF59]/50 bg-[#FECF59]/10 text-[#FECF59]'
                                        : 'border-transparent text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="max-w-[9rem] truncate">{ep.server_name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setEpisodesCollapsed((v) => !v)}
                            className="ml-auto flex shrink-0 items-center gap-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200"
                          >
                            {episodesCollapsed ? 'Mở rộng' : 'Rút gọn'}
                            <span
                              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                episodesCollapsed ? 'bg-white/10' : 'bg-[#FECF59]'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                  episodesCollapsed ? 'translate-x-1' : 'translate-x-[18px]'
                                }`}
                              />
                            </span>
                          </button>
                        </div>

                        {currentEpisodeServer &&
                          (() => {
                            const all = currentEpisodeServer.server_data;
                            const pageCount = Math.ceil(all.length / EPISODES_PER_PAGE);
                            const page = Math.min(episodePage, Math.max(pageCount - 1, 0));
                            const start = page * EPISODES_PER_PAGE;
                            const pageItems = all.slice(start, start + EPISODES_PER_PAGE);

                            return (
                              <>
                                {/* Range selector for long series (1-80, 81-160, …) — fixed width */}
                                {pageCount > 1 && (
                                  <div className="mb-4 flex flex-wrap gap-1.5">
                                    {Array.from({ length: pageCount }).map((_, p) => {
                                      const from = p * EPISODES_PER_PAGE + 1;
                                      const to = Math.min((p + 1) * EPISODES_PER_PAGE, all.length);
                                      const activeRange = p === page;
                                      return (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setEpisodePage(p)}
                                          className={`w-[84px] shrink-0 rounded-md py-1.5 text-center text-xs font-semibold transition-colors ${
                                            activeRange
                                              ? 'bg-[#FECF59] text-[#0f1115]'
                                              : 'bg-[#1f2128] text-gray-300 hover:bg-[#2a2d36] hover:text-white'
                                          }`}
                                        >
                                          {from}-{to}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {episodesCollapsed ? (
                                  /* Rút gọn — lưới nút "Tập N" gọn */
                                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                                    {pageItems.map((sd, idx) => (
                                      <button
                                        key={sd.slug}
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeSelect(
                                            sd.slug,
                                            currentEpisodeServer.server_name,
                                          )
                                        }
                                        title={sd.name}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1f2128] px-2 py-2.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-[#FECF59] hover:text-[#0f1115]"
                                      >
                                        <FaPlay className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                        <span className="truncate">Tập {start + idx + 1}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  /* Mở rộng — thẻ ngang có ảnh bìa + nút play */
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {pageItems.map((sd, idx) => (
                                      <button
                                        key={sd.slug}
                                        type="button"
                                        onClick={() =>
                                          handleEpisodeSelect(
                                            sd.slug,
                                            currentEpisodeServer.server_name,
                                          )
                                        }
                                        title={sd.name}
                                        className="group/ep relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[#1f2128] text-left"
                                      >
                                        <img
                                          src={backdropUrl}
                                          alt={`Tập ${start + idx + 1}`}
                                          loading="lazy"
                                          className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-300 group-hover/ep:scale-105 group-hover/ep:opacity-60"
                                          onError={onImgError}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                        <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover/ep:bg-[#FECF59] group-hover/ep:text-[#0f1115]">
                                          <FaPlay className="h-3 w-3" />
                                        </span>
                                        <span className="absolute bottom-2 left-3 z-10 text-xs font-bold text-white">
                                          Tập {start + idx + 1}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                      </div>
                    ) : (
                      /* ---- Phim lẻ: các bản chiếu dạng thẻ ảnh, không viền ---- */
                      <div>
                        <h3 className="mb-4 text-base font-bold text-white">Các bản chiếu</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {episodes.map((ep) => {
                            const Icon = episodeServerIcon(ep.server_name);
                            const firstEp = ep.server_data.find(
                              (sd) => sd.link_embed?.trim() || sd.link_m3u8?.trim(),
                            );
                            if (!firstEp) return null;
                            return (
                              <button
                                key={ep.server_name}
                                type="button"
                                onClick={() => handleEpisodeSelect(firstEp.slug, ep.server_name)}
                                title={ep.server_name}
                                className="group/ver overflow-hidden rounded-xl bg-[#1f2128] text-left transition-colors hover:bg-[#2a2d36]"
                              >
                                <div className="relative aspect-video w-full overflow-hidden">
                                  <img
                                    src={backdropUrl}
                                    alt={ep.server_name}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition duration-300 group-hover/ver:scale-105"
                                    onError={onImgError}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover/ver:opacity-100">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FECF59] text-[#0f1115]">
                                      <FaPlay className="h-3 w-3" />
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2.5">
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                                    <Icon className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{ep.server_name}</span>
                                  </div>
                                  <p className="mt-1 line-clamp-1 text-xs font-bold text-white">
                                    {movie.name}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* ---- Gallery ---- */}
                  {activeTab === 'gallery' && (
                    <div>
                      <h3 className="mb-3 text-base font-bold text-white">Ảnh</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[backdropUrl, posterUrl]
                          .filter((src, i, arr) => src && arr.indexOf(src) === i)
                          .map((src) => (
                            <img
                              key={src}
                              src={src}
                              alt={movie.name}
                              className="aspect-video w-full rounded-lg object-cover"
                              onError={onImgError}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ---- Diễn viên ---- */}
                  {activeTab === 'cast' && (
                    <div>
                      <h3 className="mb-4 text-base font-bold text-white">Diễn viên</h3>
                      {movie.actor && movie.actor.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6">
                          {movie.actor.map((name) => (
                            <div
                              key={name}
                              className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] p-3 text-center transition-colors hover:bg-white/[0.07]"
                            >
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-lg font-bold text-gray-300 ring-1 ring-white/10 sm:h-20 sm:w-20">
                                <FaUserCircle className="h-full w-full text-gray-600" />
                              </div>
                              <span className="text-xs text-gray-300 sm:text-sm">{name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-gray-500">
                          Chưa có thông tin diễn viên
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ================================================================
              ĐỀ XUẤT — tách riêng thành một hàng full-width nằm dưới cùng
              trang, không còn là tab và không dính dáng tới khối sidebar +
              tabs phía trên.
             ================================================================ */}
          {recommendations.length > 0 && (
            <div className="mt-12 border-t border-white/10 pt-10 sm:mt-16">
              <MovieRow title="Đề xuất" movies={recommendations} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
