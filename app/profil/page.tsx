import { InteriorPage } from "../components/site-shell";
import { ProfileAccount } from "../components/profile-account";

export default function Profil() {
  return (
    <InteriorPage
      active="/profil"
      eyebrow="VOTRE ESPACE PERSONNEL"
      title={<>Votre profil,<br /><em>votre univers.</em></>}
      description="Retrouvez votre identité littéraire, vos histoires et les lectures que vous choisissez de partager."
    >
      <ProfileAccount />
    </InteriorPage>
  );
}
