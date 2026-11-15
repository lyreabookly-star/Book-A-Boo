import { InteriorPage } from "../components/site-shell";
import { PasswordRecoveryForm } from "../components/password-recovery-form";

export default function ReinitialiserMotDePasse() {
  return (
    <InteriorPage active="/profil" eyebrow="SÉCURISER VOTRE COMPTE" title={<>Choisissez votre<br /><em>nouveau mot de passe.</em></>} description="Créez un mot de passe personnel et sécurisé pour retrouver votre espace Book-A-Boo.">
      <PasswordRecoveryForm mode="reset" />
    </InteriorPage>
  );
}
