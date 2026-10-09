import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import type { GoalAlert, Fixture } from '../types/football.ts';
import { playGoalChime } from '../utils/sound.ts';

type GoalAlertCallback = (alert: GoalAlert) => void;

class NotificationService {
  private listeners = new Set<GoalAlertCallback>();
  private prevScores = new Map<number, { home: number | null; away: number | null }>();
  private recentAlerts: GoalAlert[] = [];
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
      return this.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch {
      return false;
    }
  }

  public subscribeToGoalAlerts(callback: GoalAlertCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getRecentAlerts(): GoalAlert[] {
    return [...this.recentAlerts];
  }

  public clearRecentAlerts(): void {
    this.recentAlerts = [];
  }

  /**
   * Dispatches an immediate goal alert through sound, vibration, native notification, and in-app banner
   */
  public triggerGoalAlert(alert: GoalAlert, options: { sound?: boolean; nativeNotification?: boolean } = {}): void {
    const { sound = true, nativeNotification = true } = options;

    // Track in recent alerts history
    this.recentAlerts.unshift(alert);
    if (this.recentAlerts.length > 20) {
      this.recentAlerts.pop();
    }

    // 1. Play audio chime
    if (sound) {
      playGoalChime();
    }

    // 2. Hardware vibration on Android / mobile
    if (Capacitor.isNativePlatform()) {
      try {
        Haptics.notification({ type: NotificationType.Success });
      } catch {
        // fallback
      }
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {
        // ignore
      }
    }

    // 3. System / Browser Native Notification
    if (nativeNotification && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `⚽ GOAL! ${alert.scoringTeam.name} scores!`;
        const body = `${alert.homeTeamName} ${alert.homeScore} - ${alert.awayScore} ${alert.awayTeamName} (${alert.minute ? alert.minute + '\'' : 'LIVE'})\n${alert.scorerName ? 'Scorer: ' + alert.scorerName : alert.competitionName}`;
        
        new Notification(title, {
          body,
          icon: alert.scoringTeam.crest || '/favicon.ico',
          badge: '/favicon.ico',
          tag: `goal-${alert.fixtureId}-${alert.timestamp}`,
        });
      } catch (err) {
        console.debug('Native notification display failed:', err);
      }
    }

    // 4. In-App Subscribers (Displays floating Claymorphism toast banner)
    this.listeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (err) {
        console.error('Goal alert listener failed:', err);
      }
    });
  }

  /**
   * Compares live fixtures with previous scores and triggers goal alerts immediately
   * whenever ANY team or game scores in real time
   */
  public processLiveFixtures(
    fixtures: Fixture[],
    userPrefs: {
      notificationsEnabled: boolean;
      notifyGoals: boolean;
      notifyAllGames?: boolean;
      favouriteTeamIds: number[];
    }
  ): void {
    if (!fixtures || fixtures.length === 0) return;

    for (const fixture of fixtures) {
      const currentHome = fixture.score.home;
      const currentAway = fixture.score.away;

      if (currentHome === null || currentAway === null) continue;

      const prev = this.prevScores.get(fixture.id);

      // Seed initial score if not yet recorded
      if (!prev) {
        this.prevScores.set(fixture.id, { home: currentHome, away: currentAway });
        continue;
      }

      // Check for home team goal
      const homeGoal = prev.home !== null && currentHome > prev.home;
      // Check for away team goal
      const awayGoal = prev.away !== null && currentAway > prev.away;

      if (homeGoal || awayGoal) {
        // Update stored score
        this.prevScores.set(fixture.id, { home: currentHome, away: currentAway });

        // Check if user allows notifications
        if (!userPrefs.notificationsEnabled || !userPrefs.notifyGoals) {
          continue;
        }

        // Only restrict to favourites if user explicitly turned off "All Games"
        const isHomeFav = userPrefs.favouriteTeamIds.includes(fixture.homeTeam.id);
        const isAwayFav = userPrefs.favouriteTeamIds.includes(fixture.awayTeam.id);

        if (userPrefs.notifyAllGames === false && userPrefs.favouriteTeamIds.length > 0 && !isHomeFav && !isAwayFav) {
          continue;
        }

        const scoringTeam = homeGoal ? fixture.homeTeam : fixture.awayTeam;
        const concedingTeam = homeGoal ? fixture.awayTeam : fixture.homeTeam;

        const alert: GoalAlert = {
          id: `goal-${fixture.id}-${Date.now()}`,
          fixtureId: fixture.id,
          scoringTeam,
          concedingTeam,
          homeTeamName: fixture.homeTeam.name,
          awayTeamName: fixture.awayTeam.name,
          homeScore: currentHome,
          awayScore: currentAway,
          minute: fixture.minute,
          competitionName: fixture.competition.name,
          timestamp: Date.now(),
        };

        this.triggerGoalAlert(alert);
      } else {
        // Keep updated
        this.prevScores.set(fixture.id, { home: currentHome, away: currentAway });
      }
    }
  }
}

export const notificationService = new NotificationService();
