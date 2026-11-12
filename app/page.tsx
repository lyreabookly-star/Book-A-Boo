import { ArrowRight, BookOpen, Compass, Feather, Globe2, Search, Sparkles } from "lucide-react";

const genres = ["Romance", "Fantasy", "Thriller", "Psychologie", "Drame", "Science-fiction", "Poésie", "Historique"];

const shelves = [
  { title: "Les heures silencieuses", author: "A. Mori", genre: "DRAME · CONTEMPORAIN", color: "plum", mark: "夜", description: "Certaines vérités n'apparaissent qu'au moment où le monde se tait." },
  { title: "Là où dansent les constellations", author: "Mina Sol", genre: "FANTASY · AVENTURE", color: "blue", mark: "✳", description: "Une cartographe découvre des chemins que le ciel avait oubliés." },
  { title: "Le goût des adieux", author: "Noah Éden", genre: "ROMANCE · SLOW BURN", color: "ochre", mark: "花", description: "Ils avaient promis de ne jamais revenir. La ville, elle, s'en souvient." },
];

export default function Home() {
  return (
    <main>
      <div className="announcement"><span className="announcement-dot" /> Un nouvel espace pour les histoires qui méritent d’être lues <span className="announcement-arrow">↗</span></div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Book-A-Boo accueil"><span className="brand-symbol">b.</span><span>book-a-boo<span className="brand-period">.</span></span></a>
        <nav className="main-nav"><a className="active" href="#decouvrir">Découvrir</a><a href="#genres">Genres</a><a href="#communaute">Communauté</a></nav>
        <div className="header-actions"><button className="icon-button" aria-label="Rechercher"><Search size={18}/></button><a className="login-link" href="#connexion">Connexion</a><a className="signup-button" href="#inscription">Rejoindre <ArrowRight size={15}/></a></div>
      </header>

      <section className="hero" id="decouvrir">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> LA LITTÉRATURE, SANS FRONTIÈRES</div>
          <h1>Il y a tout un<br/>monde <em>à lire.</em></h1>
          <p className="hero-description">Des histoires qui vous ressemblent. Des univers qui vous emportent. Un lieu pour lire, écrire et faire voyager les mots.</p>
          <div className="hero-buttons"><a href="#bibliotheque" className="primary-button">Explorer les histoires <ArrowRight size={17}/></a><a href="#ecrire" className="secondary-button"><Feather size={16}/> Je veux écrire</a></div>
          <div className="hero-note"><span className="reader-stack"><i>✦</i><i>文</i><i>é</i></span><span>Une communauté ouverte aux voix du monde entier.</span></div>
        </div>
        <div className="hero-art" aria-label="Composition éditoriale de livres"><div className="art-topline"><span>VOL. 01 — EVERY STORY MATTERS</span><span>EST. 2026</span></div><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-word word-one">imagine</div><div className="floating-word word-two">世界</div><div className="book book-back"><span>THE ART OF<br/>BECOMING</span><small>BOOK — 014</small></div><div className="book book-front"><div className="book-sun">✳</div><span>LES MOTS<br/>QU’ON GARDE</span><small>UNE HISTOIRE À DÉCOUVRIR</small></div><div className="art-caption"><span>01 / 03</span><span>Chaque page ouvre une porte.</span></div></div>
      </section>

      <section className="genre-strip" id="genres"><div className="strip-label"><Compass size={16}/> PARCOURIR PAR ENVIE</div><div className="genre-list">{genres.map((genre) => <a href="#bibliotheque" key={genre}>{genre}<span>↗</span></a>)}</div><a className="all-genres" href="#genres">Tous les genres <ArrowRight size={15}/></a></section>

      <section className="library-section" id="bibliotheque">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> LA BIBLIOTHÈQUE</div><h2>À la rencontre de<br/><em>votre prochaine histoire.</em></h2></div><a href="#bibliotheque" className="text-link">Voir toute la bibliothèque <ArrowRight size={16}/></a></div>
        <div className="book-grid">{shelves.map((book, index) => <article className="story-card" key={book.title}><div className={`cover cover-${book.color}`}><span className="cover-index">BAB / 00{index + 1}</span><span className="cover-mark">{book.mark}</span><span className="cover-title">{book.title}</span><span className="cover-author">{book.author}</span><span className="cover-bottom">BOOK-A-BOO EDITIONS</span></div><div className="story-meta"><span>{book.genre}</span><span>À DÉCOUVRIR</span></div><h3>{book.title}</h3><p>{book.description}</p><div className="story-byline">Une histoire de <strong>{book.author}</strong></div></article>)}</div>
        <div className="library-foot"><span>Une bibliothèque vivante, enrichie par ses lecteurs et ses auteurs.</span><a href="#inscription">Trouver votre prochaine lecture <ArrowRight size={15}/></a></div>
      </section>

      <section className="writer-banner" id="ecrire"><div className="writer-icon"><Feather size={24}/></div><div><div className="eyebrow">VOTRE HISTOIRE A SA PLACE ICI</div><h2>Les mondes que vous imaginez<br/><em>méritent d’exister.</em></h2><p>Publiez à votre rythme, construisez votre univers et trouvez vos premiers lecteurs.</p></div><a href="#inscription" className="writer-cta">Commencer à écrire <ArrowRight size={17}/></a><span className="banner-watermark">b.</span></section>

      <footer id="communaute"><a className="brand footer-brand" href="#"><span className="brand-symbol">b.</span><span>book-a-boo<span className="brand-period">.</span></span></a><span>Stories have no limits.</span><div className="footer-links"><a href="#decouvrir">Découvrir</a><a href="#genres">Genres</a><a href="#ecrire">Écrire</a><a href="#connexion">Connexion</a></div><span className="copyright">© 2026 BOOK-A-BOO</span></footer>
    </main>
  );
}