import Link from "next/link";
import { BookOpen, Compass, Feather, House, UserRound, LogIn } from "lucide-react";

const items = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/bibliotheque", label: "Bibliothèque", icon: BookOpen },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/ecrire", label: "Écrire", icon: Feather },
  { href: "/profil", label: "Profil", icon: UserRound },
];

export function SiteHeader({ active = "/" }: { active?: string }) {
  return <>
    <header className="site-header site-header-app">
      <Link className="brand" href="/" aria-label="Book-A-Boo accueil"><img className="brand-logo" src="/book-a-boo-logo.svg" alt="Book-A-Boo" /></Link>
      <nav className="main-nav" aria-label="Navigation principale">
        {items.map(item => <Link key={item.href} className={active === item.href ? "active" : ""} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="header-actions"><Link className="login-link" href="/connexion"><LogIn size={15}/> Connexion</Link><Link className="signup-button" href="/inscription">Rejoindre <span>→</span></Link></div>
    </header>
    <nav className="mobile-nav" aria-label="Navigation mobile">
      {items.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={active === item.href ? "active" : ""}><Icon size={19}/><span>{item.label}</span></Link>; })}
    </nav>
  </>;
}

export function InteriorPage({ active, eyebrow, title, description, children }: { active: string; eyebrow: string; title: React.ReactNode; description: string; children?: React.ReactNode }) {
  return <main className="app-page"><SiteHeader active={active}/><section className="interior-hero"><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1><p>{description}</p></section><section className="interior-content">{children}</section><footer className="app-footer"><Link href="/">Book-A-Boo</Link><span>Chaque histoire ouvre un monde.</span><span>© 2026 BOOK-A-BOO</span></footer></main>;
}
