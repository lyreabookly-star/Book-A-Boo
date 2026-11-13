import { InteriorPage } from "../../components/site-shell";
import { WriterEditor } from "../../components/writer-editor";

export default async function EditerOeuvre({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  return (
    <InteriorPage
      active="/ecrire"
      eyebrow="STUDIO D'ÉCRITURE BOOK-A-BOO"
      title={<>Votre histoire,<br /><em>votre espace.</em></>}
      description="Écrivez à votre rythme. Votre manuscrit reste privé et vous appartient."
    >
      <WriterEditor storyId={storyId} />
    </InteriorPage>
  );
}
