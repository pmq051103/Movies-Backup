export { default as axiosClient, apiGet, APIError } from './axiosClient';

// Latest movies feed + generic /danh-sach/[slug] listing.
export { getLatestMovies, getMoviesBySlug, getMovieCatalogStats } from './homeService';

// Movie detail + generic movies/tv-shows listing helpers.
export { getMovieDetail, getMovies } from './movieService';

// TV shows / anime / series listing.
export { getTVShows, getAnime, getSeries } from './tvService';

// Search.
export { searchMovies } from './searchService';

// Genres.
export { getAllGenres as getGenres, getMoviesByGenre } from './genreService';

// Countries.
export { getAllCountries as getCountries, getMoviesByCountry } from './countryService';

// Actor detail.
export { getActorInfo } from './actorService';
