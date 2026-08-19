import { useState, useMemo } from 'react';
import {
  FaListUl,
  FaPlay,
  FaClosedCaptioning,
  FaMicrophone,
  FaLanguage,
  FaServer,
} from 'react-icons/fa';
import { onImgError } from '@/utils';
import type { Episode } from '@/types';

function episodeServerIcon(serverName: string) {
  const n = serverName.toLowerCase();
  if (n.includes('thuyết minh') || n.includes('lồng tiếng')) return FaMicrophone;
  if (n.includes('song ngữ')) return FaLanguage;
  if (n.includes('phụ đề') || n.includes('vietsub')) return FaClosedCaptioning;
  return FaServer;
}

const EPISODES_PER_PAGE = 80;

interface EpisodeListPanelProps {
  episodes: Episode[];
  /** Backdrop image shown behind each card in "Mở rộng" (expanded) view. */
  backdropUrl: string;
  onSelect: (episodeSlug: string, serverName: string) => void;
  currentEpisodeSlug?: string;
  currentServerName?: string;
}

/**
 * Exactly the "Danh sách tập" block from MovieDetailPage — icon server
 * tabs (CC / mic / language) next to the title, 80-episode range chunks
 * for long series, and a Rút gọn/Mở rộng toggle switching between a
 * compact "Tập N" grid and a thumbnail-card grid with a play button.
 * Shared so WatchPage renders the identical design instead of drifting
 * from its own, simpler episode list.
 */
const EpisodeListPanel: React.FC<EpisodeListPanelProps> = ({
  episodes,
  backdropUrl,
  onSelect,
  currentEpisodeSlug,
  currentServerName,
}) => {
  const initialServer = useMemo(() => {
    if (!currentServerName) return 0;
    const idx = episodes.findIndex((e) => e.server_name === currentServerName);
    return idx === -1 ? 0 : idx;
  }, [episodes, currentServerName]);

  const [collapsed, setCollapsed] = useState(true);
  const [activeServer, setActiveServer] = useState(initialServer);
  const [page, setPage] = useState(0);

  const currentEpisodeServer = episodes[activeServer];
  if (!currentEpisodeServer) return null;

  const all = currentEpisodeServer.server_data;
  const pageCount = Math.ceil(all.length / EPISODES_PER_PAGE);
  const safePage = Math.min(page, Math.max(pageCount - 1, 0));
  const start = safePage * EPISODES_PER_PAGE;
  const pageItems = all.slice(start, start + EPISODES_PER_PAGE);

  return (
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
              const active = idx === activeServer;
              return (
                <button
                  key={ep.server_name}
                  type="button"
                  onClick={() => {
                    setActiveServer(idx);
                    setPage(0);
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
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto flex shrink-0 items-center gap-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200"
        >
          {collapsed ? 'Mở rộng' : 'Rút gọn'}
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              collapsed ? 'bg-white/10' : 'bg-[#FECF59]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                collapsed ? 'translate-x-1' : 'translate-x-[18px]'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Range selector for long series (1-80, 81-160, …) — fixed width */}
      {pageCount > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {Array.from({ length: pageCount }).map((_, p) => {
            const from = p * EPISODES_PER_PAGE + 1;
            const to = Math.min((p + 1) * EPISODES_PER_PAGE, all.length);
            const activeRange = p === safePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
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

      {collapsed ? (
        /* Rút gọn — lưới nút "Tập N" gọn */
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {pageItems.map((sd, idx) => {
            const isActive =
              currentServerName === currentEpisodeServer.server_name &&
              currentEpisodeSlug === sd.slug;
            return (
              <button
                key={sd.slug}
                type="button"
                onClick={() => onSelect(sd.slug, currentEpisodeServer.server_name)}
                title={sd.name}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#FECF59] text-[#0f1115] shadow-md shadow-[#FECF59]/30'
                    : 'bg-[#1f2128] text-gray-200 hover:bg-[#FECF59] hover:text-[#0f1115]'
                }`}
              >
                <FaPlay className="h-2.5 w-2.5 shrink-0 opacity-60" />
                <span className="truncate">Tập {start + idx + 1}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Mở rộng — thẻ ngang có ảnh bìa + nút play */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((sd, idx) => {
            const isActive =
              currentServerName === currentEpisodeServer.server_name &&
              currentEpisodeSlug === sd.slug;
            return (
              <button
                key={sd.slug}
                type="button"
                onClick={() => onSelect(sd.slug, currentEpisodeServer.server_name)}
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
                <span
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${
                    isActive
                      ? 'bg-[#FECF59] text-[#0f1115]'
                      : 'bg-white/15 text-white group-hover/ep:bg-[#FECF59] group-hover/ep:text-[#0f1115]'
                  }`}
                >
                  <FaPlay className="h-3 w-3" />
                </span>
                <span className="absolute bottom-2 left-3 z-10 text-xs font-bold text-white">
                  Tập {start + idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EpisodeListPanel;
