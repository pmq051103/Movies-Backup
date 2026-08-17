import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import { ROUTES } from "@/constants";

interface NavEntry {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const items: NavEntry[] = [
  {
    label: "Trang chủ",
    path: ROUTES.HOME,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 relative z-10">
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    label: "Khám Phá",
    path: ROUTES.MOVIES,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 relative z-10">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: "Thư viện",
    path: ROUTES.FAVORITES,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 relative z-10">
        <path d="m16 6 4 14" />
        <path d="M12 6v14" />
        <path d="M8 8v12" />
        <path d="M4 4v16" />
      </svg>
    ),
  },
  {
    label: "Tài Khoản",
    path: ROUTES.FAVORITES,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 relative z-10">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

/**
 * Fixed bottom pill navigation bar — mirrors tophim.top's mobile nav.
 * Active item gets a green (#00ac47) rounded pill behind it with an
 * elastic pop animation. Only visible on < lg screens.
 */
const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
      <div className="flex items-center gap-1.5 p-1 bg-neutral-950/70 backdrop-blur-md border border-white/10 rounded-[32px] shadow-2xl shadow-black/80">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className="relative flex flex-col items-center justify-center gap-0 px-4 py-2 rounded-2xl transition-colors z-10 min-w-[64px] text-white/85 hover:text-white"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-[#00ac47]/80 backdrop-blur-sm -z-10 rounded-[32px]"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                    }}
                  />
                )}
                <span className={isActive ? "text-white" : ""}>{item.icon}</span>
                <span
                  className={`text-[9px] whitespace-nowrap relative z-10 mt-0.5 ${
                    isActive ? "font-bold text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
