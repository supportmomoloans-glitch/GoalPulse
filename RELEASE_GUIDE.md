# GoalPulse — Android APK & Amazon Appstore Release Guide

## 1. Application Configuration
- **Application Name**: GoalPulse
- **Package ID / Application ID**: `com.goalpulse.app`
- **Version Name**: `1.0.0`
- **Version Code**: `1`
- **Primary Timezone**: `Africa/Nairobi` (East Africa Time, UTC+3)
- **Primary Category**: Sports & Scores

---

## 2. API-Football Integration Setup
GoalPulse connects to API-Football (https://www.api-football.com/).

To use live real-time feeds:
1. Obtain an API key from https://www.api-football.com/ or RapidAPI.
2. Add to your backend environment `.env`:
   ```bash
   API_FOOTBALL_KEY=your_actual_api_key_here
   ```
3. GoalPulse automatically queries official fixtures, live matches, match minute, lineups, standings, and top scorers with server-side caching and rate-limit preservation.

---

## 3. AdMob Monetization Configuration
GoalPulse implements Google Mobile Ads compliant placements:
- **Banner Ads**: Non-intrusive banner card with clear "AD" labeling and safe distance from navigation.
- **Interstitial Ads**: Throttled natural transitions between match view sheets (3-minute cooldown minimum).

### Production Unit IDs:
In `.env` or Capacitor config:
```bash
ADMOB_APP_ID="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
ADMOB_BANNER_ID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
ADMOB_INTERSTITIAL_ID="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
```

---

## 4. Generating a Signed Android APK via Capacitor

### Step 1: Install Capacitor Android
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init GoalPulse com.goalpulse.app --web-dir dist
```

### Step 2: Build the web application
```bash
npm run build
npx cap add android
npx cap copy android
```

### Step 3: Generate a Production Keystore
```bash
keytool -genkey -v -keystore goalpulse-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias goalpulse
```

### Step 4: Build Signed APK / AAB
Open the `/android` directory in Android Studio:
```bash
npx cap open android
```
Select **Build > Generate Signed Bundle / APK > APK / Android App Bundle**, select your `goalpulse-release-key.jks`, and select `release`.

---

## 5. Amazon Appstore Submission Checklist
1. **Developer Account**: Log in to [Amazon Developer Console](https://developer.amazon.com/).
2. **Add New App**: Select **Android**, enter Title `GoalPulse`, App SKU `goalpulse_v1`.
3. **App Information**:
   - Title: `GoalPulse - Football Live Scores`
   - Category: `Sports`
   - Target Audience: `All Ages`
4. **Target Devices**: Kindle Fire HD / Standard Android devices.
5. **Content Rating**: Complete questionnaire (Sports scores: PEGI 3 / Everyone).
6. **Binary Upload**: Upload your signed release APK (`app-release.apk`).
7. **Release**: Submit for review.
