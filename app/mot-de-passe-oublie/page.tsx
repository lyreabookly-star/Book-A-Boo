import { InteriorPage } from "../components/site-shell";
import { PasswordRecoveryForm } from "../components/password-recovery-form";

export default function MotDePasseOublie() {
  return (
    <InteriorPage active="/profil" eyebrow="RÉCUPÉRER VOTRE COMPTE" title={<>Un nouveau départ,<br /><em>en toute sécurité.</em></>} description="Indiquez l’adresse e-mail associée à votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.">
      <PasswordRecoveryForm mode="request" />
    </InteriorPage>
  );
}
