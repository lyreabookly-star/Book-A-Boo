import { InteriorPage } from "../components/site-shell";
import { AuthForm } from "../components/auth-form";

export default function Connexion() {
  return (
    <InteriorPage
      active="/profil"
      eyebrow="HEUREUX DE VOUS REVOIR"
      title={<>Retrouvons<br /><em>votre univers.</em></>}
      description="Connectez-vous pour retrouver vos lectures, vos histoires et votre espace personnel."
    >
      <AuthForm mode="login" />
    </InteriorPage>
  );
}
