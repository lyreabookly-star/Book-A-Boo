import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppPreferencesProvider } from "./components/app-preferences-provider";
import { ServiceWorkerRegister } from "./components/service-worker-register";

export const metadata: Metadata = {
  title: "Book-A-Boo — Stories have no limits",
  description: "Découvrez, lisez et partagez des histoires sans frontières.",
  applicationName: "Book-A-Boo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Book-A-Boo",
  },
  icons: {
    icon: [\n      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },\n      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },\n    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><ServiceWorkerRegister /><AppPreferencesProvider>{children}</AppPreferencesProvider></body>
    </html>
  );
}
