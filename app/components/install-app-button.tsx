"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstallEvent(null);
      return;
    }
    setHelpOpen(true);
  }

  if (installed) return null;

  return (
    <div className="bab-install-wrap">
      <button className="bab-install-button" type="button" onClick={() => void install()}>
        <Download size={15} aria-hidden="true" />
        <span>Installer BAB</span>
      </button>
      {helpOpen && (
        <div className="bab-install-backdrop" role="presentation" onClick={() => setHelpOpen(false)}>
          <section className="bab-install-help" role="dialog" aria-modal="true" aria-labelledby="bab-install-title" onClick={event => event.stopPropagation()}>
            <button className="bab-install-close" type="button" onClick={() => setHelpOpen(false)} aria-label="Fermer"><X size={18}/></button>
            <span className="bab-install-kicker">BOOK-A-BOO · APPLICATION WEB</span>
            <h2 id="bab-install-title">Installer Book-A-Boo</h2>
            {ios ? (
              <p>Dans Safari, appuie sur <strong>Partager</strong>, puis sur <strong>Sur l’écran d’accueil</strong> et confirme avec <strong>Ajouter</strong>.</p>
            ) : (
              <p>Si l’installation directe n’est pas proposée par ton navigateur, ouvre son menu et choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>, si cette option est disponible.</p>
            )}
            <p className="bab-install-note">Tu peux aussi utiliser Book-A-Boo directement dans ton navigateur, sans rien installer.</p>
            <button className="bab-install-dismiss" type="button" onClick={() => setHelpOpen(false)}>J’ai compris</button>
          </section>
        </div>
      )}
    </div>
  );
}
