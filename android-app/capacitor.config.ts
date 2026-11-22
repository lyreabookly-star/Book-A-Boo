import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookaboo.app',
  appName: 'Book-A-Boo',
  webDir: 'www',
  server: {
    url: 'https://book-a-boo-mu.vercel.app',
    cleartext: false,
    allowNavigation: [
      'book-a-boo-mu.vercel.app',
      'book-a-boo-lyreabookly-2697.vercel.app',
    ],
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#111014',
      showSpinner: false,
    },
  },
};

export default config;
