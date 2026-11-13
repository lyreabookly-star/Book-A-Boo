import { InteriorPage } from "../components/site-shell";
import { WriterStudio } from "../components/writer-studio";

export default function Ecrire() {
  return (
    <InteriorPage
      active="/ecrire"
      eyebrow="STUDIO D'ÉCRITURE BOOK-A-BOO"
      title={<>Les histoires<br /><em>commencent par vous.</em></>}
      description="Un espace pensé pour vos idées, vos manuscrits et les univers que vous construisez. Vos brouillons restent privés."
    >
      <WriterStudio />
    </InteriorPage>
  );
}
