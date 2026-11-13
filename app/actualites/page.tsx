import { InteriorPage } from "../components/site-shell";
import { ActivityFeed } from "../components/activity-feed";

export default function ActualitesPage() {
  return (
    <InteriorPage active="/actualites" eyebrow="LA VIE DE VOTRE COMMUNAUTÉ" title={<>Les mots continuent<br /><em>de voyager.</em></>} description="Retrouvez les nouvelles histoires publiées par les auteurs que vous suivez.">
      <ActivityFeed />
    </InteriorPage>
  );
}
