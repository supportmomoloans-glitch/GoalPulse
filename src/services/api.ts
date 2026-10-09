import { Capacitor } from '@capacitor/core';
import type {
  Competition,
  Fixture,
  MatchEvent,
  TeamStatistic,
  TeamLineup,
  StandingRow,
  TopScorer,
  HeadToHeadSummary,
  Team,
  TeamStatsSummary,
  NewsArticle,
} from '../types/football.ts';

export const API_BASE_URL_KEY = 'goalpulse_api_base_url';

export function getApiBaseUrl(): string {
  // 1. User manual override stored in localStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(API_BASE_URL_KEY);
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Vite environment variable (e.g. VITE_API_URL or VITE_API_BASE_URL)
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Production HTTPS backend fallback for native mobile devices (Capacitor APK)
  if (isNativePlatform()) {
    return 'https://ais-pre-nuuwubln5i3rdo3sy2naky-210781881085.europe-west1.run.app';
  }

  // 4. Same-origin relative paths for web browser
  return '';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed) {
    localStorage.setItem(API_BASE_URL_KEY, trimmed);
  } else {
    localStorage.removeItem(API_BASE_URL_KEY);
  }
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

const CACHE_PREFIX = 'goalpulse_offline_';

function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // LocalStorage quota might be full
  }
}

function getFromLocalStorage<T>(key: string): { data: T; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as { data: T; cachedAt: number };
  } catch {
    return null;
  }
}

export interface ApiResponse<T> {
  data: T;
  isStale?: boolean;
  cachedAt?: number;
  isOffline?: boolean;
  error?: string;
}

async function request<T>(endpoint: string, cacheKey?: string): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    const data = json.data !== undefined ? (json.data as T) : (json as T);

    if (cacheKey) {
      saveToLocalStorage(cacheKey, data);
    }

    return {
      data,
      isStale: json.isStale || false,
      cachedAt: json.cachedAt || Date.now(),
      isOffline: false,
    };
  } catch (err) {
    console.warn(`Request to ${endpoint} failed, checking offline cache:`, err);
    if (cacheKey) {
      const offlineItem = getFromLocalStorage<T>(cacheKey);
      if (offlineItem) {
        return {
          data: offlineItem.data,
          isStale: true,
          cachedAt: offlineItem.cachedAt,
          isOffline: true,
        };
      }
    }
    throw err;
  }
}

export const api = {
  async getHealth() {
    return request<{
      status: string;
      app: string;
      uptimeSeconds: number;
      isLiveApiConfigured: boolean;
      cacheStats: { items: number; hits: number; misses: number };
      timezone: string;
    }>('/api/health');
  },

  async getCompetitions(): Promise<ApiResponse<Competition[]>> {
    return request<Competition[]>('/api/competitions', 'competitions');
  },

  async getLiveFixtures(leagueId?: number): Promise<ApiResponse<Fixture[]>> {
    const q = leagueId ? `?league=${leagueId}` : '';
    return request<Fixture[]>(`/api/fixtures/live${q}`, `live_${leagueId || 'all'}`);
  },

  async getFixtures(options: {
    date?: string;
    live?: boolean;
    league?: number;
    team?: number;
  }): Promise<ApiResponse<Fixture[]>> {
    const params = new URLSearchParams();
    if (options.date) params.set('date', options.date);
    if (options.live) params.set('live', 'true');
    if (options.league) params.set('league', String(options.league));
    if (options.team) params.set('team', String(options.team));

    const cacheKey = `fixtures_${params.toString()}`;
    return request<Fixture[]>(`/api/fixtures?${params.toString()}`, cacheKey);
  },

  async getFixtureDetails(fixtureId: number): Promise<ApiResponse<Fixture>> {
    return request<Fixture>(`/api/fixtures/${fixtureId}`, `fixture_${fixtureId}`);
  },

  async getFixtureById(fixtureId: number): Promise<ApiResponse<Fixture>> {
    return request<Fixture>(`/api/fixtures/${fixtureId}`, `fixture_${fixtureId}`);
  },

  async getMatchEvents(fixtureId: number): Promise<ApiResponse<MatchEvent[]>> {
    return request<MatchEvent[]>(`/api/fixtures/${fixtureId}/events`, `events_${fixtureId}`);
  },

  async getMatchStatistics(fixtureId: number): Promise<ApiResponse<TeamStatistic[]>> {
    return request<TeamStatistic[]>(`/api/fixtures/${fixtureId}/statistics`, `stats_${fixtureId}`);
  },

  async getMatchLineups(fixtureId: number): Promise<ApiResponse<TeamLineup[]>> {
    return request<TeamLineup[]>(`/api/fixtures/${fixtureId}/lineups`, `lineups_${fixtureId}`);
  },

  async getHeadToHead(team1: number, team2: number): Promise<ApiResponse<HeadToHeadSummary>> {
    return request<HeadToHeadSummary>(
      `/api/fixtures/head-to-head?team1=${team1}&team2=${team2}`,
      `h2h_${team1}_${team2}`
    );
  },

  async getStandings(leagueId: number, season?: number): Promise<ApiResponse<StandingRow[]>> {
    const q = season ? `&season=${season}` : '';
    return request<StandingRow[]>(
      `/api/standings?league=${leagueId}${q}`,
      `standings_${leagueId}_${season || 'current'}`
    );
  },

  async getTopScorers(leagueId: number, season?: number): Promise<ApiResponse<TopScorer[]>> {
    const q = season ? `&season=${season}` : '';
    return request<TopScorer[]>(
      `/api/top-scorers?league=${leagueId}${q}`,
      `topscorers_${leagueId}_${season || 'current'}`
    );
  },

  async getTeamProfile(teamId: number): Promise<ApiResponse<Team & { stats: TeamStatsSummary }>> {
    return request<Team & { stats: TeamStatsSummary }>(`/api/teams/${teamId}`, `team_${teamId}`);
  },

  async getNews(): Promise<ApiResponse<NewsArticle[]>> {
    return request<NewsArticle[]>('/api/news', 'news_headlines');
  },

  async search(query: string): Promise<{
    teams: Team[];
    competitions: Competition[];
    fixtures: Fixture[];
  }> {
    const res = await request<{
      teams: Team[];
      competitions: Competition[];
      fixtures: Fixture[];
    }>(`/api/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  clearOfflineStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};
