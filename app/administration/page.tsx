import { InteriorPage } from "../components/site-shell";
import { AdministrationDashboard } from "../components/administration-dashboard";

export default function AdministrationPage() {
  return (
    <InteriorPage active="/administration" eyebrow="BOOK-A-BOO · ESPACE PRIVÉ" title={<>L’espace<br /><em>administration.</em></>} description="Gérez la plateforme et veillez au respect des règles de la communauté.">
      <AdministrationDashboard />
    </InteriorPage>
  );
}
