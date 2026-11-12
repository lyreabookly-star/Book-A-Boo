import Link from "next/link";
import { BookOpen, Camera, Heart, LockKeyhole, Settings2, UserRound, Users } from "lucide-react";
import { InteriorPage } from "../components/site-shell";

export default function Profil() {
  return (
    <InteriorPage
      active="/profil"
      eyebrow="VOTRE ESPACE PERSONNEL"
      title={<>Votre profil,<br /><em>votre univers.</em></>}
      description="Un espace à votre image, pour présenter votre identité littéraire, retrouver vos lectures et partager vos histoires."
    >
      <div className="profile-preview">
        <div className="profile-preview-top">
          <span className="profile-kicker">APERÇU DU PROFIL MEMBRE</span>
          <span className="profile-private"><LockKeyhole size={13} /> Vos informations privées restent privées</span>
        </div>
        <div className="profile-identity">
          <div className="profile-avatar-placeholder"><UserRound size={35} strokeWidth={1.2} /><span><Camera size={13} /> Photo ou avatar</span></div>
          <div className="profile-identity-copy">
            <span className="profile-handle">@votre_pseudo</span>
            <h2>Votre nom public</h2>
            <p>Votre biographie pourra raconter votre rapport aux mots, vos univers préférés ou simplement quelques mots sur vous.</p>
            <div className="profile-counts"><span><strong>0</strong> histoires</span><span><strong>0</strong> abonnés</span><span><strong>0</strong> abonnements</span></div>
          </div>
        </div>
        <div className="profile-tabs"><span className="selected"><BookOpen size={15}/> Publications</span><span><Heart size={15}/> Bibliothèque</span><span><Users size={15}/> Abonnements</span></div>
        <div className="profile-empty"><BookOpen size={24} /><strong>Votre univers littéraire prendra vie ici.</strong><p>Vos histoires publiées et vos lectures apparaîtront dans cet espace.</p></div>
      </div>

      <div className="profile-details-grid">
        <article className="profile-detail"><span className="profile-detail-icon"><UserRound size={18}/></span><div><h3>Votre identité</h3><p>Prénom et nom pour votre compte, pseudonyme unique pour être reconnu dans la communauté.</p></div></article>
        <article className="profile-detail"><span className="profile-detail-icon"><Camera size={18}/></span><div><h3>Votre image</h3><p>Choisissez une photo dans la galerie de votre téléphone ou utilisez un avatar de la collection gratuite.</p></div></article>
        <article className="profile-detail"><span className="profile-detail-icon"><Settings2 size={18}/></span><div><h3>À votre rythme</h3><p>Modifiez votre photo, votre biographie et vos informations quand vous le souhaitez.</p></div></article>
      </div>

      <div className="notice-panel profile-notice"><strong>Votre espace est en préparation.</strong><p>La création de compte, l’édition du profil et l’envoi de photo seront activés avec Supabase. Cette page de présentation ne collecte aucune donnée pour le moment.</p><Link href="/inscription">Découvrir l’inscription →</Link></div>
    </InteriorPage>
  );
}
