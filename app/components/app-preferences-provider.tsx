"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type Locale = "fr" | "en" | "es" | "pt";
type Theme = "light" | "dark";
type Preferences = { locale: Locale; theme: Theme };
const defaults: Preferences = { locale: "fr", theme: "light" };

const dictionary: Record<string, Record<Locale, string>> = {
  "Accueil": { fr:"Accueil", en:"Home", es:"Inicio", pt:"Início" },
  "Explorer": { fr:"Explorer", en:"Explore", es:"Explorar", pt:"Explorar" },
  "Écrire": { fr:"Écrire", en:"Write", es:"Escribir", pt:"Escrever" },
  "Profil": { fr:"Profil", en:"Profile", es:"Perfil", pt:"Perfil" },
  "Connexion": { fr:"Connexion", en:"Log in", es:"Iniciar sesión", pt:"Entrar" },
  "Rejoindre": { fr:"Rejoindre", en:"Join", es:"Unirse", pt:"Participar" },
  "VOTRE ESPACE PERSONNEL": { fr:"VOTRE ESPACE PERSONNEL", en:"YOUR PERSONAL SPACE", es:"TU ESPACIO PERSONAL", pt:"SEU ESPAÇO PESSOAL" },
  "VOS PRÉFÉRENCES PERSONNELLES": { fr:"VOS PRÉFÉRENCES PERSONNELLES", en:"YOUR PERSONAL PREFERENCES", es:"TUS PREFERENCIAS PERSONALES", pt:"SUAS PREFERÊNCIAS PESSOAIS" },
  "Retour au profil": { fr:"Retour au profil", en:"Back to profile", es:"Volver al perfil", pt:"Voltar ao perfil" },
  "Votre compte": { fr:"Votre compte", en:"Your account", es:"Tu cuenta", pt:"Sua conta" },
  "Les informations qui définissent votre présence sur Book-A-Boo.": { fr:"Les informations qui définissent votre présence sur Book-A-Boo.", en:"The details that shape your presence on Book-A-Boo.", es:"La información que define tu presencia en Book-A-Boo.", pt:"As informações que definem sua presença no Book-A-Boo." },
  "Prénom": { fr:"Prénom", en:"First name", es:"Nombre", pt:"Nome" },
  "Nom": { fr:"Nom", en:"Last name", es:"Apellido", pt:"Sobrenome" },
  "Pseudo": { fr:"Pseudo", en:"Username", es:"Nombre de usuario", pt:"Nome de usuário" },
  "Nom affiché": { fr:"Nom affiché", en:"Display name", es:"Nombre visible", pt:"Nome de exibição" },
  "Biographie": { fr:"Biographie", en:"Bio", es:"Biografía", pt:"Biografia" },
  "Enregistrer mon profil": { fr:"Enregistrer mon profil", en:"Save my profile", es:"Guardar mi perfil", pt:"Salvar meu perfil" },
  "Adresse e-mail": { fr:"Adresse e-mail", en:"Email address", es:"Correo electrónico", pt:"Endereço de e-mail" },
  "Nouvelle adresse e-mail": { fr:"Nouvelle adresse e-mail", en:"New email address", es:"Nueva dirección de correo", pt:"Novo endereço de e-mail" },
  "Modifier l'adresse": { fr:"Modifier l'adresse", en:"Update email", es:"Actualizar correo", pt:"Atualizar e-mail" },
  "Nouveau mot de passe": { fr:"Nouveau mot de passe", en:"New password", es:"Nueva contraseña", pt:"Nova senha" },
  "Changer le mot de passe": { fr:"Changer le mot de passe", en:"Change password", es:"Cambiar contraseña", pt:"Alterar senha" },
  "Apparence et langue": { fr:"Apparence et langue", en:"Appearance and language", es:"Apariencia e idioma", pt:"Aparência e idioma" },
  "Choisissez vos préférences de lecture et de navigation.": { fr:"Choisissez vos préférences de lecture et de navigation.", en:"Choose your reading and browsing preferences.", es:"Elige tus preferencias de lectura y navegación.", pt:"Escolha suas preferências de leitura e navegação." },
  "Thème de l'interface": { fr:"Thème de l'interface", en:"Interface theme", es:"Tema de la interfaz", pt:"Tema da interface" },
  "Clair ou sombre": { fr:"Clair ou sombre", en:"Light or dark", es:"Claro u oscuro", pt:"Claro ou escuro" },
  "Clair": { fr:"Clair", en:"Light", es:"Claro", pt:"Claro" },
  "Sombre": { fr:"Sombre", en:"Dark", es:"Oscuro", pt:"Escuro" },
  "Langue préférée": { fr:"Langue préférée", en:"Preferred language", es:"Idioma preferido", pt:"Idioma preferido" },
  "Votre choix est enregistré dans votre compte": { fr:"Votre choix est enregistré dans votre compte", en:"Your choice is saved to your account", es:"Tu elección se guarda en tu cuenta", pt:"Sua escolha é salva na sua conta" },
  "Français": { fr:"Français", en:"French", es:"Francés", pt:"Francês" },
  "English": { fr:"English", en:"English", es:"Inglés", pt:"Inglês" },
  "Español": { fr:"Español", en:"Spanish", es:"Español", pt:"Espanhol" },
  "Português": { fr:"Português", en:"Portuguese", es:"Portugués", pt:"Português" },
  "Enregistrer mes préférences": { fr:"Enregistrer mes préférences", en:"Save my preferences", es:"Guardar mis preferencias", pt:"Salvar minhas preferências" },
  "Ce que les autres voient": { fr:"Ce que les autres voient", en:"What others can see", es:"Lo que otros pueden ver", pt:"O que outras pessoas veem" },
  "Gardez le contrôle sur les informations visibles par les autres lecteurs.": { fr:"Gardez le contrôle sur les informations visibles par les autres lecteurs.", en:"Control what information other readers can see.", es:"Controla qué información pueden ver otros lectores.", pt:"Controle quais informações outros leitores podem ver." },
  "Profil public": { fr:"Profil public", en:"Public profile", es:"Perfil público", pt:"Perfil público" },
  "Afficher ma bibliothèque sur mon profil": { fr:"Afficher ma bibliothèque sur mon profil", en:"Show my library on my profile", es:"Mostrar mi biblioteca en mi perfil", pt:"Mostrar minha biblioteca no perfil" },
  "Enregistrer la confidentialité": { fr:"Enregistrer la confidentialité", en:"Save privacy settings", es:"Guardar privacidad", pt:"Salvar privacidade" },
  "Notifications": { fr:"Notifications", en:"Notifications", es:"Notificaciones", pt:"Notificações" },
  "Définissez vos préférences pour les futurs messages par e-mail.": { fr:"Définissez vos préférences pour les futurs messages par e-mail.", en:"Set your preferences for future email messages.", es:"Configura tus preferencias para futuros correos.", pt:"Defina suas preferências para futuros e-mails." },
  "Notifications par e-mail": { fr:"Notifications par e-mail", en:"Email notifications", es:"Notificaciones por correo", pt:"Notificações por e-mail" },
  "Nouveautés Book-A-Boo": { fr:"Nouveautés Book-A-Boo", en:"Book-A-Boo updates", es:"Novedades de Book-A-Boo", pt:"Novidades do Book-A-Boo" },
  "Enregistrer les notifications": { fr:"Enregistrer les notifications", en:"Save notifications", es:"Guardar notificaciones", pt:"Salvar notificações" },
  "Vos sessions": { fr:"Vos sessions", en:"Your sessions", es:"Tus sesiones", pt:"Suas sessões" },
  "Me déconnecter de tous les appareils": { fr:"Me déconnecter de tous les appareils", en:"Sign out of all devices", es:"Cerrar sesión en todos los dispositivos", pt:"Sair de todos os dispositivos" },
  "Votre profil,": { fr:"Votre profil,", en:"Your profile,", es:"Tu perfil,", pt:"Seu perfil," },
  "votre univers.": { fr:"votre univers.", en:"your world.", es:"tu universo.", pt:"seu universo." },
  "Votre univers vous attend.": { fr:"Votre univers vous attend.", en:"Your world is waiting.", es:"Tu universo te espera.", pt:"Seu universo está esperando." },
  "Connectez-vous ou créez un compte pour accéder à votre profil et à votre bibliothèque personnelle.": { fr:"Connectez-vous ou créez un compte pour accéder à votre profil et à votre bibliothèque personnelle.", en:"Log in or create an account to access your profile and personal library.", es:"Inicia sesión o crea una cuenta para acceder a tu perfil y biblioteca personal.", pt:"Entre ou crie uma conta para acessar seu perfil e sua biblioteca pessoal." },
  "Me connecter": { fr:"Me connecter", en:"Log in", es:"Iniciar sesión", pt:"Entrar" },
  "Créer un compte": { fr:"Créer un compte", en:"Create an account", es:"Crear una cuenta", pt:"Criar uma conta" },
  "Ma bibliothèque": { fr:"Ma bibliothèque", en:"My library", es:"Mi biblioteca", pt:"Minha biblioteca" },
  "Paramètres du compte ⚙": { fr:"Paramètres du compte ⚙", en:"Account settings ⚙", es:"Ajustes de cuenta ⚙", pt:"Configurações da conta ⚙" },
  "Me déconnecter": { fr:"Me déconnecter", en:"Log out", es:"Cerrar sesión", pt:"Sair" },
  "Chargement de votre espace…": { fr:"Chargement de votre espace…", en:"Loading your space…", es:"Cargando tu espacio…", pt:"Carregando seu espaço…" },
  "Chargement de vos réglages…": { fr:"Chargement de vos réglages…", en:"Loading your settings…", es:"Cargando tus ajustes…", pt:"Carregando suas configurações…" },
  "Explorer les histoires": { fr:"Explorer les histoires", en:"Explore stories", es:"Explorar historias", pt:"Explorar histórias" },
  "Je veux écrire": { fr:"Je veux écrire", en:"I want to write", es:"Quiero escribir", pt:"Quero escrever" },
  "Des histoires qui vous ressemblent. Des univers qui vous emportent. Un lieu pour lire, écrire et faire voyager les mots.": { fr:"Des histoires qui vous ressemblent. Des univers qui vous emportent. Un lieu pour lire, écrire et faire voyager les mots.", en:"Stories that speak to you. Worlds that sweep you away. A place to read, write, and let words travel.", es:"Historias que hablan de ti. Mundos que te llevan lejos. Un lugar para leer, escribir y dejar volar las palabras.", pt:"Histórias que combinam com você. Mundos que encantam. Um lugar para ler, escrever e deixar as palavras viajarem." },
  "Découvrir les œuvres": { fr:"Découvrir les œuvres", en:"Discover stories", es:"Descubrir obras", pt:"Descobrir obras" },
  "Chaque histoire ouvre un monde.": { fr:"Chaque histoire ouvre un monde.", en:"Every story opens a world.", es:"Cada historia abre un mundo.", pt:"Cada história abre um mundo." },
  "Commencer à écrire": { fr:"Commencer à écrire", en:"Start writing", es:"Empezar a escribir", pt:"Começar a escrever" },
  "Suivez votre": { fr:"Suivez votre", en:"Follow your", es:"Sigue tu", pt:"Siga sua" },
  "curiosité.": { fr:"curiosité.", en:"curiosity.", es:"curiosidad.", pt:"curiosidade." },
  "Quel monde vous": { fr:"Quel monde vous", en:"Which world", es:"¿Qué mundo", pt:"Qual mundo" },
  "appelle ?": { fr:"appelle ?", en:"calls to you?", es:"te llama?", pt:"chama você?" },
  "Personnalisez votre expérience et gardez le contrôle sur votre compte Book-A-Boo.": { fr:"Personnalisez votre expérience et gardez le contrôle sur votre compte Book-A-Boo.", en:"Personalize your experience and stay in control of your Book-A-Boo account.", es:"Personaliza tu experiencia y mantén el control de tu cuenta de Book-A-Boo.", pt:"Personalize sua experiência e mantenha o controle da sua conta Book-A-Boo." },
  "Votre profil et vos préférences sont enregistrés.": { fr:"Votre profil et vos préférences sont enregistrés.", en:"Your profile and preferences have been saved.", es:"Tu perfil y preferencias se han guardado.", pt:"Seu perfil e preferências foram salvos." },
  "Vos préférences sont enregistrées.": { fr:"Vos préférences sont enregistrées.", en:"Your preferences have been saved.", es:"Tus preferencias se han guardado.", pt:"Suas preferências foram salvas." },
};

function translateNode(value: string, locale: Locale) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  for (const entry of Object.values(dictionary)) {
    const source = entry.fr;
    if (trimmed === source) return value.replace(trimmed, entry[locale]);
    for (const lang of ["en", "es", "pt"] as const) {
      if (trimmed === entry[lang]) return value.replace(trimmed, entry[locale]);
    }
  }
  return value;
}

type LocaleContextValue = Preferences & { setLocale: (locale: Locale) => void; setTheme: (theme: Theme) => void };
const LocaleContext = createContext<LocaleContextValue>({ ...defaults, setLocale: () => {}, setTheme: () => {} });
export function useAppPreferences() { return useContext(LocaleContext); }

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);

  useEffect(() => {
    let alive = true;
    const storedLocale = localStorage.getItem("bab-locale") as Locale | null;
    const storedTheme = localStorage.getItem("bab-theme") as Theme | null;
    if (storedLocale && ["fr","en","es","pt"].includes(storedLocale)) setPreferences(p => ({...p, locale:storedLocale}));
    if (storedTheme && ["light","dark"].includes(storedTheme)) setPreferences(p => ({...p, theme:storedTheme}));
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("user_settings").select("theme,preferred_language").eq("user_id", user.id).maybeSingle();
        if (alive && data) setPreferences({ locale: data.preferred_language ?? "fr", theme: data.theme ?? "light" });
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.locale;
    localStorage.setItem("bab-locale", preferences.locale);
    localStorage.setItem("bab-theme", preferences.theme);
    const apply = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script,style,textarea,input,select,option,[data-no-translate]")) continue;
        const translated = translateNode(node.textContent ?? "", preferences.locale);
        if (translated !== node.textContent) node.textContent = translated;
      }
    };
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
    return () => observer.disconnect();
  }, [preferences]);

  const value = useMemo(() => ({
    ...preferences,
    setLocale: (locale: Locale) => setPreferences(p => ({ ...p, locale })),
    setTheme: (theme: Theme) => setPreferences(p => ({ ...p, theme })),
  }), [preferences]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
