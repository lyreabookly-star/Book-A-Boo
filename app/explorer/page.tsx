import { InteriorPage } from "../components/site-shell";
import { ExploreStories } from "../components/explore-stories";



export default async function Explorer({ searchParams }: { searchParams: Promise<{ genre?: string }> }) {
 const { genre = "" } = await searchParams;
 return <InteriorPage compactHero active="/explorer" eyebrow="TROUVER VOTRE PROCHAINE LECTURE" title={<>Suivez votre<br/><em>curiosité.</em></>} description="Un genre, une humeur, une envie soudaine. Partez d'un mot et laissez-vous surprendre par les univers de Book-A-Boo.">
  <ExploreStories initialGenre={genre}/>

 </InteriorPage>;
}
