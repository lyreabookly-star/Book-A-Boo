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
  "Il y a tout un": { fr:"Il y a tout un", en:"There is a whole", es:"Hay todo un", pt:"Há todo um" },
  "monde ": { fr:"monde ", en:"world ", es:"mundo ", pt:"mundo " },
  "à lire.": { fr:"à lire.", en:"to read.", es:"por leer.", pt:"para ler." },
  "LA LITTÉRATURE, SANS FRONTIÈRES": { fr:"LA LITTÉRATURE, SANS FRONTIÈRES", en:"LITERATURE WITHOUT BORDERS", es:"LITERATURA SIN FRONTERAS", pt:"LITERATURA SEM FRONTEIRAS" },
  "Une communauté ouverte aux voix du monde entier.": { fr:"Une communauté ouverte aux voix du monde entier.", en:"A community open to voices from around the world.", es:"Una comunidad abierta a voces de todo el mundo.", pt:"Uma comunidade aberta a vozes do mundo inteiro." },
  "À LA UNE": { fr:"À LA UNE", en:"FEATURED", es:"DESTACADOS", pt:"EM DESTAQUE" },
  "Des histoires à": { fr:"Des histoires à", en:"Stories to", es:"Historias para", pt:"Histórias para" },
  "rencontrer.": { fr:"rencontrer.", en:"discover.", es:"descubrir.", pt:"descobrir." },
  "EXEMPLE": { fr:"EXEMPLE", en:"SAMPLE", es:"EJEMPLO", pt:"EXEMPLO" },
  "DRAME · CONTEMPORAIN": { fr:"DRAME · CONTEMPORAIN", en:"DRAMA · CONTEMPORARY", es:"DRAMA · CONTEMPORÁNEO", pt:"DRAMA · CONTEMPORÂNEO" },
  "FANTASY · AVENTURE": { fr:"FANTASY · AVENTURE", en:"FANTASY · ADVENTURE", es:"FANTASÍA · AVENTURA", pt:"FANTASIA · AVENTURA" },
  "ROMANCE · SLOW BURN": { fr:"ROMANCE · SLOW BURN", en:"ROMANCE · SLOW BURN", es:"ROMANCE · AMOR LENTO", pt:"ROMANCE · AMOR LENTO" },
  "Les heures silencieuses": { fr:"Les heures silencieuses", en:"The Silent Hours", es:"Las horas silenciosas", pt:"As horas silenciosas" },
  "Là où dansent les constellations": { fr:"Là où dansent les constellations", en:"Where the Constellations Dance", es:"Donde bailan las constelaciones", pt:"Onde dançam as constelações" },
  "Le goût des adieux": { fr:"Le goût des adieux", en:"The Taste of Goodbye", es:"El sabor de las despedidas", pt:"O sabor das despedidas" },
  "Certaines vérités n'apparaissent qu'au moment où le monde se tait.": { fr:"Certaines vérités n'apparaissent qu'au moment où le monde se tait.", en:"Some truths only emerge when the world falls silent.", es:"Algunas verdades solo aparecen cuando el mundo guarda silencio.", pt:"Algumas verdades só aparecem quando o mundo fica em silêncio." },
  "Une cartographe découvre des chemins que le ciel avait oubliés.": { fr:"Une cartographe découvre des chemins que le ciel avait oubliés.", en:"A cartographer discovers paths the sky had forgotten.", es:"Una cartógrafa descubre caminos que el cielo había olvidado.", pt:"Uma cartógrafa descobre caminhos que o céu havia esquecido." },
  "Ils avaient promis de ne jamais revenir. La ville, elle, s'en souvient.": { fr:"Ils avaient promis de ne jamais revenir. La ville, elle, s'en souvient.", en:"They had promised never to return. The city remembers.", es:"Habían prometido no volver jamás. La ciudad sí lo recuerda.", pt:"Eles prometeram nunca voltar. A cidade, porém, se lembra." },
  "Exemple d’œuvre — auteur fictif": { fr:"Exemple d’œuvre — auteur fictif", en:"Sample work — fictional author", es:"Obra de ejemplo — autor ficticio", pt:"Obra de exemplo — autor fictício" },
  "Des histoires portées par des voix du monde entier.": { fr:"Des histoires portées par des voix du monde entier.", en:"Stories told by voices from around the world.", es:"Historias contadas por voces de todo el mundo.", pt:"Histórias contadas por vozes do mundo inteiro." },
  "Explorer toutes les œuvres": { fr:"Explorer toutes les œuvres", en:"Explore all stories", es:"Explorar todas las obras", pt:"Explorar todas as obras" },
  "VOTRE HISTOIRE A SA PLACE ICI": { fr:"VOTRE HISTOIRE A SA PLACE ICI", en:"YOUR STORY BELONGS HERE", es:"TU HISTORIA TIENE UN LUGAR AQUÍ", pt:"SUA HISTÓRIA TEM LUGAR AQUI" },
  "Les mondes que vous imaginez": { fr:"Les mondes que vous imaginez", en:"The worlds you imagine", es:"Los mundos que imaginas", pt:"Os mundos que você imagina" },
  "méritent d’exister.": { fr:"méritent d’exister.", en:"deserve to exist.", es:"merecen existir.", pt:"merecem existir." },
  "Publiez à votre rythme, construisez votre univers et trouvez vos premiers lecteurs.": { fr:"Publiez à votre rythme, construisez votre univers et trouvez vos premiers lecteurs.", en:"Publish at your own pace, build your world, and find your first readers.", es:"Publica a tu ritmo, construye tu universo y encuentra a tus primeros lectores.", pt:"Publique no seu ritmo, construa seu universo e encontre seus primeiros leitores." },
  "Chaque page ouvre une porte.": { fr:"Chaque page ouvre une porte.", en:"Every page opens a door.", es:"Cada página abre una puerta.", pt:"Cada página abre uma porta." },
  "TROUVER VOTRE PROCHAINE LECTURE": { fr:"TROUVER VOTRE PROCHAINE LECTURE", en:"FIND YOUR NEXT READ", es:"ENCUENTRA TU PRÓXIMA LECTURA", pt:"ENCONTRE SUA PRÓXIMA LEITURA" },
  "Un genre, une humeur, une envie soudaine. Partez d'un mot et laissez-vous surprendre par les univers de Book-A-Boo.": { fr:"Un genre, une humeur, une envie soudaine. Partez d'un mot et laissez-vous surprendre par les univers de Book-A-Boo.", en:"A genre, a mood, a sudden craving. Start with a word and let Book-A-Boo's worlds surprise you.", es:"Un género, un estado de ánimo, un deseo repentino. Empieza con una palabra y déjate sorprender por los mundos de Book-A-Boo.", pt:"Um gênero, um estado de espírito, uma vontade repentina. Comece por uma palavra e deixe-se surpreender pelos universos do Book-A-Boo." },
  "LE POINT DE DÉPART": { fr:"LE POINT DE DÉPART", en:"THE STARTING POINT", es:"EL PUNTO DE PARTIDA", pt:"O PONTO DE PARTIDA" },
  "Et si vous lisiez": { fr:"Et si vous lisiez", en:"What if you read", es:"¿Y si leyeras", pt:"E se você lesse" },
  "quelque chose de ": { fr:"quelque chose de ", en:"something ", es:"algo ", pt:"algo " },
  "différent ?": { fr:"différent ?", en:"different?", es:"diferente?", pt:"diferente?" },
  "Il suffit parfois d'un nouveau genre pour découvrir une histoire qui nous ressemble.": { fr:"Il suffit parfois d'un nouveau genre pour découvrir une histoire qui nous ressemble.", en:"Sometimes a new genre is all it takes to find a story that feels like yours.", es:"A veces basta un nuevo género para descubrir una historia que se parece a ti.", pt:"Às vezes, basta um novo gênero para descobrir uma história que combina com você." },
  "Parcourir les œuvres": { fr:"Parcourir les œuvres", en:"Browse stories", es:"Explorar obras", pt:"Explorar obras" },
  "CHOISIR UNE DIRECTION": { fr:"CHOISIR UNE DIRECTION", en:"CHOOSE A DIRECTION", es:"ELIGE UN CAMINO", pt:"ESCOLHA UM CAMINHO" },
  "Quel monde vous ": { fr:"Quel monde vous ", en:"Which world ", es:"¿Qué mundo ", pt:"Qual mundo " },
  "11 UNIVERS": { fr:"11 UNIVERS", en:"11 WORLDS", es:"11 UNIVERSOS", pt:"11 UNIVERSOS" },
  "Les liens, les élans et les secondes chances": { fr:"Les liens, les élans et les secondes chances", en:"Connections, sparks, and second chances", es:"Los vínculos, los impulsos y las segundas oportunidades", pt:"Laços, impulsos e segundas chances" },
  "Des mondes à inventer, des règles à briser": { fr:"Des mondes à inventer, des règles à briser", en:"Worlds to invent, rules to break", es:"Mundos por inventar, reglas por romper", pt:"Mundos para inventar, regras para quebrar" },
  "Des émotions qui restent après la dernière page": { fr:"Des émotions qui restent après la dernière page", en:"Emotions that linger after the last page", es:"Emociones que permanecen tras la última página", pt:"Emoções que ficam depois da última página" },
  "Le frisson de ne pas tout savoir": { fr:"Le frisson de ne pas tout savoir", en:"The thrill of not knowing everything", es:"La emoción de no saberlo todo", pt:"A emoção de não saber tudo" },
  "Explorer les nuances de l'esprit humain": { fr:"Explorer les nuances de l'esprit humain", en:"Explore the nuances of the human mind", es:"Explorar los matices de la mente humana", pt:"Explorar as nuances da mente humana" },
  "Retrouver des univers que l'on aime": { fr:"Retrouver des univers que l'on aime", en:"Return to worlds we love", es:"Volver a los universos que amamos", pt:"Voltar aos universos que amamos" },
  "Quand quelques mots ouvrent un monde": { fr:"Quand quelques mots ouvrent un monde", en:"When a few words open a world", es:"Cuando unas pocas palabras abren un mundo", pt:"Quando algumas palavras abrem um mundo" },
  "Imaginer ce qui n'existe pas encore": { fr:"Imaginer ce qui n'existe pas encore", en:"Imagine what does not yet exist", es:"Imaginar lo que aún no existe", pt:"Imaginar o que ainda não existe" },
  "Frôler l'inconnu, page après page": { fr:"Frôler l'inconnu, page après page", en:"Brush against the unknown, page by page", es:"Rozar lo desconocido, página tras página", pt:"Tocar o desconhecido, página após página" },
  "Voyager à travers les époques": { fr:"Voyager à travers les époques", en:"Travel through the ages", es:"Viajar a través de las épocas", pt:"Viajar através das épocas" },
  "Des histoires inclassables et libres": { fr:"Des histoires inclassables et libres", en:"Unclassifiable stories without limits", es:"Historias inclasificables y libres", pt:"Histórias inclassificáveis e livres" },
  "La découverte se construit.": { fr:"La découverte se construit.", en:"Discovery takes shape.", es:"El descubrimiento se construye.", pt:"A descoberta se constrói." },
  "Les genres sont présentés ici pour préparer l'exploration. Les filtres, recherches et recommandations personnalisées seront activés avec le catalogue connecté.": { fr:"Les genres sont présentés ici pour préparer l'exploration. Les filtres, recherches et recommandations personnalisées seront activés avec le catalogue connecté.", en:"Genres are presented here to help you explore. Filters, search, and personalized recommendations will be enabled when the catalog is connected.", es:"Los géneros se presentan aquí para preparar la exploración. Los filtros, las búsquedas y las recomendaciones personalizadas estarán disponibles cuando se conecte el catálogo.", pt:"Os gêneros são apresentados aqui para orientar sua exploração. Filtros, buscas e recomendações personalizadas serão ativados quando o catálogo estiver conectado." },
  "VOTRE ESPACE DE LECTURE": { fr:"VOTRE ESPACE DE LECTURE", en:"YOUR READING SPACE", es:"TU ESPACIO DE LECTURA", pt:"SEU ESPAÇO DE LEITURA" },
  "Retrouvez ici les histoires que vous avez enregistrées, celles que vous lisez en ce moment et vos prochaines découvertes.": { fr:"Retrouvez ici les histoires que vous avez enregistrées, celles que vous lisez en ce moment et vos prochaines découvertes.", en:"Find the stories you've saved, the ones you're reading now, and your next discoveries here.", es:"Aquí encontrarás las historias que guardaste, las que estás leyendo y tus próximos descubrimientos.", pt:"Encontre aqui as histórias que salvou, as que está lendo agora e suas próximas descobertas." },
  "VOS LECTURES, AU MÊME ENDROIT": { fr:"VOS LECTURES, AU MÊME ENDROIT", en:"YOUR READING, ALL IN ONE PLACE", es:"TUS LECTURAS, EN UN SOLO LUGAR", pt:"SUAS LEITURAS, EM UM SÓ LUGAR" },
  "Une bibliothèque à ": { fr:"Une bibliothèque à ", en:"A library that reflects ", es:"Una biblioteca a ", pt:"Uma biblioteca à " },
  "votre image.": { fr:"votre image.", en:"you.", es:"tu medida.", pt:"sua imagem." },
  "Enregistrez une œuvre depuis sa fiche pour la retrouver facilement. Vous pourrez aussi choisir ce que vous souhaitez partager sur votre profil.": { fr:"Enregistrez une œuvre depuis sa fiche pour la retrouver facilement. Vous pourrez aussi choisir ce que vous souhaitez partager sur votre profil.", en:"Save a story from its page to find it easily later. You can also choose what to share on your profile.", es:"Guarda una obra desde su página para encontrarla fácilmente. También podrás elegir qué compartir en tu perfil.", pt:"Salve uma obra pela página dela para encontrá-la facilmente. Você também poderá escolher o que compartilhar no seu perfil." },
  "Visibilité réglable depuis votre profil": { fr:"Visibilité réglable depuis votre profil", en:"Visibility managed from your profile", es:"Visibilidad configurable desde tu perfil", pt:"Visibilidade ajustável no seu perfil" },
  "En cours": { fr:"En cours", en:"Currently reading", es:"En curso", pt:"Em andamento" },
  "Vos lectures commencées": { fr:"Vos lectures commencées", en:"Books you've started", es:"Tus lecturas empezadas", pt:"Suas leituras iniciadas" },
  "À lire": { fr:"À lire", en:"To read", es:"Por leer", pt:"Para ler" },
  "Vos livres enregistrés": { fr:"Vos livres enregistrés", en:"Your saved books", es:"Tus libros guardados", pt:"Seus livros salvos" },
  "Terminés": { fr:"Terminés", en:"Finished", es:"Terminados", pt:"Concluídos" },
  "Vos lectures achevées": { fr:"Vos lectures achevées", en:"Books you've finished", es:"Tus lecturas terminadas", pt:"Suas leituras concluídas" },
  "Lorsque vous enregistrerez une histoire, elle apparaîtra ici. Vous pourrez organiser vos lectures et retrouver votre progression.": { fr:"Lorsque vous enregistrerez une histoire, elle apparaîtra ici. Vous pourrez organiser vos lectures et retrouver votre progression.", en:"When you save a story, it will appear here. You can organize your reading and track your progress.", es:"Cuando guardes una historia, aparecerá aquí. Podrás organizar tus lecturas y seguir tu progreso.", pt:"Quando salvar uma história, ela aparecerá aqui. Você poderá organizar suas leituras e acompanhar seu progresso." },
  "Trouver une histoire": { fr:"Trouver une histoire", en:"Find a story", es:"Encontrar una historia", pt:"Encontrar uma história" },
  "La sauvegarde des livres, le suivi de lecture et le partage public de votre bibliothèque seront activés avec votre compte.": { fr:"La sauvegarde des livres, le suivi de lecture et le partage public de votre bibliothèque seront activés avec votre compte.", en:"Saving books, reading progress, and public library sharing will be enabled with your account.", es:"Guardar libros, seguir tu lectura y compartir tu biblioteca públicamente estarán disponibles con tu cuenta.", pt:"Salvar livros, acompanhar a leitura e compartilhar sua biblioteca publicamente serão ativados com sua conta." },

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
