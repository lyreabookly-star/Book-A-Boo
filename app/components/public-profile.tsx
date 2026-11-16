"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Bookmark, LoaderCircle, UserRound, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useAppPreferences } from "./app-preferences-provider";
import { AuthorFollowButton } from "./author-follow-button";
import { ContentReportButton } from "./content-report-button";

type Profile = { id: string; username: string; display_name: string | null; bio: string; avatar_url: string | null; is_public: boolean; show_library_on_profile: boolean };
type LibraryStory = { id: string; story: { id: string; title: string; synopsis: string; genre: string; language: string } | null };
type PublishedStory = { id: string; slug: string; title: string; synopsis: string; genre: string; language: string; cover_url: string | null; published_at: string | null };
type Follower = { id: string; username: string; display_name: string | null; avatar_url: string | null };
type Following = Follower;

export function PublicProfile({ username }: { username: string }) {
  const { locale } = useAppPreferences();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<LibraryStory[]>([]);
  const [works, setWorks] = useState<PublishedStory[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [following, setFollowing] = useState<Following[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isEn = locale === "en";
  const isEs = locale === "es";
  const isPt = locale === "pt";
  const words = {
    author: isEn ? "BOOK-A-BOO AUTHOR" : isEs ? "AUTOR BOOK-A-BOO" : isPt ? "AUTOR BOOK-A-BOO" : "AUTEUR BOOK-A-BOO",
    followers: isEn ? "followers" : isEs ? "seguidores" : isPt ? "seguidores" : "abonnés",
    following: isEn ? "following" : isEs ? "siguiendo" : isPt ? "seguindo" : "abonnements",
    works: isEn ? "PUBLISHED WORKS" : isEs ? "OBRAS PUBLICADAS" : isPt ? "OBRAS PUBLICADAS" : "ŒUVRES PUBLIÉES",
    emptyWorks: isEn ? "No public work has been published yet." : isEs ? "Aún no hay obras públicas." : isPt ? "Nenhuma obra pública foi publicada ainda." : "Aucune œuvre publique n'a encore été publiée.",
    library: isEn ? "READING SHELF" : isEs ? "BIBLIOTECA" : isPt ? "BIBLIOTECA" : "BIBLIOTHÈQUE",
    libraryTitle: isEn ? "Stories in this library." : isEs ? "Historias de esta biblioteca." : isPt ? "Histórias nesta biblioteca." : "Les histoires de cette bibliothèque.",
    emptyLibrary: isEn ? "This library is waiting for its first story." : isEs ? "Esta biblioteca espera su primera historia." : isPt ? "Esta biblioteca está esperando sua primeira história." : "Cette bibliothèque attend sa première histoire.",
    unavailable: isEn ? "Profile unavailable" : isEs ? "Perfil no disponible" : isPt ? "Perfil indisponível" : "Profil indisponible",
    private: isEn ? "This profile is private or does not exist." : isEs ? "Este perfil es privado o no existe." : isPt ? "Este perfil é privado ou não existe." : "Ce profil est privé ou n'existe pas.",
    explore: isEn ? "Explore stories" : isEs ? "Explorar historias" : isPt ? "Explorar histórias" : "Explorer les histoires",
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data, error: profileError } = await supabase.from("profiles")
          .select("id,username,display_name,bio,avatar_url,is_public,show_library_on_profile")
          .eq("username", username).maybeSingle();
        if (profileError) throw profileError;
        if (!data || !data.is_public) throw new Error("PROFILE_NOT_AVAILABLE");

        const [workResult, followerResult, followingResult] = await Promise.all([
          supabase.from("stories")
            .select("id,slug,title,synopsis,genre,language,cover_url,published_at")
            .eq("author_id", data.id).eq("status", "published").eq("visibility", "public")
            .order("published_at", { ascending: false }),
          supabase.from("author_follows").select("follower_id", { count: "exact" }).eq("author_id", data.id),
          supabase.from("author_follows").select("author_id", { count: "exact" }).eq("follower_id", data.id)
        ]);
        if (workResult.error) throw workResult.error;
        if (followerResult.error) throw followerResult.error;
        if (followingResult.error) throw followingResult.error;

        const workIds = (workResult.data ?? []).map((item: { id: string }) => item.id);
        let totalReads = 0;
        let totalVotes = 0;
        let totalRatings = 0;
        if (workIds.length) {
          const [readsResult, votesResult, ratingsResult] = await Promise.all([
            supabase.from("story_reads").select("id", { count: "exact" }).in("story_id", workIds),
            supabase.from("story_votes").select("id", { count: "exact" }).in("story_id", workIds),
            supabase.from("story_ratings").select("id", { count: "exact" }).in("story_id", workIds),
          ]);
          if (readsResult.error) throw readsResult.error;
          if (votesResult.error) throw votesResult.error;
          if (ratingsResult.error) throw ratingsResult.error;
          totalReads = readsResult.count ?? 0;
          totalVotes = votesResult.count ?? 0;
          totalRatings = ratingsResult.count ?? 0;
        }
        const followerIds = (followerResult.data ?? []).map((item: { follower_id: string }) => item.follower_id);
        let publicFollowers: Follower[] = [];
        const followingIds = (followingResult.data ?? []).map((item: { author_id: string }) => item.author_id);
        let publicFollowing: Following[] = [];
        if (followerIds.length) {
          const { data: followerProfiles, error: followerProfilesError } = await supabase.from("profiles")
            .select("id,username,display_name,avatar_url").in("id", followerIds).eq("is_public", true);
          if (followerProfilesError) throw followerProfilesError;
          publicFollowers = followerProfiles ?? [];
        }
        if (followingIds.length) {
          const { data: followingProfiles, error: followingProfilesError } = await supabase.from("profiles")
            .select("id,username,display_name,avatar_url").in("id", followingIds).eq("is_public", true);
          if (followingProfilesError) throw followingProfilesError;
          publicFollowing = followingProfiles ?? [];
        }

        let library: LibraryStory[] = [];
        if (data.show_library_on_profile) {
          const { data: items, error: libraryError } = await supabase.from("user_library")
            .select("id,story:stories(id,title,synopsis,genre,language)")
            .eq("user_id", data.id).order("updated_at", { ascending: false });
          if (libraryError) throw libraryError;
          library = (items ?? []).filter((item: LibraryStory) => item.story !== null);
        }
        if (active) {
          setProfile(data);
          setWorks(workResult.data ?? []);
          setFollowerCount(followerResult.count ?? followerIds.length);
          setFollowers(publicFollowers);
          setFollowing(publicFollowing);
          setFollowingCount(followingResult.count ?? followingIds.length);
          setReadCount(totalReads);
          setVoteCount(totalVotes);
          setRatingCount(totalRatings);
          setBooks(library);
        }
      } catch (e) {
        if (active) setError(e instanceof Error && e.message !== "PROFILE_NOT_AVAILABLE" ? e.message : "");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [username]);

  if (loading) return <div className="library-live-state"><LoaderCircle className="spin" size={20}/>{isEn ? "Loading profile…" : isEs ? "Cargando perfil…" : isPt ? "Carregando perfil…" : "Chargement du profil…"}</div>;
  if (!profile) return <div className="personal-library-empty"><UserRound size={25}/><h2>{words.unavailable}</h2><p>{words.private}</p><Link href="/explorer" className="primary-button">{words.explore}</Link></div>;

  return <div className="public-profile-page">
    <section className="public-profile-heading">
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span className="public-profile-avatar"><UserRound size={28}/></span>}
      <div className="public-profile-identity"><span className="catalogue-overline">{words.author}</span><h2>{profile.display_name || profile.username}</h2><p>@{profile.username}</p>{profile.bio && <div className="public-profile-bio">{profile.bio}</div>}
        <div className="public-profile-stats"><span><strong>{followerCount}</strong> {words.followers}</span><span><strong>{followingCount}</strong> {words.following}</span><span><strong>{works.length}</strong> {isEn ? "works" : isEs ? "obras" : isPt ? "obras" : "œuvres"}</span><span><strong>{readCount}</strong> {isEn ? "reads" : isEs ? "lecturas" : isPt ? "leituras" : "lectures"}</span><span><strong>{voteCount}</strong> {isEn ? "votes received" : isEs ? "votos" : isPt ? "votos" : "votes reçus"}</span><span><strong>{ratingCount}</strong> {isEn ? "ratings" : isEs ? "valoraciones" : isPt ? "avaliações" : "notes reçues"}</span></div>
        <AuthorFollowButton authorId={profile.id} onFollowChange={(delta: number) => setFollowerCount((count) => Math.max(0, count + delta))}/><ContentReportButton targetType="profile" targetId={profile.id}/>
      </div>
    </section>

    <section className="public-profile-works">
      <div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {words.works}</span><h2>{isEn ? "The author's stories." : isEs ? "Las historias del autor." : isPt ? "As histórias do autor." : "Les œuvres de cet auteur."}</h2></div><span className="shelf-index">{works.length} {isEn ? "WORKS" : isEs ? "OBRAS" : isPt ? "OBRAS" : "ŒUVRES"}</span></div>
      {works.length ? <div className="public-profile-work-grid">{works.map((work) => <Link href={`/histoire/${work.slug || work.id}`} className="public-profile-work" key={work.id}>
        <div className="public-profile-work-cover">{work.cover_url ? <img src={work.cover_url} alt="" loading="lazy"/> : <><BookOpen size={28}/><strong>{work.title}</strong></>}</div>
        <span className="public-profile-work-meta">{work.genre || "Book-A-Boo"} · {work.language.toUpperCase()}</span>
        <strong className="public-profile-work-title">{work.title}</strong>
        {work.synopsis && <p>{work.synopsis}</p>}
      </Link>)}</div> : <p className="explore-live-empty">{words.emptyWorks}</p>}
    </section>

    <section className="public-profile-followers">
      <div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {words.followers.toUpperCase()}</span><h2>{isEn ? "Readers following this author." : isEs ? "Lectores que siguen a este autor." : isPt ? "Leitores que seguem este autor." : "Les lecteurs qui suivent cet auteur."}</h2></div><span className="shelf-index">{followerCount}</span></div>
      {followers.length ? <div className="public-profile-follower-list">{followers.map((follower) => <Link href={`/u/${encodeURIComponent(follower.username)}`} className="public-profile-follower" key={follower.id}>
        {follower.avatar_url ? <img src={follower.avatar_url} alt="" loading="lazy"/> : <span><UserRound size={16}/></span>}
        <strong>{follower.display_name || follower.username}</strong><small>@{follower.username}</small>
      </Link>)}</div> : <p className="explore-live-empty">{isEn ? "No public follower to show yet." : isEs ? "Aún no hay seguidores públicos." : isPt ? "Ainda não há seguidores públicos para mostrar." : "Aucun abonné public à afficher pour le moment."}</p>}
      {followers.length < followerCount && <p className="public-profile-privacy-note">{isEn ? "Some followers have chosen to keep their profiles private." : isEs ? "Algunos seguidores han elegido mantener sus perfiles privados." : isPt ? "Alguns seguidores escolheram manter seus perfis privados." : "Certains abonnés ont choisi de garder leur profil privé."}</p>}
    </section>

    <section className="public-profile-following">
      <div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {words.following.toUpperCase()}</span><h2>{isEn ? "Authors followed by this reader." : isEs ? "Autores que sigue este lector." : isPt ? "Autores que este leitor segue." : "Les auteurs suivis par ce lecteur."}</h2></div><span className="shelf-index">{followingCount}</span></div>
      {following.length ? <div className="public-profile-follower-list">{following.map((member) => <Link href={"/u/" + encodeURIComponent(member.username)} className="public-profile-follower" key={member.id}>
        {member.avatar_url ? <img src={member.avatar_url} alt="" loading="lazy"/> : <span><UserRound size={16}/></span>}
        <strong>{member.display_name || member.username}</strong><small>@{member.username}</small>
      </Link>)}</div> : <p className="explore-live-empty">{isEn ? "This member is not following anyone publicly yet." : isEs ? "Este miembro aún no sigue a nadie públicamente." : isPt ? "Este membro ainda não segue ninguém publicamente." : "Ce membre ne suit encore personne publiquement."}</p>}
      {following.length < followingCount && <p className="public-profile-privacy-note">{isEn ? "Some followed members have private profiles." : isEs ? "Algunos perfiles seguidos son privados." : isPt ? "Alguns perfis seguidos são privados." : "Certains profils suivis sont privés."}</p>}
    </section>

    {profile.show_library_on_profile && <section className="public-profile-library"><div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> {words.library}</span><h2>{words.libraryTitle}</h2></div></div>
      {books.length ? <div className="public-profile-books">{books.map(item => item.story && <Link href={`/histoire/${item.story.id}`} className="public-profile-book" key={item.id}><BookOpen size={20}/><span><strong>{item.story.title}</strong><small>{item.story.genre || "Book-A-Boo"} · {item.story.language.toUpperCase()}</small></span><Bookmark size={15}/></Link>)}</div> : <p className="explore-live-empty">{words.emptyLibrary}</p>}
    </section>}
    {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
  </div>;
}
