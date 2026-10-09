# GoalPulse — Android APK & Production Release Guide

## 1. Application Configuration & Architecture
- **Application Name**: GoalPulse
- **Package ID / Application ID**: `com.goalpulse.football`
- **Version Name**: `1.0`
- **Version Code**: `1`
- **Target SDK**: Android 36 (Android 14/15 ready, Min SDK 24 / Android 7.0+)
- **Primary Timezone**: `Africa/Nairobi` (East Africa Time, UTC+3)
- **Primary Category**: Sports & Scores
- **Production Backend Endpoint**: `https://ais-pre-nuuwubln5i3rdo3sy2naky-210781881085.europe-west1.run.app`

### Secure Architecture (No Secrets in APK)
- In native Android APK mode, GoalPulse communicates securely over HTTPS with the deployed Node/Express backend (`/api/*`).
- **No API secrets or credentials (such as `API_FOOTBALL_KEY`) are bundled into the APK binary or client assets.**
- The server performs caching, rate limiting, and response serialization, protecting both API quota and user privacy.
- Devices running the APK connect directly to the HTTPS endpoint with fallback support and custom endpoint configuration in the Profile settings.

---

## 2. API-Football Backend Setup
GoalPulse connects to API-Football (https://www.api-football.com/).

To use live real-time feeds on your server:
1. Obtain an API key from https://www.api-football.com/ or RapidAPI.
2. Set `API_FOOTBALL_KEY` in your deployed backend environment:
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

## 4. Building and Signing a Release APK via Android Studio

### Prerequisites (Requires a Computer):
1. **Node.js 20+** & **npm** installed on your workstation.
2. **Android Studio** (Ladybug / Koala / Hedgehog or newer) with Android SDK and Build Tools installed.
3. Java Development Kit (**JDK 17 or 21**).

---

### Step 1: Sync Web Assets to Android Project
Before packaging, make sure the latest production web build is synced into the native Android folder:
```bash
npm run build
npx cap sync android
```
*(This bundles the minified assets into `android/app/src/main/assets/public/` and updates the Capacitor configuration).*

---

### Step 2: Open the Native Project in Android Studio
Launch Android Studio and choose **Open**, then select the `android` folder in this repository:
```bash
npx cap open android
```
Allow Gradle to sync dependencies (`androidx.appcompat`, `capacitor-android`, etc.).

---

### Step 3: Create a Release Keystore (Credentials)
If you don't already have an upload keystore, generate one using JDK's `keytool`:
```bash
keytool -genkey -v -keystore goalpulse-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias goalpulse
```
Store `goalpulse-release.jks` and your passwords securely. **Never commit the `.jks` keystore to public version control.**

---

### Step 4: Generate the Signed Release APK / AAB
In Android Studio:
1. In the top menu, go to **Build** → **Generate Signed Bundle / APK...**
2. Choose **APK** (for direct sideloading/installation) or **Android App Bundle** (for Google Play Console).
3. Click **Next**.
4. In **Key store path**, browse to your `goalpulse-release.jks`.
5. Enter your keystore password, select alias `goalpulse`, and enter key password.
6. Click **Next**.
7. Select Destination folder and choose the **release** build variant.
8. Check **V1 (Jar Signature)** and **V2 (Full APK Signature)** if prompted.
9. Click **Finish**.

The signed production APK will be generated at:
`android/app/release/app-release.apk`

---

### Step 5: Test and Install on Real Android Devices
To install and test on a connected physical Android device:
```bash
adb install -r android/app/release/app-release.apk
```
Or transfer the `app-release.apk` file directly to any Android smartphone via USB or cloud drive and tap to install.

Verify:
- The app installs with name **GoalPulse** and application ID `com.goalpulse.football`.
- Live scores, fixtures, standings, and news load over HTTPS without needing local development servers.
- East Africa Time (EAT, UTC+3) is properly displayed across all match schedules.

---

## 5. Mobile-Only Build Workflow via GitHub Actions (No PC Needed)

If you are working strictly from an Android smartphone, a GitHub Actions workflow (`.github/workflows/build-apk.yml`) is provided in this repository to compile and sign the APK in the cloud.

### How to Build & Download the APK on your Android Phone:

1. **Push your code to GitHub**:
   Ensure all files from AI Studio are committed and pushed to your GitHub repository (`main` or `master` branch).

2. **Open GitHub in your Mobile Browser**:
   Navigate to `https://github.com/your-username/GoalPulse` in Chrome or Samsung Internet.

3. **Navigate to Actions**:
   - In the repository top tab bar, tap **Actions** (if you don't see it, tap the three dots **...** menu or switch browser to "Desktop site").
   - Under **All workflows**, tap **Build GoalPulse Android APK**.

4. **Trigger the Cloud Build**:
   - Tap the blue/gray **Run workflow** dropdown button.
   - Leave the branch as `main` and tap **Run workflow** (green button).

5. **Monitor Build Progress**:
   - A new workflow run will appear with a yellow spinning circle ("in progress").
   - Tap on the workflow run, then tap **build** to view real-time compilation logs.
   - It usually completes in 3–5 minutes.

6. **Download and Install the APK**:
   - Once the run shows a green checkmark (**success**), scroll to the bottom of the summary page to the **Artifacts** section.
   - Tap on **GoalPulse-Android-APKs** to download the ZIP file.
   - On your Android phone, open your **Files** / **My Files** app, navigate to **Downloads**, and tap the ZIP file to extract it.
   - Tap **GoalPulse-release.apk** (or `GoalPulse-debug.apk`) to install.
   - If prompted by Android with *"Install unknown apps"*, tap **Settings** and allow your browser or file manager to install apps.

---

## 6. Optional: Adding Custom Signing Secrets in GitHub for Amazon Appstore

By default, the cloud workflow automatically generates a valid signing key so your APK is immediately installable on your phone and shareable with friends. When you are ready to produce the official Amazon Appstore release:

1. In GitHub on your phone, go to **Settings** → **Secrets and variables** → **Actions**.
2. Tap **New repository secret**.
3. Add the following secrets (optional):
   - `KEYSTORE_BASE64`: Your `.jks` or `.keystore` file encoded as a base64 string.
   - `KEYSTORE_PASSWORD`: The password for your keystore.
   - `KEY_ALIAS`: The alias name (e.g., `goalpulse`).
   - `KEY_PASSWORD`: The private key password.
4. Re-run the workflow. The output `GoalPulse-release.apk` will now be signed with your permanent production key.
