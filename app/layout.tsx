import type { Metadata } from "next";
import "./globals.css";
import { AppPreferencesProvider } from "./components/app-preferences-provider";

export const metadata: Metadata = {
  title: "Book-A-Boo — Stories have no limits",
  description: "Découvrez, lisez et partagez des histoires sans frontières.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><AppPreferencesProvider>{children}</AppPreferencesProvider></body>
    </html>
  );
}