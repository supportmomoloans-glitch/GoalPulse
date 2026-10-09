import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService.ts';
import type { GoalAlert } from '../types/football.ts';
import { Zap, X, ChevronRight } from 'lucide-react';
import { TeamCrest } from './TeamCrest.tsx';

interface GoalAlertBannerProps {
  onOpenMatch?: (fixtureId: number) => void;
}

export const GoalAlertBanner: React.FC<GoalAlertBannerProps> = ({ onOpenMatch }) => {
  const [activeAlert, setActiveAlert] = useState<GoalAlert | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToGoalAlerts((alert) => {
      setActiveAlert(alert);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeAlert) return;

    // Auto-dismiss after 6.5 seconds
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 6500);

    return () => clearTimeout(timer);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <aside
      aria-label="Live goal notification"
      className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="clay-card bg-[#E6E3F2] dark:bg-[#1E1833] border-2 border-[#7138E8] dark:border-[#8B5CF6] rounded-2xl p-3.5 shadow-2xl shadow-purple-900/30 overflow-hidden relative">
        {/* Glowing Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#7138E8] to-amber-400 animate-pulse" />

        {/* Header Strip: Goal Badge & Dismiss */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-rose-600 text-white flex items-center gap-1 shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              ⚽ GOAL ALERT!
            </span>
            <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3] truncate max-w-[140px]">
              {activeAlert.competitionName}
            </span>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="w-7 h-7 rounded-full clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE] hover:text-[#211B35] dark:hover:text-[#F5F3FC]"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Main Goal Content */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <TeamCrest
              name={activeAlert.scoringTeam.name}
              crest={activeAlert.scoringTeam.crest}
              size="md"
            />
            <div className="min-w-0">
              <h4 className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC] leading-snug truncate">
                <span className="text-[#7138E8] dark:text-[#8B5CF6]">{activeAlert.scoringTeam.name}</span> scores!
              </h4>
              <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                {activeAlert.minute ? `${activeAlert.minute}' · ` : ''}
                {activeAlert.scorerName ? activeAlert.scorerName : 'Goal!'}
              </p>
            </div>
          </div>

          {/* New Score Display */}
          <div className="shrink-0 clay-inset px-2.5 py-1 rounded-xl text-center">
            <span className="font-mono text-base font-black text-[#211B35] dark:text-[#F5F3FC] tabular-nums tracking-wide block">
              {activeAlert.homeScore} - {activeAlert.awayScore}
            </span>
            <span className="text-[8px] font-bold text-[#514966] dark:text-[#B8B0D3] uppercase tracking-wider block">
              NEW SCORE
            </span>
          </div>
        </div>

        {/* Action Button: Jump to Match */}
        {onOpenMatch && (
          <button
            onClick={() => {
              onOpenMatch(activeAlert.fixtureId);
              setActiveAlert(null);
            }}
            className="w-full mt-2.5 py-1.5 px-3 rounded-xl clay-button-primary text-[11px] font-black text-white flex items-center justify-center gap-1 transition-transform active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 fill-white stroke-[2.5]" />
            <span>Open Match Centre</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </aside>
  );
};
