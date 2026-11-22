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
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    const installWindow = window as Window & { __BAB_DEFERRED_INSTALL_PROMPT?: InstallPromptEvent | null };
    if (installWindow.__BAB_DEFERRED_INSTALL_PROMPT) setInstallEvent(installWindow.__BAB_DEFERRED_INSTALL_PROMPT);

    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const ua = navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    setAndroid(/Android/i.test(ua));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as InstallPromptEvent;
      installWindow.__BAB_DEFERRED_INSTALL_PROMPT = promptEvent;
      setInstallEvent(promptEvent);
    };
    const onPromptReady = () => {
      if (installWindow.__BAB_DEFERRED_INSTALL_PROMPT) setInstallEvent(installWindow.__BAB_DEFERRED_INSTALL_PROMPT);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      installWindow.__BAB_DEFERRED_INSTALL_PROMPT = null;
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("babinstallpromptready", onPromptReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("babinstallpromptready", onPromptReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) {
      setHelpOpen(true);
      return;
    }

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setHelpOpen(false);
      }
    } finally {
      setInstallEvent(null);
      (window as Window & { __BAB_DEFERRED_INSTALL_PROMPT?: InstallPromptEvent | null }).__BAB_DEFERRED_INSTALL_PROMPT = null;
    }
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
            ) : android ? (
              <p>Dans Chrome, ouvre le menu <strong>⋮</strong> et choisis <strong>Installer l’application</strong> (ou <strong>Installer Book-A-Boo</strong>). Évite <strong>Créer un raccourci</strong> ou <strong>Ajouter à l’écran d’accueil</strong> si Chrome propose aussi l’installation : ces options peuvent créer un simple raccourci Chrome.</p>
            ) : (
              <p>Ouvre le menu de ton navigateur et choisis <strong>Installer Book-A-Boo</strong> ou <strong>Installer l’application</strong>, si cette option est disponible.</p>
            )}
            <p className="bab-install-note">Après l’installation, l’icône Book-A-Boo doit ouvrir l’application directement, sans passer par un onglet Chrome.</p>
            <button className="bab-install-dismiss" type="button" onClick={() => setHelpOpen(false)}>J’ai compris</button>
          </section>
        </div>
      )}
    </div>
  );
}
