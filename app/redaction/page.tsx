import { InteriorPage } from "../components/site-shell";
import { EditorialManager } from "../components/editorial-manager";

export default function RedactionPage() {
  return (
    <InteriorPage active="/redaction" eyebrow="BOOK-A-BOO · ESPACE ÉDITORIAL" title={<>Les choix de la<br /><em>rédaction.</em></>} description="Composez la sélection littéraire mise en avant sur la page d’accueil.">
      <EditorialManager />
    </InteriorPage>
  );
}
