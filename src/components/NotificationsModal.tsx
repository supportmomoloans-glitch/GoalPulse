import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, ShieldCheck, X, Zap, ChevronRight, Check } from 'lucide-react';
import { notificationService } from '../services/notificationService.ts';
import type { GoalAlert } from '../types/football.ts';
import { TeamCrest } from './TeamCrest.tsx';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMatch: (fixtureId: number) => void;
  onOpenSettings: () => void;
  notificationsEnabled: boolean;
  notifyGoals: boolean;
  notifyAllGames: boolean;
  onToggleGoalAlerts: (enabled: boolean) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenMatch,
  onOpenSettings,
  notificationsEnabled,
  notifyGoals,
  notifyAllGames,
  onToggleGoalAlerts,
}) => {
  const [recentAlerts, setRecentAlerts] = useState<GoalAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      setRecentAlerts(notificationService.getRecentAlerts());
      setPermission(notificationService.getPermissionStatus());
    }
  }, [isOpen]);

  // Subscribe to live score alerts while modal is open
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToGoalAlerts((newAlert) => {
      setRecentAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
    });
    return () => unsubscribe();
  }, []);

  const handleRequestPush = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission('granted');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-4 animate-in fade-in duration-200">
      <div className="bg-[#E6E3F2] dark:bg-[#1E1833] w-full max-w-lg max-h-[85vh] rounded-3xl flex flex-col shadow-2xl border-2 border-[#7138E8] dark:border-[#8B5CF6] overflow-hidden">
        {/* Header Strip */}
        <div className="p-4 border-b border-[#C9C2DD] dark:border-[#362C52] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7138E8] text-white flex items-center justify-center shadow-md shadow-purple-900/30">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#211B35] dark:text-[#F5F3FC] flex items-center gap-2">
                <span>Real-Time Goal Alerts</span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                Instant notification when any team or game scores
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE]"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Live Status & Quick Controls */}
        <div className="p-4 bg-[#DDD8EC]/40 dark:bg-[#272042]/40 border-b border-[#C9C2DD] dark:border-[#362C52] space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-2xl clay-inset">
            <div className="flex items-center gap-2.5">
              {notifyGoals ? (
                <Volume2 className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#514966] dark:text-[#B8B0D3] stroke-[2.5]" />
              )}
              <div>
                <span className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC] block">
                  Goal Chime & Toast Alerts
                </span>
                <span className="text-[10px] font-medium text-[#514966] dark:text-[#B8B0D3]">
                  {notifyAllGames ? 'Active for all live soccer matches' : 'Active for favourite clubs'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleGoalAlerts(!notifyGoals)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                notifyGoals
                  ? 'clay-pill-active text-white'
                  : 'clay-pill-inactive text-[#514966] dark:text-[#B8B0D3]'
              }`}
            >
              {notifyGoals ? 'ENABLED' : 'PAUSED'}
            </button>
          </div>

          {/* System Push Permission Strip */}
          {permission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-purple-900/10 to-indigo-900/10 border border-[#7138E8]/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                <span className="text-xs font-bold text-[#211B35] dark:text-[#F5F3FC]">
                  Enable device system push alerts
                </span>
              </div>
              <button
                onClick={handleRequestPush}
                className="clay-button-primary px-3 py-1 text-[11px] font-black text-white rounded-xl shadow-sm active:scale-98"
              >
                Allow
              </button>
            </div>
          )}
        </div>

        {/* Recent Alerts Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
              Live Score Feed
            </h3>
            {recentAlerts.length > 0 && (
              <button
                onClick={() => {
                  notificationService.clearRecentAlerts();
                  setRecentAlerts([]);
                }}
                className="text-[10px] font-bold text-[#7138E8] dark:text-[#8B5CF6] hover:underline"
              >
                Clear History
              </button>
            )}
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2.5">
              <div className="w-12 h-12 rounded-2xl clay-card mx-auto flex items-center justify-center text-[#7138E8] dark:text-[#8B5CF6]">
                <Bell className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC]">
                Live Goal Monitoring Active
              </h4>
              <p className="text-[11px] font-medium text-[#514966] dark:text-[#B8B0D3] max-w-xs mx-auto leading-relaxed">
                When any team or match scores, an immediate audio chime, haptic vibration, and on-screen score alert will fire right here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    onOpenMatch(alert.fixtureId);
                    onClose();
                  }}
                  className="clay-card p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-[#7138E8] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <TeamCrest
                      name={alert.scoringTeam.name}
                      crest={alert.scoringTeam.crest}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-[#211B35] dark:text-[#F5F3FC] truncate">
                          {alert.scoringTeam.name}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300">
                          GOAL
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                        {alert.minute ? `${alert.minute}' · ` : ''}
                        {alert.homeTeamName} vs {alert.awayTeamName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="clay-inset px-2.5 py-1 rounded-xl text-center">
                      <span className="font-mono text-xs font-black text-[#211B35] dark:text-[#F5F3FC]">
                        {alert.homeScore} - {alert.awayScore}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer link to settings */}
        <div className="p-3 border-t border-[#C9C2DD] dark:border-[#362C52] bg-[#DDD8EC]/30 dark:bg-[#120E22]/50 flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
            Customize match alarms in Settings
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="font-black text-[#7138E8] dark:text-[#8B5CF6] hover:underline"
          >
            Open Preferences →
          </button>
        </div>
      </div>
    </div>
  );
};
