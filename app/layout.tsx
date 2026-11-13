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
    icon: "/icons/icon-192.png",
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
