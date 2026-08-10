import { useState, useCallback, useRef, useMemo } from "react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaHeart,
  FaDownload,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { useScrollPosition } from "@/hooks";
import { useGenres, useCountries } from "@/hooks";
import { ROUTES } from "@/constants";
import Logo from "@/components/common/Logo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import SearchModal from "@/components/search/SearchModal";
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
    .replace(/[̀-ͯ]/g, "")
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
  const scrollY = useScrollPosition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] =
    useState<null | "genres" | "countries">(null);
  const [genreQuery, setGenreQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [mobileSection, setMobileSection] =
    useState<null | "genres" | "countries">(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isScrolled = scrollY > 50;

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

  const navItems: NavItem[] = [
    { label: t("nav.home"), path: ROUTES.HOME },
    { label: t("nav.movies"), path: ROUTES.MOVIES },
    { label: t("nav.tvShows"), path: ROUTES.TV_SHOWS },
    { label: t("nav.nowPlaying"), path: ROUTES.NOW_PLAYING },
    { label: t("nav.topRated"), path: ROUTES.TOP_RATED },
    { label: t("nav.favorites"), path: ROUTES.FAVORITES },
  ];

  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  const openMenu = useCallback((menu: "genres" | "countries") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(menu);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpenDropdown(null);
      setGenreQuery("");
      setCountryQuery("");
    }, 180);
  }, []);

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `text-sm font-medium transition-colors duration-200 hover:text-red-500 ${
      isActive ? "text-red-500" : "text-gray-300"
    }`;

  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `block px-4 py-3 text-lg font-medium transition-colors duration-200 hover:text-red-500 hover:bg-white/5 rounded-lg ${
      isActive ? "text-red-500" : "text-gray-300"
    }`;

  const dropdownData = {
    genres: {
      base: ROUTES.GENRES,
      label: t("nav.genres"),
      items: filteredGenres,
      query: genreQuery,
      setQuery: setGenreQuery,
      placeholder: t("search.searchGenre"),
    },
    countries: {
      base: ROUTES.COUNTRIES,
      label: t("nav.countries"),
      items: filteredCountries,
      query: countryQuery,
      setQuery: setCountryQuery,
      placeholder: t("search.searchCountry"),
    },
  };

  return (
    <>
      <header
        className={`site-header fixed top-0 left-0 right-0 z-50 ${
          isScrolled ? "is-scrolled" : ""
        }`}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="-ml-6 lg:ml-0">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ROUTES.HOME}
                  className={navLinkClasses}
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Genres & Countries — hover-only dropdown, NOT clickable */}
              {(["genres", "countries"] as const).map((key) => {
                const { base, label, items, query, setQuery, placeholder } =
                  dropdownData[key];
                const isOpen = openDropdown === key;
                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => openMenu(key)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown((prev) => (prev === key ? null : key))
                      }
                      className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:text-red-500 ${
                        isOpen ? "text-red-500" : "text-gray-300"
                      }`}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                    >
                      {label}
                      <FaChevronDown
                        className={`h-2.5 w-2.5 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full z-50 pt-2"
                          onMouseEnter={() => openMenu(key)}
                          onMouseLeave={scheduleClose}
                        >
                          <div className="w-[36rem] max-w-[90vw] rounded-md border border-gray-800 bg-gray-900 shadow-2xl">
                            {/* Search filter inside dropdown */}
                            <div className="border-b border-gray-800 p-3">
                              <div className="relative">
                                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                                <input
                                  type="text"
                                  value={query}
                                  onChange={(e) => setQuery(e.target.value)}
                                  placeholder={placeholder}
                                  className="w-full rounded-md border border-gray-700 bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto p-3">
                              {items.length === 0 ? (
                                <p className="py-6 text-center text-sm text-gray-500">
                                  {t("common.noData")}
                                </p>
                              ) : (
                                <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                                  {items.map((item) => (
                                    <RouterLink
                                      key={item._id}
                                      to={`${base}/${item.slug}`}
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        setQuery("");
                                      }}
                                      className="truncate rounded px-2 py-1.5 text-[0.9rem] font-medium text-gray-200 transition-colors hover:text-red-500"
                                    >
                                      {item.name}
                                    </RouterLink>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search button + dropdown wrapper */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleSearchOpen}
                  className="rounded-full p-2 text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-red-500"
                  aria-label={t("search.open")}
                >
                  <FaSearch className="h-4 w-4" />
                </button>

                <SearchModal isOpen={isSearchOpen} onClose={handleSearchClose} />
              </div>

              {/* Favorites link — desktop only; on mobile it's already in the hamburger menu list */}
              <RouterLink
                to={ROUTES.FAVORITES}
                className="hidden rounded-full p-2 text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-red-500 lg:block"
                aria-label={t("nav.favorites")}
                title={t("nav.favorites")}
              >
                <FaHeart className="h-4 w-4" />
              </RouterLink>

              {/* Download app link */}
              <RouterLink
                to="/tai-app"
                className="hidden items-center gap-1.5 rounded-full bg-red-600/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors duration-200 hover:bg-red-600/25 hover:text-red-300 lg:inline-flex"
                title="Tải App"
              >
                <FaDownload className="h-3 w-3" />
                Tải App
              </RouterLink>

              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              <div className="hidden lg:block">
                <ThemeSwitcher />
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-full p-2 text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-red-500 lg:hidden"
                aria-label={t("nav.menu")}
              >
                <FaBars className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />

            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-gray-900 shadow-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-red-500"
                  aria-label={t("nav.close")}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === ROUTES.HOME}
                        className={mobileNavLinkClasses}
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}

                  {(["genres", "countries"] as const).map((key) => {
                    const { base, label, items, query, setQuery, placeholder } =
                      dropdownData[key];
                    const isOpen = mobileSection === key;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setMobileSection(isOpen ? null : key)}
                          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-lg font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-red-500"
                        >
                          {label}
                          <FaChevronDown
                            className={`h-3 w-3 transition-transform ${
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
                              <div className="px-3 py-2 space-y-2">
                                <div className="relative">
                                  <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
                                  <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full rounded-md border border-gray-700 bg-gray-800 py-1.5 pl-8 pr-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-red-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  {items.map((item) => (
                                    <RouterLink
                                      key={item._id}
                                      to={`${base}/${item.slug}`}
                                      onClick={() => {
                                        closeMobileMenu();
                                        setQuery("");
                                      }}
                                      className="truncate rounded-md px-2 py-1.5 text-sm text-gray-400 transition-colors hover:text-red-500"
                                    >
                                      {item.name}
                                    </RouterLink>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-gray-800 px-4 py-4">
                <RouterLink
                  to="/tai-app"
                  onClick={closeMobileMenu}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500"
                >
                  <FaDownload className="h-3.5 w-3.5" />
                  Tải App Android
                </RouterLink>
                <div className="flex items-center justify-center gap-4">
                  <LanguageSwitcher dropUp />
                  <ThemeSwitcher />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
};

export default Header;