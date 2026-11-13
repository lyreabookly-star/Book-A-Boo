import { InteriorPage } from "../components/site-shell";
import { SettingsPanel } from "../components/settings-panel";

export default function Parametres() {
  return (
    <InteriorPage active="/profil" eyebrow="VOTRE ESPACE PERSONNEL" title={<>Vos réglages,<br /><em>vos choix.</em></>} description="Personnalisez votre expérience et gardez le contrôle sur votre compte Book-A-Boo.">
      <SettingsPanel />
    </InteriorPage>
  );
}
