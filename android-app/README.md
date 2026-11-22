# Book-A-Boo for Android

This folder contains a separate Capacitor Android wrapper for the existing Book-A-Boo production website.

- Android application ID: `com.bookaboo.app`
- Launcher name: `Book-A-Boo`
- Website loaded by the app: `https://book-a-boo-mu.vercel.app`
- The wrapper is isolated from the Next.js/Supabase web application.
- The APK requires an internet connection because the live BAB website is loaded remotely.

## Build

The GitHub Actions workflow **Build Book-A-Boo Android APK** creates a debug APK and publishes it as a downloadable workflow artifact. It does not change the Vercel deployment.

This first APK is a test build. A production release requires a persistent private signing key and a release-signing workflow. Do not publish a debug APK to Google Play.
