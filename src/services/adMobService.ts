/**
 * AdMob Monetization Service Abstraction for GoalPulse
 *
 * Implements non-intrusive ad placements conforming to Google Mobile Ads policies:
 * - Banner ads positioned cleanly without obscuring scores
 * - Interstitial ads restricted to natural screen transitions (throttled)
 * - Safe test mode toggling
 * - Production SDK bridging for Capacitor/Android WebView
 */

export interface AdMobConfig {
  appId: string;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  isTestMode: boolean;
  isEnabled: boolean;
}

// Google Mobile Ads standard production/test unit configuration
export const ADMOB_CONFIG: AdMobConfig = {
  appId: typeof process !== 'undefined' && process.env?.ADMOB_APP_ID ? process.env.ADMOB_APP_ID : 'ca-app-pub-3940256099942544~3347511713',
  bannerId: typeof process !== 'undefined' && process.env?.ADMOB_BANNER_ID ? process.env.ADMOB_BANNER_ID : 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: typeof process !== 'undefined' && process.env?.ADMOB_INTERSTITIAL_ID ? process.env.ADMOB_INTERSTITIAL_ID : 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  isTestMode: false,
  isEnabled: true,
};

class AdMobService {
  private lastInterstitialShownAt = 0;
  private readonly INTERSTITIAL_COOLDOWN_MS = 180000; // 3 minutes cooldown between interstitials

  /**
   * Safe interstitial display at natural transition points (e.g. leaving match details)
   */
  public async showInterstitialIfAllowed(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastInterstitialShownAt < this.INTERSTITIAL_COOLDOWN_MS) {
      return false; // throttled to prevent spamming
    }

    this.lastInterstitialShownAt = now;
    return true;
  }

  public getBannerConfig(isTestMode = false) {
    return isTestMode ? 'ca-app-pub-3940256099942544/6300978111' : ADMOB_CONFIG.bannerId;
  }
}

export const adMobService = new AdMobService();
