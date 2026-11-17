import { SiteHeader } from "../components/site-shell";
import { OwnProfile } from "../components/own-profile";

export default function Profil() {
  return <main className="app-page"><SiteHeader active="/profil"/><section className="interior-content profile-direct-content"><OwnProfile/></section><footer className="app-footer"><a href="/">Book-A-Boo</a><span>Chaque histoire ouvre un monde.</span></footer></main>;
}
