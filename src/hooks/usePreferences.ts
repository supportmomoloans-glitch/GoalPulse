import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface PreferencesState {
  theme: ThemeMode;
  favouriteTeamIds: number[];
  followedCompetitionIds: number[];
  notificationsEnabled: boolean;
  notifyGoals: boolean;
  notifyAllGames: boolean;
  notifyKickoff: boolean;
  notifyFulltime: boolean;
  refreshInterval: number; // seconds
  adMobConsent: boolean;
  adMobTestMode: boolean;
}

const STORAGE_KEY = 'goalpulse_user_preferences';

const DEFAULT_PREFERENCES: PreferencesState = {
  theme: 'light',
  favouriteTeamIds: [42, 3401], // Arsenal & Gor Mahia by default
  followedCompetitionIds: [39, 328, 2], // Premier League, Kenyan Premier League, UEFA Champions League
  notificationsEnabled: true,
  notifyGoals: true,
  notifyAllGames: true,
  notifyKickoff: true,
  notifyFulltime: true,
  refreshInterval: 15, // 15 seconds for fast live updates
  adMobConsent: true,
  adMobTestMode: false,
};

export function usePreferences() {
  const [prefs, setPrefs] = useState<PreferencesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      prefs.theme === 'dark' ||
      (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        StatusBar.setBackgroundColor({ color: isDark ? '#161129' : '#EDE8F5' });
      } catch {
        // ignore on unsupported environments
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage failure
    }
  }, [prefs]);

  const updatePreference = <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFavouriteTeam = (teamId: number) => {
    setPrefs((prev) => {
      const exists = prev.favouriteTeamIds.includes(teamId);
      const updated = exists
        ? prev.favouriteTeamIds.filter((id) => id !== teamId)
        : [...prev.favouriteTeamIds, teamId];
      return { ...prev, favouriteTeamIds: updated };
    });
  };

  const toggleFollowCompetition = (compLeagueId: number) => {
    setPrefs((prev) => {
      const exists = prev.followedCompetitionIds.includes(compLeagueId);
      const updated = exists
        ? prev.followedCompetitionIds.filter((id) => id !== compLeagueId)
        : [...prev.followedCompetitionIds, compLeagueId];
      return { ...prev, followedCompetitionIds: updated };
    });
  };

  const isTeamFavourite = (teamId: number) => prefs.favouriteTeamIds.includes(teamId);
  const isCompetitionFollowed = (leagueId: number) => prefs.followedCompetitionIds.includes(leagueId);

  return {
    prefs,
    updatePreference,
    toggleFavouriteTeam,
    toggleFollowCompetition,
    isTeamFavourite,
    isCompetitionFollowed,
  };
}
