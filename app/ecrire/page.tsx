"use client";

import { InteriorPage } from "../components/site-shell";
import { useAppPreferences } from "../components/app-preferences-provider";
import { WriterStudio } from "../components/writer-studio";

export default function Ecrire() {
  const { locale } = useAppPreferences();
  const copy = {
    fr: { eyebrow: "STUDIO D'ÉCRITURE BOOK-A-BOO", title: <>Les histoires<br /><em>commencent par vous.</em></>, description: "Un espace pensé pour vos idées, vos manuscrits et les univers que vous construisez. Vos brouillons restent privés." },
    en: { eyebrow: "BOOK-A-BOO WRITING STUDIO", title: <>Stories<br /><em>begin with you.</em></>, description: "A space for your ideas, manuscripts and the worlds you create. Your drafts remain private." },
    es: { eyebrow: "ESTUDIO DE ESCRITURA BOOK-A-BOO", title: <>Las historias<br /><em>comienzan contigo.</em></>, description: "Un espacio para tus ideas, tus manuscritos y los universos que construyes. Tus borradores permanecen privados." },
    pt: { eyebrow: "ESTÚDIO DE ESCRITA BOOK-A-BOO", title: <>As histórias<br /><em>começam com você.</em></>, description: "Um espaço para suas ideias, seus manuscritos e os universos que você constrói. Seus rascunhos permanecem privados." }
  };
  const t = copy[locale === "en" || locale === "es" || locale === "pt" ? locale : "fr"];
  return (
    <InteriorPage
      active="/ecrire"
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
    >
      <WriterStudio />
    </InteriorPage>
  );
}
