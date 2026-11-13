import { InteriorPage } from "../../components/site-shell";
import { StoryDetail } from "../../components/story-detail";

export default async function StoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  return <InteriorPage active="/explorer" eyebrow="BOOK-A-BOO · HISTOIRE" title={<>Un monde à<br/><em>découvrir.</em></>} description="Entrez dans l'univers d'un auteur et gardez cette histoire près de vous.">
    <StoryDetail storyId={storyId}/>
  </InteriorPage>;
}
