import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Star,
  Globe,
  Trash2,
  ShieldCheck,
  Smartphone,
  Info,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import type { PreferencesState, ThemeMode } from '../hooks/usePreferences.ts';
import type { Competition } from '../types/football.ts';
import { api, getApiBaseUrl, setApiBaseUrl, isNativePlatform } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';

interface ProfileScreenProps {
  prefs: PreferencesState;
  updatePreference: <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => void;
  competitions: Competition[];
  onToggleFavTeam: (teamId: number, e: React.MouseEvent) => void;
  onClearCache: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  prefs,
  updatePreference,
  competitions,
  onToggleFavTeam,
  onClearCache,
}) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAmazonGuide, setShowAmazonGuide] = useState(false);
  const [cacheClearedNotice, setCacheClearedNotice] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState<string>(() => getApiBaseUrl());
  const [apiUrlSavedNotice, setApiUrlSavedNotice] = useState<boolean>(false);

  const handleClearCache = () => {
    onClearCache();
    setCacheClearedNotice(true);
    setTimeout(() => setCacheClearedNotice(false), 3000);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Header Profile Banner */}
      <div className="clay-card p-5 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#7138E8] to-[#8B5CF6] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/25 mb-3 border-2 border-white/60">
          GP
        </div>
        <h2 className="text-xl font-black text-[#211B35] dark:text-[#F5F3FC]">
          GoalPulse Fan Hub
        </h2>
        <p className="text-xs font-bold text-[#514966] dark:text-[#B8B0D3]">
          Personalized Live Scores · East Africa & Global Football
        </p>
      </div>

      {/* SECTION 1: THEME SELECTION */}
      <div className="clay-card p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
          Appearance & Theme
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { mode: 'light', label: 'Light', icon: Sun },
              { mode: 'dark', label: 'Dark', icon: Moon },
              { mode: 'system', label: 'System', icon: Monitor },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = prefs.theme === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => updatePreference('theme', item.mode)}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isSelected ? 'clay-pill-active' : 'clay-button text-[#35264F] dark:text-[#B8B0D3] hover:text-[#211B35] dark:hover:text-[#F5F3FC]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span className="text-xs font-black">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: NOTIFICATIONS & MATCH ALERTS */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
              Real-Time Goal & Match Alerts
            </h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.notificationsEnabled}
              onChange={(e) => updatePreference('notificationsEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#DDD8EC] peer-focus:outline-none rounded-full peer dark:bg-[#272042] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7138E8]"></div>
          </label>
        </div>

        {prefs.notificationsEnabled && (
          <div className="space-y-2 pt-2 border-t border-[#C9C2DD]/60 dark:border-[#362C52]/60 text-xs">
            {/* System Push Permission Action */}
            <div className="p-2.5 rounded-xl clay-inset flex items-center justify-between gap-2">
              <div>
                <span className="font-black text-[#211B35] dark:text-[#F5F3FC] block">
                  Device Push Alerts
                </span>
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                  Receive notifications even when screen is locked
                </span>
              </div>
              <button
                onClick={async () => {
                  const { notificationService } = await import('../services/notificationService.ts');
                  await notificationService.requestPermission();
                  // Force re-render
                  updatePreference('notificationsEnabled', true);
                }}
                className="clay-button px-3 py-1.5 rounded-xl text-[11px] font-black text-[#7138E8] dark:text-[#8B5CF6] shrink-0 hover:border-[#7138E8]"
              >
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
                  ? '✓ Active'
                  : 'Grant Permission'}
              </button>
            </div>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#DDD8EC]/40 dark:hover:bg-[#272042]/40 cursor-pointer">
              <span className="font-bold text-[#211B35] dark:text-[#F5F3FC]">
                Instant Goal Alerts (Audio & Screen Popups)
              </span>
              <input
                type="checkbox"
                checked={prefs.notifyGoals}
                onChange={(e) => updatePreference('notifyGoals', e.target.checked)}
                className="rounded text-[#7138E8] focus:ring-purple-500 w-4 h-4 accent-[#7138E8]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#DDD8EC]/40 dark:hover:bg-[#272042]/40 cursor-pointer">
              <div>
                <span className="font-bold text-[#211B35] dark:text-[#F5F3FC] block">
                  Alert for Any Team / Match Scoring
                </span>
                <span className="text-[11px] font-medium text-[#514966] dark:text-[#B8B0D3]">
                  Receive immediate alerts when any live match scores
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.notifyAllGames}
                onChange={(e) => updatePreference('notifyAllGames', e.target.checked)}
                className="rounded text-[#7138E8] focus:ring-purple-500 w-4 h-4 accent-[#7138E8]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#DDD8EC]/40 dark:hover:bg-[#272042]/40 cursor-pointer">
              <span className="font-bold text-[#211B35] dark:text-[#F5F3FC]">
                Kick-off Reminders (15 mins prior)
              </span>
              <input
                type="checkbox"
                checked={prefs.notifyKickoff}
                onChange={(e) => updatePreference('notifyKickoff', e.target.checked)}
                className="rounded text-[#7138E8] focus:ring-purple-500 w-4 h-4 accent-[#7138E8]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-[#DDD8EC]/40 dark:hover:bg-[#272042]/40 cursor-pointer">
              <span className="font-bold text-[#211B35] dark:text-[#F5F3FC]">
                Full-time Results & Scores
              </span>
              <input
                type="checkbox"
                checked={prefs.notifyFulltime}
                onChange={(e) => updatePreference('notifyFulltime', e.target.checked)}
                className="rounded text-[#7138E8] focus:ring-purple-500 w-4 h-4 accent-[#7138E8]"
              />
            </label>

            {/* System Notifications Permission */}
            <div className="pt-2 flex items-center justify-between border-t border-[#C9C2DD]/60 dark:border-[#362C52]/60">
              <div>
                <span className="text-xs font-bold text-[#211B35] dark:text-[#F5F3FC] block">
                  System / Device Notifications
                </span>
                <span className="text-[11px] font-medium text-[#514966] dark:text-[#B8B0D3]">
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
                    ? 'Active · Instant system popups enabled'
                    : 'Tap to allow native system score popups'}
                </span>
              </div>
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  onClick={() => {
                    notificationService.requestPermission();
                  }}
                  className="clay-button-primary px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-sm active:scale-98"
                >
                  <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Enable Push</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: TIMEZONE & DATA REFRESH */}
      <div className="clay-card p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
          Regional & Refresh Configuration
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl clay-inset">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
              <div>
                <span className="font-black text-[#211B35] dark:text-[#F5F3FC] block">
                  Match Schedule Timezone
                </span>
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">Default East Africa Time (EAT)</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-[#7138E8] dark:text-[#8B5CF6]">
              Africa/Nairobi (UTC+3)
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl clay-inset">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
              <div>
                <span className="font-black text-[#211B35] dark:text-[#F5F3FC] block">
                  Live Match Polling Rate
                </span>
                <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">Optimized for mobile data saver</span>
              </div>
            </div>
            <select
              value={prefs.refreshInterval}
              onChange={(e) => updatePreference('refreshInterval', Number(e.target.value))}
              className="bg-transparent font-black text-xs text-[#7138E8] dark:text-[#8B5CF6] outline-none"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds (Default)</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: ANDROID APK & BACKEND CONFIGURATION */}
      <div className="clay-card p-4 space-y-3 border-2 border-[#C9C2DD] dark:border-[#362C52]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#211B35] dark:text-[#F5F3FC]">
                Android APK & Backend Endpoint
              </h3>
              <span className="text-[10px] font-bold text-[#514966] dark:text-[#B8B0D3]">
                {isNativePlatform() ? 'Running as Native Android App' : 'Web / Capacitor Ready'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAmazonGuide(!showAmazonGuide)}
            className="text-xs font-black text-[#7138E8] dark:text-[#8B5CF6] underline"
          >
            {showAmazonGuide ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Backend API Configuration */}
        <div className="p-3 rounded-xl clay-inset text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#211B35] dark:text-[#F5F3FC]">
              Production Backend (HTTPS)
            </span>
            <span className="text-[10px] font-bold text-[#7138E8] dark:text-[#8B5CF6] uppercase">
              {isNativePlatform() ? 'Android APK Mode' : 'Web Mode'}
            </span>
          </div>
          <p className="text-[10px] text-[#514966] dark:text-[#B8B0D3]">
            For Android APKs installed on real devices, requests are routed securely over HTTPS to your deployed backend (no secrets exposed inside the APK).
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="url"
              placeholder="https://your-api-domain.com (or leave blank for same-origin)"
              value={apiUrlInput}
              onChange={(e) => setApiUrlInput(e.target.value)}
              className="flex-1 bg-white/70 dark:bg-[#1a142e]/70 border border-[#C9C2DD]/60 dark:border-[#362C52]/60 rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#211B35] dark:text-[#F5F3FC] outline-none focus:border-[#7138E8]"
            />
            <button
              onClick={() => {
                setApiBaseUrl(apiUrlInput);
                setApiUrlSavedNotice(true);
                setTimeout(() => setApiUrlSavedNotice(false), 2500);
              }}
              className="clay-button-primary px-3 py-1.5 rounded-xl text-xs font-black text-white shrink-0 active:scale-95"
            >
              Save
            </button>
          </div>
          {apiUrlSavedNotice && (
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ✓ Backend endpoint saved for APK requests
            </p>
          )}
        </div>

        {showAmazonGuide && (
          <div className="p-3 rounded-2xl bg-[#DDD8EC]/70 dark:bg-[#272042]/70 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Application ID: </strong>
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c182b] font-mono text-[11px] text-[#7138E8] dark:text-[#8B5CF6]">
                  com.goalpulse.football
                </code>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">App Name: </strong>
                <span className="text-[#514966] dark:text-[#B8B0D3]">GoalPulse</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Version: </strong>
                <span className="text-[#514966] dark:text-[#B8B0D3]">Version Name: 1.0 · Version Code: 1</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Security Architecture: </strong>
                <span className="text-[#514966] dark:text-[#B8B0D3]">
                  Zero API keys embedded in client code. All API requests route securely over HTTPS to the backend proxy.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Native Platform: </strong>
                <span className="text-[#514966] dark:text-[#B8B0D3]">
                  Capacitor Android wrapper configured with AndroidManifest permissions (INTERNET, VIBRATE, POST_NOTIFICATIONS, ACCESS_NETWORK_STATE).
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: ADMOB MONETIZATION CONTROLS */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#7138E8] dark:text-[#8B5CF6] stroke-[2.5]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#514966] dark:text-[#B8B0D3]">
            Monetization & Ad Serving
          </h3>
        </div>

        <div className="p-3 rounded-xl clay-inset text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#211B35] dark:text-[#F5F3FC]">
              Google AdMob Serving
            </span>
            <input
              type="checkbox"
              checked={prefs.adMobConsent}
              onChange={(e) => updatePreference('adMobConsent', e.target.checked)}
              className="rounded text-[#7138E8] focus:ring-purple-500 w-4 h-4 accent-[#7138E8]"
            />
          </div>
          <p className="text-[10px] font-medium text-[#514966] dark:text-[#B8B0D3]">
            Monetization active with Google Mobile Ads banner placements and GDPR / TCF privacy consent controls.
          </p>
        </div>
      </div>

      {/* SECTION 6: STORAGE & CACHE CONTROLS */}
      <div className="clay-card p-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-[#211B35] dark:text-[#F5F3FC]">
            Offline Storage & Cache
          </h3>
          <p className="text-[11px] font-bold text-[#514966] dark:text-[#B8B0D3]">
            Clear locally saved match history and offline snapshots
          </p>
        </div>

        <button
          onClick={handleClearCache}
          className="clay-button px-3 py-1.5 rounded-xl text-xs font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Clear Cache</span>
        </button>
      </div>

      {cacheClearedNotice && (
        <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs text-center font-black animate-in fade-in">
          Local offline cache successfully cleared!
        </div>
      )}

      {/* SECTION 7: LEGAL & ABOUT */}
      <div className="flex items-center justify-between px-2 text-xs text-[#514966] dark:text-[#B8B0D3]">
        <button
          onClick={() => setShowPrivacy(true)}
          className="hover:text-[#7138E8] dark:hover:text-[#8B5CF6] underline font-bold"
        >
          Privacy Policy & Terms
        </button>
        <span className="font-bold">GoalPulse v1.0.0 (Build 2026.10)</span>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="clay-card bg-[#E6E3F2] dark:bg-[#1E1833] max-w-lg w-full max-h-[85vh] p-5 rounded-3xl overflow-y-auto space-y-4 border border-[#C9C2DD] dark:border-[#362C52]">
            <div className="flex items-center justify-between pb-3 border-b border-[#C9C2DD] dark:border-[#362C52]">
              <h3 className="font-black text-base text-[#211B35] dark:text-[#F5F3FC]">
                Privacy Policy & Terms of Use
              </h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-8 h-8 rounded-full clay-button flex items-center justify-center text-[#35264F] dark:text-[#DDD6FE]"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#514966] dark:text-[#B8B0D3] space-y-3 leading-relaxed font-medium">
              <p>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">GoalPulse</strong> respects user privacy and does not collect any mandatory personal information to view live football scores and fixtures.
              </p>
              <p>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Data Storage:</strong> Favourites and theme preferences are stored locally on your device via standard local storage.
              </p>
              <p>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Sports Data Attribution:</strong> Football match data, fixtures, standings, and statistics are supplied by API-Football and official sports providers.
              </p>
              <p>
                <strong className="text-[#211B35] dark:text-[#F5F3FC]">Advertisements:</strong> Where enabled, Google AdMob displays non-intrusive banner and transition advertisements in compliance with Google Mobile Ads policies.
              </p>
            </div>

            <button
              onClick={() => setShowPrivacy(false)}
              className="w-full py-2.5 rounded-xl clay-button-primary text-xs font-black text-white text-center"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
