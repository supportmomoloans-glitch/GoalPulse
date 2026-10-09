import React from 'react';
import { Search, Bell, Activity } from 'lucide-react';
import appIconImg from '../assets/images/goalpulse_app_icon_1791503538560.jpg';
import { notificationService } from '../services/notificationService.ts';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  liveMatchCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  liveMatchCount,
}) => {
  const handleBellClick = () => {
    notificationService.requestPermission().catch(() => {});
    onOpenNotifications();
  };

  return (
    <header className="sticky top-0 z-30 header-safe pb-3 bg-[#F0EFF8]/95 dark:bg-[#120E22]/95 backdrop-blur-md border-b border-[#C9C2DD] dark:border-[#362C52]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-purple-900/10 shrink-0 border border-[#C9C2DD] dark:border-[#362C52] bg-[#E6E3F2] dark:bg-[#1E1833]">
            <img
              src={appIconImg}
              alt="GoalPulse Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tight text-[#211B35] dark:text-[#F5F3FC]">
                Goal<span className="text-[#7138E8] dark:text-[#8B5CF6]">Pulse</span>
              </h1>
              {liveMatchCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                  {liveMatchCount} LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3] tracking-wide">
              Live Scores & Sports Hub
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-11 h-11 rounded-2xl clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#7138E8] dark:hover:text-[#A78BFA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7138E8]"
            title="Search teams, competitions, and fixtures"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-[#35264F] dark:text-[#DDD6FE] stroke-[2.5]" />
          </button>

          <button
            onClick={handleBellClick}
            className="w-11 h-11 rounded-2xl clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#7138E8] dark:hover:text-[#A78BFA] transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7138E8]"
            title="Real-Time Goal & Match Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#35264F] dark:text-[#DDD6FE] stroke-[2.5]" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#7138E8]" />
          </button>
        </div>
      </div>
    </header>
  );
};
