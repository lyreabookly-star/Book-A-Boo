import { SiteHeader } from "../../components/site-shell";
import { PublicProfile } from "../../components/public-profile";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <main className="app-page"><SiteHeader active="/profil"/><section className="interior-content profile-direct-content"><PublicProfile username={decodeURIComponent(username)}/></section><footer className="app-footer"><a href="/">Book-A-Boo</a><span>Chaque histoire ouvre un monde.</span></footer></main>;
}
