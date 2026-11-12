import Link from "next/link";
import { ArrowRight, Bookmark, Share2 } from "lucide-react";
import { InteriorPage } from "../../components/site-shell";

export default function Oeuvre() {
  return (
    <InteriorPage
      active="/bibliotheque"
      eyebrow="FICHE DE LECTURE · ŒUVRE DE DÉMONSTRATION"
      title={<>Les heures<br /><em>silencieuses.</em></>}
      description="Une histoire sur les mots que l'on tait, les souvenirs qui persistent et les rencontres qui changent doucement une vie."
    >
      <div className="work-detail-layout">
        <aside className="work-cover-wrap">
          <div className="work-cover">
            <span className="work-cover-top">BOOK-A-BOO · FICTION</span>
            <span className="work-cover-symbol">夜</span>
            <span className="work-cover-title">LES HEURES<br />SILENCIEUSES</span>
            <span className="work-cover-author">A. MORI</span>
            <span className="work-cover-bottom">UNE HISTOIRE À DÉCOUVRIR</span>
          </div>
          <span className="work-cover-caption">VISUEL DE COUVERTURE FICTIF</span>
        </aside>
        <section className="work-detail-copy">
          <span className="work-category">DRAME · CONTEMPORAIN</span>
          <h2>Il y a des silences<br />qui racontent <em>tout.</em></h2>
          <p className="work-lead">Depuis son retour dans la ville où elle a grandi, Hana évite les rues familières et les conversations qui commencent par « tu te souviens ? ». Jusqu'au jour où une lettre oubliée l'oblige à regarder son passé autrement.</p>
          <div className="work-author-row">
            <span className="work-author-avatar">A</span>
            <span><strong>A. Mori</strong><small>Auteur·ice de Book-A-Boo · Profil de démonstration</small></span>
          </div>
          <div className="work-stats">
            <span><strong>12</strong> chapitres</span>
            <span><strong>~ 3 h</strong> de lecture</span>
            <span><strong>Terminée</strong> statut</span>
          </div>
          <div className="work-actions">
            <Link href="/oeuvre/les-heures-silencieuses/lecture" className="primary-button">Commencer la lecture <ArrowRight size={16} /></Link>
            <button className="work-icon-button" aria-label="Ajouter à ma bibliothèque"><Bookmark size={17} /></button>
            <button className="work-icon-button" aria-label="Partager"><Share2 size={17} /></button>
          </div>
          <div className="work-tags"><span>Famille</span><span>Seconde chance</span><span>Secrets</span><span>Émotions</span></div>
          <div className="work-content-note">
            <span className="catalogue-overline">À PROPOS DE CETTE ŒUVRE</span>
            <p>Cette fiche et son résumé sont fictifs. Ils servent à présenter le futur espace de lecture et ne correspondent pas à une publication réelle.</p>
          </div>
        </section>
      </div>
      <div className="work-excerpt">
        <span className="eyebrow"><span className="eyebrow-line" /> UN AVANT-GOÛT</span>
        <h2>Quelques lignes pour<br /><em>entrer dans l'histoire.</em></h2>
        <p>La pluie avait cessé avant l'aube. Sur le rebord de la fenêtre, les gouttes dessinaient encore des chemins irréguliers dans la poussière. Hana posa la lettre sur la table, sans l'ouvrir. Elle connaissait déjà l'écriture. C'était peut-être cela, le plus difficile.</p>
        <Link href="/oeuvre/les-heures-silencieuses/lecture">Lire le premier chapitre <ArrowRight size={15} /></Link>
      </div>
    </InteriorPage>
  );
}
