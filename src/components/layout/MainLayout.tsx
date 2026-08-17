import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import WelcomeTip from "@/components/common/WelcomeTip";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

/**
 * Root layout — Header + <Outlet /> + Footer.
 * Also resets scroll position on route change so navigating from a long
 * detail page to another page doesn't inherit the previous scroll offset.
 */
const MainLayout: React.FC = () => {
  const { language } = useLanguageStore();
  const { pathname } = useLocation();

  // Records every page view (direct link, search engine, in-site nav —
  // all of it) to Supabase for the /thong-ke dashboard. No-ops if
  // Supabase env vars aren't set.
  useAnalyticsTracking();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <>
      <Helmet>
        <html lang={language} />
      </Helmet>

      <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
        <Header />

        <main className="flex-1 pt-[68px] lg:pt-0">
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* Mobile bottom nav (tophim style) */}
      <BottomNav />

      {/* First-visit tip about dual-source search */}
      <WelcomeTip />

      {/* Floating scroll-to-top button */}
      <ScrollToTopButton />
    </>
  );
};

export default MainLayout;
