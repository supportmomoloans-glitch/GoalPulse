import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goalpulse.football',
  appName: 'GoalPulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false, // Enforce HTTPS for production security
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#161129',
    },
  },
};

export default config;
