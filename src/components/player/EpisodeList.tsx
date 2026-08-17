import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaServer, FaPlayCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import type { Episode, ServerData } from '@/types';

interface EpisodeListProps {
  episodes: Episode[];
  currentServer?: string;
  currentEpisode?: string;
  onSelect: (serverName: string, episode: ServerData) => void;
}

const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  currentServer,
  currentEpisode,
  onSelect,
}) => {
  const { t } = useTranslation();

  // Default to first server if none specified
  const [activeServer, setActiveServer] = useState<string>(
    currentServer ?? episodes[0]?.server_name ?? '',
  );

  // Find the episode data for the active server
  const activeServerData = useMemo(() => {
    const server = episodes.find((ep) => ep.server_name === activeServer);
    return server?.server_data ?? [];
  }, [episodes, activeServer]);

  if (!episodes || episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FaPlayCircle className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">{t('episode.noEpisodes')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Server tabs */}
      {episodes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaServer className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {t('episode.server')}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
            {episodes.map((ep) => {
              const isActive = ep.server_name === activeServer;
              return (
                <button
                  key={ep.server_name}
                  onClick={() => setActiveServer(ep.server_name)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ffd166] text-[#0f111a]'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {ep.server_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Episode grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FaPlayCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            {t('episode.episodes')}
          </span>
          <span className="text-xs text-gray-500">
            ({activeServerData.length})
          </span>
        </div>

        <motion.div
          key={activeServer}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
        >
          {activeServerData.map((ep) => {
            const isCurrent =
              currentServer === activeServer && currentEpisode === ep.slug;

            return (
              <button
                key={ep.slug}
                onClick={() => onSelect(activeServer, ep)}
                className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors text-center truncate ${
                  isCurrent
                    ? 'bg-[#ffd166] text-[#0f111a] shadow-lg shadow-[#ffd166]/20'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={ep.name}
              >
                {ep.name}
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default EpisodeList;
