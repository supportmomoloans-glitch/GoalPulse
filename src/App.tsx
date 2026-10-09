import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Fixture, Competition, NewsArticle } from './types/football.ts';
import { api } from './services/api.ts';
import { usePreferences } from './hooks/usePreferences.ts';
import { Header } from './components/Header.tsx';
import { BottomNav, type NavTab } from './components/BottomNav.tsx';
import { MatchDetailsModal } from './components/MatchDetailsModal.tsx';
import { TeamModal } from './components/TeamModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { ScoresScreen } from './screens/ScoresScreen.tsx';
import { CompetitionsScreen } from './screens/CompetitionsScreen.tsx';
import { NewsScreen } from './screens/NewsScreen.tsx';
import { ProfileScreen } from './screens/ProfileScreen.tsx';
import { getTodayDateString, formatToEAT } from './utils/date.ts';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { GoalAlertBanner } from './components/GoalAlertBanner.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { notificationService } from './services/notificationService.ts';

export default function App() {
  const {
    prefs,
    updatePreference,
    toggleFavouriteTeam,
    toggleFollowCompetition,
    isTeamFavourite,
  } = usePreferences();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Modals & Active Selections
  const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [activeLeagueId, setActiveLeagueId] = useState<number>(39); // Premier League default
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Data State
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Polling ref to manage auto-refresh lifecycle
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configure Native Status Bar so it does not overlay webview and matches theme
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const isDark =
        prefs.theme === 'dark' ||
        (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? '#120E22' : '#F0EFF8' }).catch(() => {});
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    }
  }, [prefs.theme]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial foundational data
  const loadData = useCallback(async () => {
    try {
      const [compsRes, liveRes, fixRes, newsRes] = await Promise.allSettled([
        api.getCompetitions(),
        api.getLiveFixtures(),
        api.getFixtures({ date: selectedDate }),
        api.getNews(),
      ]);

      if (compsRes.status === 'fulfilled') {
        setCompetitions(compsRes.value.data);
      }
      if (liveRes.status === 'fulfilled') {
        setLiveFixtures(liveRes.value.data);
        notificationService.processLiveFixtures(liveRes.value.data, prefs);
      }
      if (fixRes.status === 'fulfilled') {
        setFixtures(fixRes.value.data);
      }
      if (newsRes.status === 'fulfilled') {
        setNews(newsRes.value.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Network sync encountered an error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, prefs]);

  // Initial load and on date change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background-aware polling for live fixtures
  useEffect(() => {
    const pollLiveMatches = async () => {
      // Don't poll if document is hidden or offline
      if (document.hidden || !navigator.onLine) return;

      try {
        const liveRes = await api.getLiveFixtures();
        setLiveFixtures(liveRes.data);
        notificationService.processLiveFixtures(liveRes.data, prefs);
        setLastUpdated(new Date());
      } catch {
        // silent fallback
      }
    };

    const intervalMs = (prefs.refreshInterval || 30) * 1000;
    pollingTimerRef.current = setInterval(pollLiveMatches, intervalMs);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [prefs]);

  const handleOpenMatchById = async (fixtureId: number) => {
    const existing = liveFixtures.find((f) => f.id === fixtureId) || fixtures.find((f) => f.id === fixtureId);
    if (existing) {
      setSelectedMatch(existing);
      return;
    }
    try {
      const res = await api.getFixtureById(fixtureId);
      if (res.data) setSelectedMatch(res.data);
    } catch {
      // ignore
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleSelectCompetition = (leagueId: number) => {
    setActiveLeagueId(leagueId);
    setCurrentTab('competitions');
  };

  const handleToggleFavTeam = (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavouriteTeam(teamId);
  };

  const lastUpdatedText = `Updated ${formatToEAT(lastUpdated.toISOString())} EAT`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F0EFF8] dark:bg-[#120E22] text-[#211B35] dark:text-[#F5F3FC] transition-colors duration-200 font-medium">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        liveMatchCount={liveFixtures.length}
      />

      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-300 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode · Showing cached football records</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] pl-[calc(env(safe-area-inset-left,0px)+1rem)] pr-[calc(env(safe-area-inset-right,0px)+1rem)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6E3F2] dark:bg-[#1E1833] clay-card flex items-center justify-center border border-[#C9C2DD] dark:border-[#362C52]">
              <span className="w-6 h-6 border-2 border-[#7138E8] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-xs font-black text-[#514966] dark:text-[#B8B0D3]">
              Loading GoalPulse match centre...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                liveFixtures={liveFixtures}
                todayFixtures={fixtures}
                competitions={competitions}
                news={news}
                isRefreshing={isRefreshing}
                onRefresh={handleManualRefresh}
                onSelectMatch={setSelectedMatch}
                onSelectCompetition={handleSelectCompetition}
                onSelectTab={(tab) => setCurrentTab(tab)}
                favouriteTeamIds={prefs.favouriteTeamIds}
                onToggleFavTeam={handleToggleFavTeam}
                lastUpdatedText={lastUpdatedText}
              />
            )}

            {currentTab === 'scores' && (
              <ScoresScreen
                fixtures={fixtures}
                competitions={competitions}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                isRefreshing={isRefreshing}
                onRefresh={handleManualRefresh}
                onSelectMatch={setSelectedMatch}
                favouriteTeamIds={prefs.favouriteTeamIds}
                onToggleFavTeam={handleToggleFavTeam}
                lastUpdatedText={lastUpdatedText}
              />
            )}

            {currentTab === 'competitions' && (
              <CompetitionsScreen
                competitions={competitions}
                selectedLeagueId={activeLeagueId}
                onSelectTeam={(teamId) => setSelectedTeamId(teamId)}
              />
            )}

            {currentTab === 'news' && <NewsScreen articles={news} />}

            {currentTab === 'profile' && (
              <ProfileScreen
                prefs={prefs}
                updatePreference={updatePreference}
                competitions={competitions}
                onToggleFavTeam={handleToggleFavTeam}
                onClearCache={() => api.clearOfflineStorage()}
              />
            )}
          </>
        )}
      </main>

      {/* Live Real-Time Goal Alert Floating Banner */}
      <GoalAlertBanner onOpenMatch={handleOpenMatchById} />

      {/* Persistent Bottom Claymorphism Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        liveCount={liveFixtures.length}
      />

      {/* Match Details Modal Drawer */}
      {selectedMatch && (
        <MatchDetailsModal
          fixture={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSelectTeam={(teamId) => {
            setSelectedMatch(null);
            setSelectedTeamId(teamId);
          }}
        />
      )}

      {/* Team Profile Modal */}
      {selectedTeamId && (
        <TeamModal
          teamId={selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
          isFavourite={isTeamFavourite(selectedTeamId)}
          onToggleFavourite={(id) => toggleFavouriteTeam(id)}
          onSelectCompetition={handleSelectCompetition}
        />
      )}

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMatch={(fix) => {
          setIsSearchOpen(false);
          setSelectedMatch(fix);
        }}
        onSelectTeam={(tId) => {
          setIsSearchOpen(false);
          setSelectedTeamId(tId);
        }}
        onSelectCompetition={(cId) => {
          setIsSearchOpen(false);
          handleSelectCompetition(cId);
        }}
      />

      {/* Real-Time Live Goal Notifications Modal Drawer */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenMatch={handleOpenMatchById}
        onOpenSettings={() => setCurrentTab('profile')}
        notificationsEnabled={prefs.notificationsEnabled}
        notifyGoals={prefs.notifyGoals}
        notifyAllGames={prefs.notifyAllGames}
        onToggleGoalAlerts={(val) => updatePreference('notifyGoals', val)}
      />
    </div>
  );
}
