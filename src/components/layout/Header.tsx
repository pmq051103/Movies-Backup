import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { NavLink, Link as RouterLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaHeart,
  FaHome,
  FaFilm,
  FaTv,
  FaBroadcastTower,
  FaStar,
  FaChevronRight,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { useScrollPosition } from "@/hooks";
import { useGenres, useCountries } from "@/hooks";
import { useDebounce } from "@/hooks";
import { useSearchMovies } from "@/hooks/useMovies";
import { ROUTES } from "@/constants";
import { getMoviePoster } from "@/utils";
import Logo from "@/components/common/Logo";
import type { Genre, Country } from "@/types";

interface NavItem {
  label: string;
  path: string;
}

/** Normalise Vietnamese text (drop diacritics) for filter matching. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/** Filter a genre/country list against a search query. */
function filterList<T extends Genre | Country>(items: T[], q: string): T[] {
  const needle = normalize(q.trim());
  if (!needle) return items;
  return items.filter(
    (item) =>
      normalize(item.name).includes(needle) ||
      normalize(item.slug).includes(needle),
  );
}

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollY = useScrollPosition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] =
    useState<null | "genres" | "countries" | "more">(null);
  const [genreQuery, setGenreQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchInput = useRef<HTMLInputElement>(null);

  const isScrolled = scrollY > 20;

  const { data: genres = [] } = useGenres();
  const { data: countries = [] } = useCountries();

  const filteredGenres = useMemo(
    () => filterList(genres, genreQuery),
    [genres, genreQuery],
  );
  const filteredCountries = useMemo(
    () => filterList(countries, countryQuery),
    [countries, countryQuery],
  );

  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchData, isLoading: searchLoading } = useSearchMovies({
    keyword: debouncedSearch,
    limit: 6,
  });
  const searchResults = searchData?.items ?? [];
  const showSearchDropdown =
    searchFocused && debouncedSearch.trim().length >= 2;

  // Close the desktop search dropdown on outside click
  useEffect(() => {
    if (!searchFocused) return;
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchFocused]);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInput.current?.focus();
  }, [mobileSearchOpen]);

  // Desktop nav — mirrors tophim.top: Phim Lẻ, Phim Bộ, TV Shows + dropdowns
  const navItems: NavItem[] = [
    { label: "Phim Lẻ", path: ROUTES.MOVIES },
    { label: "Phim Bộ", path: ROUTES.TV_SHOWS },
    { label: "TV Shows", path: ROUTES.TV_SHOW_PROGRAMS },
  ];

  const mobileNavItems: NavItem[] = [
    { label: t("nav.home"), path: ROUTES.HOME },
    { label: "Phim Lẻ", path: ROUTES.MOVIES },
    { label: "Phim Bộ", path: ROUTES.TV_SHOWS },
    { label: "TV Shows", path: ROUTES.TV_SHOW_PROGRAMS },
    { label: "Phim Chiếu Rạp", path: ROUTES.NOW_PLAYING },
    { label: "Phim Đánh Giá Cao", path: ROUTES.TOP_RATED },
    { label: t("nav.favorites"), path: ROUTES.FAVORITES },
  ];

  const mobileNavIcons: Record<string, React.ReactNode> = {
    [ROUTES.HOME]: <FaHome className="h-4 w-4" />,
    [ROUTES.MOVIES]: <FaFilm className="h-4 w-4" />,
    [ROUTES.TV_SHOWS]: <FaTv className="h-4 w-4" />,
    [ROUTES.TV_SHOW_PROGRAMS]: <FaBroadcastTower className="h-4 w-4" />,
    [ROUTES.NOW_PLAYING]: <FaStar className="h-4 w-4" />,
    [ROUTES.TOP_RATED]: <FaStar className="h-4 w-4" />,
    [ROUTES.FAVORITES]: <FaHeart className="h-4 w-4" />,
  };

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }, []);

  const submitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length >= 2) {
        setSearchFocused(false);
        setSearchQuery("");
        setMobileSearchOpen(false);
        navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [navigate],
  );

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `px-2 xl:px-2.5 py-2 text-[13px] transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap ${
      isActive ? "text-white font-semibold" : "text-[#FFFFFF] hover:text-white"
    }`;

  const dropdownBtnClasses = (isOpen: boolean): string =>
    `px-2 xl:px-2.5 py-2 text-[13px] transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap ${
      isOpen ? "text-white" : "text-[#FFFFFF] hover:text-white"
    }`;

  const dropdownData = {
    genres: {
      base: ROUTES.GENRES,
      label: "Thể Loại",
      items: filteredGenres,
      query: genreQuery,
      setQuery: setGenreQuery,
      placeholder: "Tìm thể loại...",
      width: "w-[480px]",
    },
    countries: {
      base: ROUTES.COUNTRIES,
      label: "Quốc Gia",
      items: filteredCountries,
      query: countryQuery,
      setQuery: setCountryQuery,
      placeholder: "Tìm quốc gia...",
      width: "w-[400px]",
    },
  };

  const moreItems: NavItem[] = [
    { label: "Phim Chiếu Rạp", path: ROUTES.NOW_PLAYING },
    { label: "Phim Đánh Giá Cao", path: ROUTES.TOP_RATED },
    { label: t("nav.favorites"), path: ROUTES.FAVORITES },
    { label: "Lịch Chiếu", path: ROUTES.TV_SHOW_PROGRAMS },
  ];

  const goResult = useCallback(
    (movie: { slug: string; _source?: string }) => {
      const url =
        movie._source && movie._source !== "phimapi"
          ? `${ROUTES.MOVIE_DETAIL}/${movie.slug}?src=${movie._source}`
          : `${ROUTES.MOVIE_DETAIL}/${movie.slug}`;
      navigate(url);
      setSearchQuery("");
      setSearchFocused(false);
      window.scrollTo({ top: 0 });
    },
    [navigate],
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || openDropdown || searchFocused || mobileSearchOpen
            ? "bg-[#0a0a0f]/95 backdrop-blur-md border-b border-zinc-900/50 shadow-lg"
            : "bg-[#0a0a0f] border-b border-zinc-900/50 shadow-lg lg:bg-transparent lg:border-transparent lg:backdrop-blur-none lg:shadow-none"
        }`}
      >
        <div className="w-full px-2 lg:px-4 flex flex-col justify-center pt-2 min-h-[68px] lg:min-h-[76px]">
          <div className="w-full flex items-center justify-between h-[68px] lg:h-[76px]">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex items-center justify-center rounded-md h-10 w-10 text-zinc-400 hover:text-green-500"
                aria-label={t("nav.menu")}
              >
                <FaBars className="h-6 w-6" />
              </button>
              <RouterLink to={ROUTES.HOME} className="flex items-center shrink-0">
                <span className="h-10 w-auto block">
                  <Logo size="sm" withLink={false} animated={false} />
                </span>
              </RouterLink>
            </div>

            {/* Mobile: search icon */}
            <div className="flex items-center gap-1 lg:hidden shrink-0">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="p-2 rounded-full transition-colors text-zinc-400 hover:text-white"
                aria-label={t("search.open")}
              >
                <FaSearch className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop row */}
            <div className="hidden lg:flex items-center w-full justify-between h-full">
              <div className="flex items-center h-full flex-1 min-w-0">
                {/* Logo */}
                <RouterLink
                  to={ROUTES.HOME}
                  className="flex items-center shrink-0 pr-1 xl:pr-3"
                >
                  <Logo size="sm" withLink={false} animated={false} />
                </RouterLink>

                {/* Inline search with live dropdown */}
                <div
                  ref={searchBoxRef}
                  className="relative ml-1 xl:ml-2 w-[240px] xl:w-[340px] 2xl:w-[400px] shrink-0"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSearch(searchQuery);
                    }}
                  >
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                      <input
                        type="search"
                        autoComplete="off"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        placeholder={t("search.placeholder")}
                        className="h-[42px] bg-white/10 text-[15px] text-white placeholder:text-white/60 focus:outline-none border transition-all w-full pl-10 pr-4 border-transparent focus:border-white focus:bg-zinc-900 rounded-[8px]"
                      />
                    </div>
                  </form>

                  {/* Search results dropdown */}
                  <AnimatePresence>
                    {showSearchDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-full min-w-[340px] bg-[#12121a] border border-white/10 rounded-xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[9999] max-h-[80vh] overflow-y-auto"
                      >
                        {searchLoading ? (
                          <div className="px-3 py-2 space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="h-14 w-10 rounded bg-white/10" />
                                <div className="flex-1 space-y-1.5">
                                  <div className="h-3 w-3/4 rounded bg-white/10" />
                                  <div className="h-2.5 w-1/3 rounded bg-white/5" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : searchResults.length > 0 ? (
                          <>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 px-3">
                              Phim
                            </p>
                            {searchResults.slice(0, 6).map((movie) => (
                              <button
                                key={movie._id}
                                type="button"
                                onClick={() => goResult(movie as any)}
                                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/5 transition-colors group text-left"
                              >
                                <div className="w-10 h-14 overflow-hidden rounded bg-white/10 shrink-0">
                                  {getMoviePoster(movie.poster_url, movie.thumb_url) && (
                                    <img
                                      src={getMoviePoster(movie.poster_url, movie.thumb_url)}
                                      alt={movie.name}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[14px] font-bold text-white group-hover:text-[#ffd166] truncate">
                                    {movie.name}
                                  </p>
                                  {movie.origin_name && (
                                    <p className="text-[12px] text-white/50 truncate">
                                      {movie.origin_name}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-white/40">
                                    {movie.year > 0 ? movie.year : ""}
                                    {movie.lang ? ` · ${movie.lang}` : ""}
                                  </p>
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => submitSearch(searchQuery)}
                              className="w-full px-3 py-2 mt-1 text-[13px] font-semibold text-[#ffd166] hover:bg-white/5 transition-colors text-left flex items-center gap-2"
                            >
                              <span>Xem tất cả kết quả</span>
                              <FaChevronRight className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <p className="px-4 py-6 text-sm text-white/40 text-center">
                            Không tìm thấy phim nào
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-0.5 xl:gap-1 ml-4 xl:ml-8">
                  <NavLink to={ROUTES.HOME} end className={navLinkClasses}>
                    Trang chủ
                  </NavLink>
                  {navItems.map((item) => (
                    <NavLink key={item.path} to={item.path} className={navLinkClasses}>
                      {item.label}
                    </NavLink>
                  ))}

                  {/* Thể Loại / Quốc Gia / Thêm — hover dropdowns */}
                  {(["genres", "countries"] as const).map((key) => {
                    const { base, label, items, query, setQuery, placeholder, width } =
                      dropdownData[key];
                    const isOpen = openDropdown === key;
                    return (
                      <div
                        key={key}
                        className="relative group"
                        onMouseEnter={() => {
                          if (closeTimer.current) clearTimeout(closeTimer.current);
                          setOpenDropdown(key);
                        }}
                        onMouseLeave={scheduleClose}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown((prev) => (prev === key ? null : key))
                          }
                          className={dropdownBtnClasses(isOpen)}
                        >
                          {label}
                          <span className="ml-1 text-[10px]">▾</span>
                        </button>

                        <div className={`absolute top-full left-0 mt-1 ${width} max-w-[90vw] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-200`}>
                          <div className={`${key === "genres" ? "" : "w-full"} mb-3`}>
                            <div className="relative">
                              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                              <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholder}
                                className="w-full rounded-md border border-zinc-700 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#ffd166] focus:ring-1 focus:ring-[#ffd166]"
                              />
                            </div>
                          </div>
                          <div className="max-h-[55vh] overflow-y-auto">
                            {items.length === 0 ? (
                              <p className="py-6 text-center text-sm text-zinc-500">
                                {t("common.noData")}
                              </p>
                            ) : (
                              <div
                                className={`grid gap-1 ${
                                  key === "genres" ? "grid-cols-3" : "grid-cols-3"
                                }`}
                              >
                                {items.map((item) => (
                                  <RouterLink
                                    key={item._id}
                                    to={`${base}/${item.slug}`}
                                    onClick={() => {
                                      setOpenDropdown(null);
                                      setQuery("");
                                    }}
                                    className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left truncate"
                                  >
                                    {item.name}
                                  </RouterLink>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Thêm dropdown */}
                  <div
                    className="relative group"
                    onMouseEnter={() => {
                      if (closeTimer.current) clearTimeout(closeTimer.current);
                      setOpenDropdown("more");
                    }}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown((prev) => (prev === "more" ? null : "more"))
                      }
                      className={dropdownBtnClasses(openDropdown === "more")}
                    >
                      Thêm
                      <span className="ml-1 text-[10px]">▾</span>
                    </button>
                    <div className="absolute top-full left-0 mt-1 w-[210px] bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-200">
                      <div className="flex flex-col gap-0.5">
                        {moreItems.map((item) => (
                          <RouterLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpenDropdown(null)}
                            className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            {item.label}
                          </RouterLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              {/* Right: favorites + Thành viên */}
              <div className="ml-2 xl:ml-auto flex items-center gap-2 xl:gap-4 shrink-0 relative">
                <RouterLink
                  to={ROUTES.FAVORITES}
                  className="p-2 rounded-full transition-colors text-zinc-400 hover:text-[#ffd166] hidden xl:flex"
                  aria-label={t("nav.favorites")}
                  title={t("nav.favorites")}
                >
                  <FaHeart className="w-5 h-5" />
                </RouterLink>
                <RouterLink
                  to={ROUTES.FAVORITES}
                  className="flex justify-center items-center gap-1.5 h-9 xl:h-10 px-3 xl:px-4 bg-[#F2F4F7] hover:bg-white text-[#1c1c1c] rounded-full font-medium transition-colors text-[13px] xl:text-sm shadow-sm hover:shadow shrink-0"
                >
                  <svg className="w-4 h-4 xl:w-5 xl:h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>Thành viên</span>
                </RouterLink>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full lg:hidden pb-3"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitSearch(searchQuery);
                  }}
                >
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      ref={mobileSearchInput}
                      type="search"
                      autoComplete="off"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("search.placeholder")}
                      className="h-[42px] w-full bg-white/10 text-[16px] text-white placeholder:text-white/60 focus:outline-none border border-white/20 focus:border-[#ffd166] focus:bg-zinc-900 rounded-[8px] pl-10 pr-4"
                    />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Drawer — bottom sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[70] bg-zinc-950 border-t border-zinc-900 rounded-t-3xl p-3 lg:hidden max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Khám Phá</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                  aria-label={t("nav.close")}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <nav className="grid grid-cols-2 gap-2">
                {mobileNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === ROUTES.HOME}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {mobileNavIcons[item.path]}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Genres / Countries accordions */}
              {(["genres", "countries"] as const).map((key) => {
                const { base, label, items, query, setQuery, placeholder } =
                  dropdownData[key];
                const isOpen = openDropdown === key;
                return (
                  <div key={key} className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown((prev) => (prev === key ? null : key))
                      }
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <span className="flex-1 text-left">{label}</span>
                      <FaChevronDown
                        className={`h-3 w-3 shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-1 py-2 space-y-2">
                            <div className="relative">
                              <FaSearch className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
                              <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholder}
                                className="w-full rounded-md border border-zinc-700 bg-white/5 py-2 pl-8 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#ffd166]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {items.map((item) => (
                                <RouterLink
                                  key={item._id}
                                  to={`${base}/${item.slug}`}
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setQuery("");
                                  }}
                                  className="truncate rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:text-[#ffd166]"
                                >
                                  {item.name}
                                </RouterLink>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div className="mt-4 pb-4">
                <RouterLink
                  to={ROUTES.FAVORITES}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd166] px-4 py-3 text-sm font-bold text-[#0f111a] transition-colors hover:bg-[#ffe099]"
                >
                  <FaHeart className="h-3.5 w-3.5" />
                  Yêu Thích Của Tôi
                </RouterLink>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
