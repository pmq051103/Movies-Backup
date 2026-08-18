import { useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaHeart,
  FaStar,
  FaEye,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { MovieRow, EpisodeList } from '@/components/movie';
import { DetailSkeleton } from '@/components/common';
import ShareButtons from '@/components/common/ShareButtons';
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
        {/* ---- Backdrop ---- */}
        <div className="relative h-[50vh] w-full overflow-hidden sm:h-[60vh] lg:h-[70vh] lg:-mt-[84px]">
          <img
            src={backdropUrl}
            alt={movie.name}
            className="h-full w-full object-cover"
            onError={onImgError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 to-transparent" />
        </div>

        {/* ---- Main content ---- */}
        <div className="relative z-10 mx-auto -mt-48 w-full px-4 sm:-mt-64 sm:px-6 lg:-mt-80 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Poster */}
            <motion.div
              className="mx-auto w-56 shrink-0 sm:w-64 lg:mx-0 lg:w-72"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <img
                src={posterUrl}
                alt={movie.name}
                className="w-full rounded-xl shadow-2xl shadow-black/50"
                onError={onImgError}
              />
            </motion.div>

            {/* Info */}
            <motion.div
              className="flex-1 space-y-5"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              {/* Title */}
              <div>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                  {movie.name}
                </h1>
                {movie.origin_name && (
                  <p className="mt-1 text-lg text-gray-400 italic">
                    {movie.origin_name}
                  </p>
                )}
              </div>

              {/* Rating / Views */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {movie.tmdb?.vote_average && (
                  <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 font-semibold text-yellow-400">
                    <FaStar className="text-xs" />
                    {movie.tmdb.vote_average}
                  </span>
                )}
                {movie.imdb?.id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-yellow-600/20 px-3 py-1 font-bold text-yellow-300 transition hover:bg-yellow-600/40"
                  >
                    IMDb
                  </a>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  <FaEye className="text-xs" />
                  {movie.view?.toLocaleString()}
                </span>
              </div>

              {/* Badges — solid colors keep contrast readable in both themes.
                  `text-white` here inverts to dark in light mode via our
                  --color-white override, which is exactly what we want on
                  saturated backgrounds. */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {movie.quality && (
                  <span className="rounded bg-blue-600 px-2.5 py-1 text-white">
                    {movie.quality}
                  </span>
                )}
                {movie.lang && (
                  <span className="rounded bg-emerald-600 px-2.5 py-1 text-white">
                    {movie.lang}
                  </span>
                )}
                {movie.status && (
                  <span className="rounded bg-purple-600 px-2.5 py-1 capitalize text-white">
                    {movie.status}
                  </span>
                )}
                {/* Episode count — real series show "current / total",
                    phim lẻ (single movies) show a flat "1 Tập". Hidden
                    entirely for trailer-only titles (nothing to count yet). */}
                {hasEpisodeList || (isSeries && !isTrailerOnly) ? (
                  <span className="rounded bg-orange-600 px-2.5 py-1 text-white">
                    {movie.episode_current} / {movie.episode_total}
                  </span>
                ) : hasEpisodes ? (
                  <span className="rounded bg-orange-600 px-2.5 py-1 text-white">
                    1 {t('movie.episodeUnit', 'Tập')}
                  </span>
                ) : null}
              </div>

              {/* Meta details */}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {/* Số tập — always shown as its own labeled row so it's
                    unmistakably visible in the info section, separate from
                    the colored badge above and from the "Danh sách tập"
                    section further down the page. Hidden for trailer-only
                    titles since there's no real episode yet. */}
                {hasEpisodeList || (isSeries && !isTrailerOnly) ? (
                  <>
                    <dt className="text-gray-500">{t('movie.episodeCount', 'Số tập')}</dt>
                    <dd>{movie.episode_current} / {movie.episode_total}</dd>
                  </>
                ) : hasEpisodes ? (
                  <>
                    <dt className="text-gray-500">{t('movie.episodeCount', 'Số tập')}</dt>
                    <dd>1 {t('movie.episodeUnit', 'Tập')}</dd>
                  </>
                ) : null}
                {movie.time && (
                  <>
                    <dt className="text-gray-500">{t('movie.duration')}</dt>
                    <dd>{movie.time}</dd>
                  </>
                )}
                {movie.showtimes && (
                  <>
                    <dt className="text-gray-500">{t('movie.releaseDate')}</dt>
                    <dd>{movie.showtimes}</dd>
                  </>
                )}
                {movie.country && movie.country.length > 0 && (
                  <>
                    <dt className="text-gray-500">{t('movie.country')}</dt>
                    <dd className="flex flex-wrap gap-1">
                      {movie.country.map((c) => (
                        <Link
                          key={c.slug}
                          to={`/quoc-gia/${c.slug}`}
                          className="text-blue-400 transition hover:text-blue-300 hover:underline"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </dd>
                  </>
                )}
                {movie.director && movie.director.length > 0 && (
                  <>
                    <dt className="text-gray-500">{t('movie.director')}</dt>
                    <dd>{movie.director.join(', ')}</dd>
                  </>
                )}
              </dl>

              {/* Genres */}
              {movie.category && movie.category.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t('movie.genre')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.category.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/the-loai/${cat.slug}`}
                        className="rounded-full border border-gray-700 px-3 py-1 text-xs font-medium text-gray-300 transition hover:border-red-500 hover:text-red-400"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {movie.actor && movie.actor.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t('movie.cast')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.actor.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <motion.div
                className="flex flex-wrap gap-3 pt-2"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                custom={2}
              >
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
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
                >
                  <FaPlay className="text-sm" />
                  {t('movie.watchNow')}
                </button>
                )}

                {movie.trailer_url && (
                  <a
                    href={movie.trailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 font-semibold text-white transition hover:border-gray-400 hover:bg-gray-800"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                    {t('movie.trailer')}
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 rounded-lg border px-6 py-3 font-semibold transition ${
                    isFav
                      ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'border-gray-600 text-white hover:border-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <FaHeart className={isFav ? 'text-red-500' : ''} />
                  {isFav ? t('movie.removeFavorite') : t('movie.addFavorite')}
                </button>
              </motion.div>

              {/* Share */}
              <div className="pt-1">
                <ShareButtons url={window.location.href} title={movie.name} />
              </div>
            </motion.div>
          </div>

          {/* ---- Overview ---- */}
          {movie.content && (
            <motion.section
              className="mt-12"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <h2 className="mb-4 text-xl font-bold">{t('movie.overview')}</h2>
              <div
                className="prose prose-invert max-w-none leading-relaxed text-gray-300"
                dangerouslySetInnerHTML={{ __html: movie.content }}
              />
            </motion.section>
          )}

          {/* ---- Episodes ---- */}
          {hasEpisodes && (
            <motion.section
              className="mt-12"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <h2 className="mb-4 text-xl font-bold">{t('movie.episodes')}</h2>
              <EpisodeList
                episodes={episodes}
                movieSlug={movie.slug}
                preferSource={preferSource ?? undefined}
              />
            </motion.section>
          )}

          {/* ---- Recommendations ---- */}
          {recommendations.length > 0 && (
            <motion.section
              className="mt-12 pb-12"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <MovieRow
                title={t('movie.recommendations')}
                movies={recommendations}
              />
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}