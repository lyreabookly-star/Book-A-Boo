import { InteriorPage } from "../components/site-shell";
import { LibraryPageClient } from "../components/library-page-client";

export default function Bibliotheque() {
  return <InteriorPage
    active="/profil"
    eyebrow="VOTRE ESPACE DE LECTURE"
    title={<>Votre bibliothèque<br/><em>personnelle.</em></>}
    description="Retrouvez les histoires que vous avez enregistrées, celles que vous lisez en ce moment et vos lectures terminées."
  >
    <LibraryPageClient />
  </InteriorPage>;
}
