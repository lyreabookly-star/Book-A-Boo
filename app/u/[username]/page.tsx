import { InteriorPage } from "../../components/site-shell";
import { PublicProfile } from "../../components/public-profile";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <InteriorPage active="/profil" eyebrow="BOOK-A-BOO · PROFIL" title={<>Un lecteur,<br/><em>un univers.</em></>} description="Découvrez les univers et les lectures que ce membre a choisi de partager.">
    <PublicProfile username={decodeURIComponent(username)}/>
  </InteriorPage>;
}
