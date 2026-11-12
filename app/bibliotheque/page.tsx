import Link from "next/link";
import { Bookmark, BookOpen, CheckCircle2, Clock3, LockKeyhole } from "lucide-react";
import { InteriorPage } from "../components/site-shell";

export default function Bibliotheque(){
 return <InteriorPage active="/profil" eyebrow="VOTRE ESPACE DE LECTURE" title={<>Votre bibliothèque<br/><em>personnelle.</em></>} description="Retrouvez ici les histoires que vous avez enregistrées, celles que vous lisez en ce moment et vos prochaines découvertes.">
  <div className="personal-library-intro">
    <div><span className="catalogue-overline">VOS LECTURES, AU MÊME ENDROIT</span><h2>Une bibliothèque à <em>votre image.</em></h2><p>Enregistrez une œuvre depuis sa fiche pour la retrouver facilement. Vous pourrez aussi choisir ce que vous souhaitez partager sur votre profil.</p></div>
    <div className="library-privacy"><LockKeyhole size={16}/><span>Visibilité réglable depuis votre profil</span></div>
  </div>
  <div className="personal-library-tabs">
    <div className="personal-library-tab"><BookOpen size={17}/><span><strong>En cours</strong><small>Vos lectures commencées</small></span></div>
    <div className="personal-library-tab"><Bookmark size={17}/><span><strong>À lire</strong><small>Vos livres enregistrés</small></span></div>
    <div className="personal-library-tab"><CheckCircle2 size={17}/><span><strong>Terminés</strong><small>Vos lectures achevées</small></span></div>
  </div>
  <div className="personal-library-empty"><span className="personal-library-empty-icon"><Bookmark size={25}/></span><h2>Votre bibliothèque vous attend.</h2><p>Lorsque vous enregistrerez une histoire, elle apparaîtra ici. Vous pourrez organiser vos lectures et retrouver votre progression.</p><Link href="/explorer" className="primary-button">Trouver une histoire</Link></div>
  <div className="personal-library-note"><Clock3 size={16}/><span>La sauvegarde des livres, le suivi de lecture et le partage public de votre bibliothèque seront activés avec votre compte.</span></div>
 </InteriorPage>
}
