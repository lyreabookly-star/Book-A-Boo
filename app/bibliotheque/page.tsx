import Link from "next/link";
import { ArrowRight, Bookmark, ChevronDown, SlidersHorizontal, Sparkles } from "lucide-react";
import { InteriorPage } from "../components/site-shell";

const shelves = [
 {title:"Les heures silencieuses",author:"A. Mori",genre:"DRAME · CONTEMPORAIN",color:"plum",mark:"夜",description:"Certaines vérités n'apparaissent qu'au moment où le monde se tait.",tag:"INTROSPECTIF",chapters:"12 chapitres"},
 {title:"Là où dansent les constellations",author:"Mina Sol",genre:"FANTASY · AVENTURE",color:"blue",mark:"✳",description:"Une cartographe découvre des chemins que le ciel avait oubliés.",tag:"MAGIE & DESTIN",chapters:"18 chapitres"},
 {title:"Le goût des adieux",author:"Noah Éden",genre:"ROMANCE · SLOW BURN",color:"ochre",mark:"花",description:"Ils avaient promis de ne jamais revenir. La ville, elle, s'en souvient.",tag:"SECONDE CHANCE",chapters:"9 chapitres"},
 {title:"Les jardins de verre",author:"L. Sora",genre:"FANTASY · POÉSIE",color:"sage",mark:"❋",description:"Dans une cité où les souvenirs fleurissent, une jeune femme cherche le sien.",tag:"UNIVERS ONIRIQUE",chapters:"14 chapitres"},
 {title:"À contre-jour",author:"Élia V.",genre:"ROMANCE · DRAME",color:"rose",mark:"☼",description:"Deux inconnus apprennent à se rencontrer au-delà de leurs silences.",tag:"CONTEMPORAIN",chapters:"7 chapitres"},
 {title:"La dernière fréquence",author:"N. Kader",genre:"THRILLER · SCIENCE-FICTION",color:"night",mark:"⌁",description:"Un signal traverse la nuit. Quelqu'un, quelque part, attend une réponse.",tag:"MYSTÈRE",chapters:"16 chapitres"}
];
const genres=["Tout","Romance","Fantasy","Drame","Thriller","Poésie","Science-fiction"];
export default function Bibliotheque(){
 return <InteriorPage active="/bibliotheque" eyebrow="LE CATALOGUE BOOK-A-BOO" title={<>La bibliothèque<br/><em>des possibles.</em></>} description="Des voix singulières, des mondes à explorer et des histoires à emporter avec soi. Trouvez la prochaine qui vous accompagnera.">
  <div className="catalogue-intro"><div><span className="catalogue-overline">LE PLAISIR DE SE PERDRE DANS LES PAGES</span><h2>Un rayon pour chaque <em>envie.</em></h2></div><div className="catalogue-count"><strong>06</strong><span>œuvres de démonstration</span></div></div>
  <div className="catalogue-toolbar"><div className="catalogue-search"><span>⌕</span><span>Rechercher un titre, un auteur…</span></div><button className="catalogue-filter"><SlidersHorizontal size={15}/> Filtres <ChevronDown size={14}/></button><span className="catalogue-sort">Trier : <strong>À découvrir</strong> <ChevronDown size={13}/></span></div>
  <div className="genre-chips">{genres.map((g,i)=><Link key={g} href="/explorer" className={i===0?"selected":""}>{g}</Link>)}</div>
  <div className="shelf-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> LA SÉLECTION</span><h2>À découvrir <em>maintenant.</em></h2></div><span className="shelf-index">01 — 06</span></div>
  <div className="catalogue-grid">{shelves.map((book,i)=><article className="catalogue-card" key={book.title}>
   <Link href="/oeuvre/les-heures-silencieuses" className={`catalogue-cover cover-${book.color}`}><span className="catalogue-cover-number">BAB / 00{i+1}</span><span className="catalogue-cover-mark">{book.mark}</span><span className="catalogue-cover-title">{book.title}</span><span className="catalogue-cover-author">{book.author}</span><span className="catalogue-cover-bottom">BOOK-A-BOO · FICTION</span></Link>
   <div className="catalogue-card-meta"><span>{book.genre}</span><span>{book.chapters}</span></div><Link href="/oeuvre/les-heures-silencieuses" className="catalogue-card-title">{book.title}</Link><p>{book.description}</p><div className="catalogue-card-foot"><span>{book.tag}</span><Bookmark size={15}/></div>
  </article>)}</div>
  <div className="catalogue-disclaimer"><Sparkles size={15}/><span>Ces fiches sont des exemples fictifs pour présenter le futur catalogue. Les œuvres réelles seront publiées par les membres.</span></div>
  <div className="catalogue-bottom-cta"><div><span className="catalogue-overline">VOUS AVEZ UNE HISTOIRE À PARTAGER ?</span><h2>Votre prochain chapitre<br/><em>peut commencer ici.</em></h2></div><Link href="/ecrire" className="primary-button">Découvrir l'espace auteur <ArrowRight size={16}/></Link></div>
 </InteriorPage>
}