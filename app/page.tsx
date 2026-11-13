import { ArrowRight, Feather } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "./components/site-shell";
import { ExploreStories } from "./components/explore-stories";

export default function Home() {
 return <main>
  <SiteHeader active="/"/>
  <section className="hero" id="decouvrir"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> LA LITTÉRATURE, SANS FRONTIÈRES</div><h1>Il y a tout un<br/>monde <em>à lire.</em></h1><p className="hero-description">Des histoires qui vous ressemblent. Des univers qui vous emportent. Un lieu pour lire, écrire et faire voyager les mots.</p><div className="hero-buttons"><Link href="/explorer" className="primary-button">Explorer les histoires <ArrowRight size={17}/></Link><Link href="/ecrire" className="secondary-button"><Feather size={16}/> Je veux écrire</Link></div><div className="hero-note"><span className="reader-stack"><i>✦</i><i>文</i><i>é</i></span><span>Une communauté ouverte aux voix du monde entier.</span></div></div>
  <div className="hero-art" aria-label="Composition éditoriale Book-A-Boo"><div className="art-topline"><span>UNIVERS DE LECTURE</span><span>BOOK-A-BOO</span></div><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-word word-one">imagine</div><div className="floating-word word-two">世界</div><div className="book book-back"><span>LIRE<br/>IMAGINER</span><small>BOOK-A-BOO</small></div><div className="book book-front"><div className="book-sun">✳</div><span className="cover-title">DES MOTS<br/>DES MONDES</span><small>LIRE · ÉCRIRE · PARTAGER</small></div><div className="art-caption"><span>BOOK / A / BOO</span><span>Chaque page ouvre une porte.</span></div></div></section>
  <ExploreStories />
  <section className="writer-banner" id="ecrire"><div className="writer-icon"><Feather size={24}/></div><div><div className="eyebrow">VOTRE HISTOIRE A SA PLACE ICI</div><h2>Les mondes que vous imaginez<br/><em>méritent d’exister.</em></h2><p>Publiez à votre rythme, construisez votre univers et trouvez vos premiers lecteurs.</p></div><Link href="/ecrire" className="writer-cta">Commencer à écrire <ArrowRight size={17}/></Link><span className="banner-watermark">b.</span></section>
  <footer id="communaute"><Link className="brand footer-brand" href="/"><img className="brand-logo" src="/book-a-boo-logo.svg" alt="Book-A-Boo"/></Link><span>Chaque histoire ouvre un monde.</span></footer>
 </main>;
}
