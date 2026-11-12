import { InteriorPage } from "../components/site-shell";
import { AuthForm } from "../components/auth-form";

export default function Inscription() {
  return (
    <InteriorPage
      active="/profil"
      eyebrow="REJOINDRE BOOK-A-BOO"
      title={<>Votre place<br /><em>est ici.</em></>}
      description="Lecteur, lectrice, auteur ou autrice : chaque voix a sa place."
    >
      <AuthForm mode="signup" />
    </InteriorPage>
  );
}
