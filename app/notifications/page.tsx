import { InteriorPage } from "../components/site-shell";
import { NotificationsPanel } from "../components/notifications-panel";

export default function NotificationsPage() {
  return <InteriorPage active="/notifications" eyebrow="VOTRE COMMUNAUTÉ" title={<>Vos <em>notifications.</em></>} description="Restez au courant des nouveaux abonnés et des histoires publiées par les auteurs que vous suivez."><NotificationsPanel /></InteriorPage>;
}
