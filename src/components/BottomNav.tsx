import React from 'react';
import { Home, Zap, Trophy, Newspaper, User } from 'lucide-react';

export type NavTab = 'home' | 'scores' | 'competitions' | 'news' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  liveCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  liveCount,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scores', label: 'Scores', icon: Zap },
    { id: 'competitions', label: 'Leagues', icon: Trophy },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#F0EFF8]/95 dark:bg-[#120E22]/95 backdrop-blur-xl border-t border-[#C9C2DD] dark:border-[#362C52] px-3 py-2 pb-safe shadow-[0_-6px_20px_rgba(45,30,80,0.08)] dark:shadow-[0_-6px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[52px] flex flex-col items-center justify-center rounded-2xl py-1 px-1 transition-all ${
                isActive
                  ? 'bg-[#7138E8] text-white shadow-md shadow-purple-700/30 scale-[1.03] border border-white/20'
                  : 'text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35] dark:hover:text-[#F5F3FC]'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white stroke-[2.8]' : 'text-[#35264F] dark:text-[#DDD6FE] stroke-[2.5]'}`} />
                {tab.id === 'scores' && liveCount > 0 && !isActive && (
                  <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                )}
              </div>
              <span
                className={`text-[11px] font-black mt-1 tracking-tight ${
                  isActive ? 'text-white' : 'text-[#35264F] dark:text-[#DDD6FE]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
