import Link from "next/link";
import { ArrowDownRight, ArrowRight, Compass, Sparkles } from "lucide-react";
import { InteriorPage } from "../components/site-shell";
const genres=[
 {name:"Romance",note:"Les liens, les élans et les secondes chances",count:"01",tone:"rose"},
 {name:"Fantasy",note:"Des mondes à inventer, des règles à briser",count:"02",tone:"violet"},
 {name:"Drame",note:"Des émotions qui restent après la dernière page",count:"03",tone:"ochre"},
 {name:"Thriller",note:"Le frisson de ne pas tout savoir",count:"04",tone:"night"},
 {name:"Psychologie",note:"Explorer les nuances de l'esprit humain",count:"05",tone:"sage"},
 {name:"Fanfiction",note:"Retrouver des univers que l'on aime",count:"06",tone:"blue"},
 {name:"Poésie",note:"Quand quelques mots ouvrent un monde",count:"07",tone:"rose"},
 {name:"Science-fiction",note:"Imaginer ce qui n'existe pas encore",count:"08",tone:"night"},
 {name:"Horreur",note:"Frôler l'inconnu, page après page",count:"09",tone:"plum"},
 {name:"Historique",note:"Voyager à travers les époques",count:"10",tone:"ochre"},
 {name:"Littérature générale",note:"Des histoires inclassables et libres",count:"11",tone:"sage"}
];
export default function Explorer(){return <InteriorPage active="/explorer" eyebrow="TROUVER VOTRE PROCHAINE LECTURE" title={<>Suivez votre<br/><em>curiosité.</em></>} description="Un genre, une humeur, une envie soudaine. Partez d'un mot et laissez-vous surprendre par les univers de Book-A-Boo.">
 <div className="explore-feature"><div className="explore-feature-copy"><span className="catalogue-overline">LE POINT DE DÉPART</span><h2>Et si vous lisiez<br/>quelque chose de <em>différent ?</em></h2><p>Il suffit parfois d'un nouveau genre pour découvrir une histoire qui nous ressemble.</p><Link href="/bibliotheque" className="explore-feature-link">Parcourir les œuvres <ArrowRight size={16}/></Link></div><div className="explore-feature-art"><span className="explore-orbit explore-orbit-a"/><span className="explore-orbit explore-orbit-b"/><span className="explore-art-glyph">文</span><span className="explore-art-note">READ<br/>BEYOND<br/>THE KNOWN</span><span className="explore-art-index">BAB / EXPLORE 001</span></div></div>
 <div className="explore-section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> CHOISIR UNE DIRECTION</span><h2>Quel monde vous <em>appelle ?</em></h2></div><span className="shelf-index">11 UNIVERS</span></div>
 <div className="explore-genre-grid">{genres.map(g=><Link href="/bibliotheque" className={`explore-genre explore-${g.tone}`} key={g.name}><span className="explore-genre-number">{g.count}</span><div><h3>{g.name}</h3><p>{g.note}</p></div><ArrowDownRight size={19}/></Link>)}</div>
 <div className="explore-note"><Compass size={17}/><p><strong>La découverte se construit.</strong> Les genres sont présentés ici pour préparer l'exploration. Les filtres, recherches et recommandations personnalisées seront activés avec le catalogue connecté.</p></div>
 </InteriorPage>}
