export interface LearnerLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
];

/** Where the learner is standing, named in English and in the target language. */
export interface PlaceInfo {
  zone: "cafe" | "bus_stop" | "taxi" | "barber";
  label: string;
  targetLabel: string;
  icon: string;
}

const PLACE_LABELS: Record<string, { label: string; icon: string; target: Record<string, string> }> = {
  cafe: {
    label: "Coffee Shop",
    icon: "☕",
    target: {
      en: "Coffee Shop",
      es: "La cafetería",
      ja: "カフェ",
      hi: "कैफ़े",
      fr: "Le café",
      it: "Il caffè",
      de: "Das Café",
      te: "కేఫ్",
    },
  },
  bus_stop: {
    label: "Bus Stop",
    icon: "🚌",
    target: {
      en: "Bus Stop",
      es: "La parada de autobús",
      ja: "バス停",
      hi: "बस स्टॉप",
      fr: "L'arrêt de bus",
      it: "La fermata del bus",
      de: "Die Bushaltestelle",
      te: "బస్ స్టాప్",
    },
  },
  taxi: {
    label: "Taxi Stand",
    icon: "🚕",
    target: {
      en: "Taxi Stand",
      es: "La estación de taxis",
      ja: "タクシー乗り場",
      hi: "टैक्सी स्टैंड",
      fr: "La station de taxis",
      it: "La stazione dei taxi",
      de: "Die Taxistation",
      te: "టాక్సీ స్టాండ్",
    },
  },
  barber: {
    label: "Barber Shop",
    icon: "💈",
    target: {
      en: "Barber Shop",
      es: "La peluquería",
      ja: "床屋",
      hi: "नाई की दुकान",
      fr: "Le salon de coiffure",
      it: "Il barbiere",
      de: "Der Friseursalon",
      te: "క్షురకుని దుకాణం",
    },
  },
};

/**
 * "This is the Coffee Shop" — English label for the banner, plus the same place
 * named in the language being practised. Falls back the same way dialogue does
 * (unknown language code → Spanish).
 */
export function getPlaceInfo(zone: string, targetLang: string): PlaceInfo {
  const zoneKey = zone.includes("barber")
    ? "barber"
    : zone.includes("bus")
    ? "bus_stop"
    : zone.includes("taxi") || zone.includes("cab")
    ? "taxi"
    : "cafe";
  const langKey = targetLang in SCENARIOS ? targetLang : "es";
  const entry = PLACE_LABELS[zoneKey];
  return {
    zone: zoneKey as PlaceInfo["zone"],
    label: entry.label,
    targetLabel: entry.target[langKey] ?? entry.target.en,
    icon: entry.icon,
  };
}

export interface BilingualDialogueOptions {
  targetLang: string; // The language user wants to practice (e.g. 'es', 'te', 'ja')
  nativeLang: string; // The language user is comfortable in (e.g. 'ja', 'en', 'hi')
  zone: string; // 'cafe' | 'bus_stop' | 'airport'
  stepIndex?: number;
}

export interface BilingualDialogue {
  npcName: string;
  npcRole: string;
  npcAvatarColor: string;
  levelLabel: string;
  stepProgress: string;
  totalSteps: number;
  currentStep: number;
  objective: string;
  targetLangName: string;
  npcTargetText: string;
  npcPhonetics: string;
  npcNativeTranslation: string;
  userSuggestedTarget: string;
  userSuggestedPhonetics: string;
  userSuggestedNative: string;
}

interface StepData {
  objective: string;
  npcTarget: string;
  npcPhonetic: string;
  npcTranslations: Record<string, string>;
  userTarget: string;
  userPhonetic: string;
  userTranslations: Record<string, string>;
}

interface ScenarioData {
  npcName: string;
  npcRole: string;
  avatarColor: string;
  levelLabel: string;
  targetLangName: string;
  steps: StepData[];
}

const SCENARIOS: Record<string, Record<string, ScenarioData>> = {
  // --- HINDI TARGET LANGUAGE (India) ---
  hi: {
    cafe: {
      npcName: "Raju",
      npcRole: "Chaiwala",
      avatarColor: "#ea580c",
      levelLabel: "LEVEL 1/3 · BEGINNER",
      targetLangName: "हिन्दी",
      steps: [
        {
          objective: "Order a hot cup of masala chai.",
          npcTarget: "नमस्ते! क्या लेंगे आप?",
          npcPhonetic: "Namaste! Kya lenge aap?",
          npcTranslations: {
            en: "Hello! What will you have?",
            ja: "こんにちは！何になさいますか？",
            es: "¡Hola! ¿Qué desea tomar?",
            fr: "Bonjour ! Que voulez-vous ?",
            de: "Hallo! Was darf es sein?",
            it: "Ciao! Cosa desidera?",
            hi: "नमस्ते! क्या लेंगे आप?",
          },
          userTarget: "मसाला चाय, कृपया।",
          userPhonetic: "Masala chai, kripya.",
          userTranslations: {
            en: "Masala tea, please.",
            ja: "マサラチャイをお願いします。",
            es: "Té masala, por favor.",
            fr: "Thé masala, s'il vous plaît.",
            de: "Masala-Tee, bitte.",
            it: "Tè masala, per favore.",
            hi: "मसाला चाय, कृपया।",
          },
        },
        {
          objective: "Ask for less sugar in the chai.",
          npcTarget: "चीनी कितनी डालूँ?",
          npcPhonetic: "Cheeni kitni daaloon?",
          npcTranslations: {
            en: "How much sugar should I add?",
            ja: "砂糖はどれくらい入れますか？",
            es: "¿Cuánto azúcar le pongo?",
            fr: "Combien de sucre dois-je mettre ?",
            de: "Wie viel Zucker möchten Sie?",
            it: "Quanto zucchero metto?",
            hi: "चीनी कितनी डालूँ?",
          },
          userTarget: "कम चीनी, कृपया।",
          userPhonetic: "Kam cheeni, kripya.",
          userTranslations: {
            en: "Less sugar, please.",
            ja: "砂糖少なめで。",
            es: "Poco azúcar, por favor.",
            fr: "Peu de sucre, s'il vous plaît.",
            de: "Wenig Zucker, bitte.",
            it: "Poco zucchero, per favore.",
            hi: "कम चीनी, कृपया।",
          },
        },
      ],
    },
    bus_stop: {
      npcName: "Suresh",
      npcRole: "Bus Conductor",
      avatarColor: "#0284c7",
      levelLabel: "LEVEL 2/3 · INTERMEDIATE",
      targetLangName: "हिन्दी",
      steps: [
        {
          objective: "Tell the conductor your stop and buy a ticket.",
          npcTarget: "कहाँ की टिकट चाहिए?",
          npcPhonetic: "Kahan ki ticket chahiye?",
          npcTranslations: {
            en: "Where do you need a ticket to?",
            ja: "どちらまでの切符が必要ですか？",
            es: "¿Para dónde necesita boleto?",
            fr: "Un billet pour où ?",
            de: "Wohin möchten Sie das Ticket?",
            it: "Per dove le serve il biglietto?",
            hi: "कहाँ की टिकट चाहिए?",
          },
          userTarget: "कनाट प्लेस, कृपया।",
          userPhonetic: "Connaught Place, kripya.",
          userTranslations: {
            en: "To Connaught Place, please.",
            ja: "コンノートプレイスまでお願いします。",
            es: "A Connaught Place, por favor.",
            fr: "À Connaught Place, s'il vous plaît.",
            de: "Nach Connaught Place, bitte.",
            it: "A Connaught Place, per favore.",
            hi: "कनाट प्लेस, कृपया।",
          },
        },
      ],
    },
    airport: {
      npcName: "Pooja",
      npcRole: "Airport Agent",
      avatarColor: "#7c3aed",
      levelLabel: "LEVEL 3/3 · ADVANCED",
      targetLangName: "हिन्दी",
      steps: [
        {
          objective: "Check your flight boarding gate.",
          npcTarget: "कृपया अपना टिकट और पहचान पत्र दिखाइए।",
          npcPhonetic: "Kripya apna ticket aur pehchan patra dikhaiye.",
          npcTranslations: {
            en: "Please show your ticket and ID card.",
            ja: "航空券と身分証明書を見せてください。",
            es: "Por favor muestre su boleto e identificación.",
            fr: "Veuillez montrer votre billet et pièce d'identité.",
            de: "Bitte zeigen Sie Ihr Ticket und Ihren Ausweis.",
            it: "Mostri il biglietto e il documento d'identità, per favore.",
            hi: "कृपया अपना टिकट और पहचान पत्र दिखाइए।",
          },
          userTarget: "गेट कौन सा है?",
          userPhonetic: "Gate kaun sa hai?",
          userTranslations: {
            en: "Which is the boarding gate?",
            ja: "搭乗ゲートはどこですか？",
            es: "¿Cuál es la puerta de embarque?",
            fr: "Quelle est la porte d'embarquement ?",
            de: "Welches ist das Flugsteigtor?",
            it: "Qual è il gate d'imbarco?",
            hi: "गेट कौन सा है?",
          },
        },
      ],
    },
    taxi: {
      npcName: "Rajesh",
      npcRole: "Cab Driver",
      avatarColor: "#facc15",
      levelLabel: "LEVEL 2/3 · INTERMEDIATE",
      targetLangName: "हिन्दी",
      steps: [
        {
          objective: "Ask the cab driver to take you to the airport in Hindi.",
          npcTarget: "नमस्ते! कहाँ चलना है?",
          npcPhonetic: "Namaste! Kahan chalna hai?",
          npcTranslations: {
            en: "Hello! Where do you want to go?",
            ja: "こんにちは！どこへ行きますか？",
            es: "¡Hola! ¿A dónde quiere ir?",
            fr: "Bonjour ! Où voulez-vous aller ?",
            de: "Hallo! Wohin möchten Sie fahren?",
            it: "Ciao! Dove vuole andare?",
            hi: "नमस्ते! कहाँ चलना है?",
          },
          userTarget: "हवाई अड्डे, कृपया।",
          userPhonetic: "Hawai adde, kripya.",
          userTranslations: {
            en: "To the airport, please.",
            ja: "空港までお願いします。",
            es: "Al aeropuerto, por favor.",
            fr: "À l'aéroport, s'il vous plaît.",
            de: "Zum Flughafen, bitte.",
            it: "All'aeroporto, per favore.",
            hi: "हवाई अड्डे, कृपया।",
          },
        },
      ],
    },
  },

  // --- TELUGU TARGET LANGUAGE (Matches screenshot!) ---
  te: {
    bus_stop: {
      npcName: "Srinivas",
      npcRole: "Conductor",
      avatarColor: "#0284c7",
      levelLabel: "LEVEL 4/4 · HARD LESSON",
      targetLangName: "తెలుగు",
      steps: [
        {
          objective: "Buy a ticket to Golconda. Name the stop and ask the fare.",
          npcTarget: "ఎక్కడికి?",
          npcPhonetic: "Ekkadiki?",
          npcTranslations: {
            en: "Where to?",
            ja: "どちらまでですか？",
            hi: "कहाँ जाना है?",
            es: "¿A dónde vas?",
            fr: "Où allez-vous ?",
            de: "Wohin möchten Sie?",
            it: "Dove sei diretto?",
          },
          userTarget: "Golconda",
          userPhonetic: "Golconda",
          userTranslations: {
            en: "Golconda",
            ja: "ゴルコンダまで",
            hi: "गोलकुंडा",
            es: "A Golconda",
            fr: "À Golconda",
            de: "Nach Golconda",
            it: "A Golconda",
          },
        },
        {
          objective: "Ask for the ticket price in Telugu.",
          npcTarget: "ఇరవై రూపాయలు అవుతుంది.",
          npcPhonetic: "Iravai roopaayalu avuthundi.",
          npcTranslations: {
            en: "It will be twenty rupees.",
            ja: "20ルピーになります。",
            hi: "बीस रुपये लगेंगे।",
            es: "Son veinte rupias.",
            fr: "Ça fera vingt roupies.",
            de: "Das macht zwanzig Rupien.",
            it: "Sono venti rupie.",
          },
          userTarget: "ఇదిగోండి డబ్బులు.",
          userPhonetic: "Idigondi dabbulu.",
          userTranslations: {
            en: "Here is the money.",
            ja: "お金です。",
            hi: "यह रहे पैसे।",
            es: "Aquí tiene el dinero.",
            fr: "Voici l'argent.",
            de: "Hier ist das Geld.",
            it: "Ecco i soldi.",
          },
        },
      ],
    },
    cafe: {
      npcName: "Ramana",
      npcRole: "Chaiwala",
      avatarColor: "#d97706",
      levelLabel: "LEVEL 1/3 · EASY LESSON",
      targetLangName: "తెలుగు",
      steps: [
        {
          objective: "Order a hot Irani chai with sugar.",
          npcTarget: "ఏం కావాలి బాబు?",
          npcPhonetic: "Eym kaavaali baabu?",
          npcTranslations: {
            en: "What would you like, friend?",
            ja: "何をご注文ですか？",
            hi: "क्या चाहिए भाई?",
            es: "¿Qué desea tomar, amigo?",
          },
          userTarget: "ఇరానీ చాయ్ ఇవ్వండి.",
          userPhonetic: "Iraanee chaay ivvandi.",
          userTranslations: {
            en: "Give me Irani chai.",
            ja: "イラニチャイをください。",
            hi: "ईरानी चाय दीजिए।",
            es: "Un té Irani, por favor.",
          },
        },
      ],
    },
    airport: {
      npcName: "Anitha",
      npcRole: "Gate Agent",
      avatarColor: "#4f46e5",
      levelLabel: "LEVEL 2/3 · INTERMEDIATE",
      targetLangName: "తెలుగు",
      steps: [
        {
          objective: "Check your flight boarding status.",
          npcTarget: "మీ బోర్డింగ్ పాస్ చూపించండి.",
          npcPhonetic: "Mee boarding pass choopinchandi.",
          npcTranslations: {
            en: "Please show your boarding pass.",
            ja: "搭乗券を見せてください。",
            hi: "कृपया अपना बोर्डिंग पास दिखाइए।",
            es: "Muestre su tarjeta de embarque, por favor.",
          },
          userTarget: "ఇదిగోండి నా పాస్.",
          userPhonetic: "Idigondi naa pass.",
          userTranslations: {
            en: "Here is my pass.",
            ja: "こちらが私のパスです。",
            hi: "यह रहा मेरा पास।",
            es: "Aquí tiene mi pase.",
          },
        },
      ],
    },
    taxi: {
      npcName: "Venkat",
      npcRole: "Taxi Driver",
      avatarColor: "#facc15",
      levelLabel: "LEVEL 2/3 · INTERMEDIATE",
      targetLangName: "తెలుగు",
      steps: [
        {
          objective: "Ask the taxi driver to take you to Charminar in Telugu.",
          npcTarget: "నమస్కారం! ఎక్కడికి వెళ్ళాలి?",
          npcPhonetic: "Namaskaram! Ekkadiki vellali?",
          npcTranslations: {
            en: "Hello! Where would you like to go?",
            ja: "こんにちは！どちらまでですか？",
            hi: "नमस्ते! कहाँ जाना है?",
            es: "¡Hola! ¿A dónde quiere ir?",
            fr: "Bonjour ! Où désirez-vous aller ?",
            de: "Hallo! Wohin möchten Sie?",
            it: "Ciao! Dove vuole andare?",
          },
          userTarget: "చార్మినార్, దయచేసి.",
          userPhonetic: "Charminar, dayachesi.",
          userTranslations: {
            en: "Charminar, please.",
            ja: "チャーミナールまでお願いします。",
            hi: "चारमीनार, कृपया।",
            es: "A Charminar, por favor.",
            fr: "À Charminar, s'il vous plaît.",
            de: "Nach Charminar, bitte.",
            it: "A Charminar, per favore.",
          },
        },
      ],
    },
  },

  // --- SPANISH TARGET LANGUAGE ---
  es: {
    cafe: {
      npcName: "Mateo",
      npcRole: "Barista",
      avatarColor: "#ea580c",
      levelLabel: "LEVEL 1/3 · PRINCIPLANTE",
      targetLangName: "Español",
      steps: [
        {
          objective: "Greet the barista and order a coffee with milk.",
          npcTarget: "¿Qué te pongo, amigo?",
          npcPhonetic: "Keh teh POHN-goh, ah-MEE-goh?",
          npcTranslations: {
            en: "What can I get you, friend?",
            ja: "何になさいますか？",
            hi: "क्या लेंगे आप, दोस्त?",
            fr: "Que puis-je vous servir, mon ami ?",
            de: "Was darf es sein, mein Freund?",
            it: "Cosa posso portarti, amico?",
            es: "¿Qué deseas ordenar?",
          },
          userTarget: "Un café con leche, por favor.",
          userPhonetic: "Oon kah-FEH kohn LEH-cheh, por fah-VOR.",
          userTranslations: {
            en: "A coffee with milk, please.",
            ja: "カフェラテを一つお願いします。",
            hi: "एक दूध वाली कॉफ़ी, कृपया।",
            fr: "Un café au lait, s'il vous plaît.",
            de: "Ein Milchkaffee, bitte.",
            it: "Un caffè e latte, per favore.",
            es: "Un café con leche, por favor.",
          },
        },
        {
          objective: "Specify you want it lukewarm with oat milk.",
          npcTarget: "¿Templado o muy caliente? ¿Qué tipo de leche?",
          npcPhonetic: "Tehm-PLAH-doh oh mwee kah-LYEHN-teh? Keh TEE-poh deh LEH-cheh?",
          npcTranslations: {
            en: "Warm or very hot? What kind of milk?",
            ja: "ぬるめですか、それとも熱め？ミルクの種類は？",
            hi: "गुनगुना या बहुत गर्म? कौन सा दूध?",
            fr: "Tiède ou très chaud ? Quel type de lait ?",
            de: "Warm oder sehr heiß? Welche Milch?",
            it: "Tiepido o caldissimo? Che tipo di latte?",
            es: "¿Templado o muy caliente? ¿Qué tipo de leche?",
          },
          userTarget: "Templado y con leche de avena.",
          userPhonetic: "Tehm-PLAH-doh ee kohn LEH-cheh deh ah-VEH-nah.",
          userTranslations: {
            en: "Lukewarm and with oat milk.",
            ja: "ぬるめで、オーツミルクでお願いします。",
            hi: "गुनगुना और ओट्स का दूध।",
            fr: "Tiède avec du lait d'avoine.",
            de: "Warm mit Hafermilch.",
            it: "Tiepido e con latte d'avena.",
            es: "Templado y con leche de avena.",
          },
        },
      ],
    },
    bus_stop: {
      npcName: "Carlos",
      npcRole: "Conductor",
      avatarColor: "#0284c7",
      levelLabel: "LEVEL 2/3 · INTERMEDIO",
      targetLangName: "Español",
      steps: [
        {
          objective: "Ask if this bus goes to the city center and buy a ticket.",
          npcTarget: "¡Buenas! ¿Adónde viajas?",
          npcPhonetic: "BWEH-nahs! Ah-DOHN-deh vee-AH-hahs?",
          npcTranslations: {
            en: "Hello! Where are you traveling to?",
            ja: "こんにちは！どちらまで行かれますか？",
            hi: "नमस्ते! आप कहाँ जा रहे हैं?",
            fr: "Bonjour ! Où voyagez-vous ?",
            de: "Hallo! Wohin fahren Sie?",
            it: "Salve! Dove stai andando?",
            es: "¡Buenas! ¿Adónde viajas?",
          },
          userTarget: "¿Va al centro este autobús?",
          userPhonetic: "Vah ahl THEHN-troh EHS-teh ow-toh-BOOS?",
          userTranslations: {
            en: "Does this bus go to the center?",
            ja: "このバスは市内中心部に行きますか？",
            hi: "क्या यह बस शहर के केंद्र में जाती है?",
            fr: "Ce bus va-t-il au centre ?",
            de: "Fährt dieser Bus ins Zentrum?",
            it: "Questo autobus va in centro?",
            es: "¿Va al centro este autobús?",
          },
        },
      ],
    },
    airport: {
      npcName: "Elena",
      npcRole: "Agente B12",
      avatarColor: "#7c3aed",
      levelLabel: "LEVEL 3/3 · AVANZADO",
      targetLangName: "Español",
      steps: [
        {
          objective: "Check in your luggage and request a window seat.",
          npcTarget: "Buenas tardes, su pasaporte y tarjeta de embarque, por favor.",
          npcPhonetic: "BWEH-nahs TAR-dehs, soo pah-sah-POR-teh ee tar-HEH-tah deh ehm-BAR-keh, por fah-VOR.",
          npcTranslations: {
            en: "Good afternoon, your passport and boarding pass, please.",
            ja: "こんにちは、パスポートと搭乗券をお願いします。",
            hi: "शुभ दोपहर, कृपया अपना पासपोर्ट और बोर्डिंग पास दें।",
            fr: "Bonjour, votre passeport et carte d'embarquement, s'il vous plaît.",
            de: "Guten Tag, Ihren Reisepass und die Bordkarte bitte.",
            it: "Buon pomeriggio, passaporto e carta d'imbarco, per favore.",
            es: "Buenas tardes, su pasaporte y tarjeta de embarque.",
          },
          userTarget: "Asiento de ventana, por favor.",
          userPhonetic: "ah-SYEHN-toh deh vehn-TAH-nah, por fah-VOR.",
          userTranslations: {
            en: "A window seat, please.",
            ja: "窓側の席をお願いします。",
            hi: "खिड़की वाली सीट, कृपया।",
            fr: "Une place côté fenêtre, s'il vous plaît.",
            de: "Ein Fensterplatz, bitte.",
            it: "Un posto al finestrino, per favore.",
            es: "Asiento de ventana, por favor.",
          },
        },
      ],
    },
    taxi: {
      npcName: "Javier",
      npcRole: "Taxista",
      avatarColor: "#facc15",
      levelLabel: "LEVEL 2/3 · INTERMEDIATE",
      targetLangName: "Español",
      steps: [
        {
          objective: "Ask the taxi driver to take you to the airport in Spanish.",
          npcTarget: "¡Hola! ¿A dónde le llevo hoy?",
          npcPhonetic: "¡Ola! ¿A dónde le yevo oy?",
          npcTranslations: {
            en: "Hello! Where can I take you today?",
            ja: "こんにちは！今日はどちらまで行かれますか？",
            hi: "नमस्ते! आज आपको कहाँ ले चलूँ?",
            es: "¡Hola! ¿A dónde le llevo hoy?",
            fr: "Bonjour ! Où vous emmène-je aujourd'hui ?",
            de: "Hallo! Wohin darf ich Sie heute bringen?",
            it: "Ciao! Dove la porto oggi?",
          },
          userTarget: "Al aeropuerto, por favor.",
          userPhonetic: "Al a-e-ro-pwer-to, por fa-vor.",
          userTranslations: {
            en: "To the airport, please.",
            ja: "空港までお願いします。",
            hi: "हवाई अड्डे तक, कृपया।",
            es: "Al aeropuerto, por favor.",
            fr: "À l'aéroport, s'il vous plaît.",
            de: "Zum Flughafen, bitte.",
            it: "All'aeroporto, per favore.",
          },
        },
      ],
    },
  },

  // --- JAPANESE TARGET LANGUAGE ---
  ja: {
    cafe: {
      npcName: "Kenji",
      npcRole: "Barista",
      avatarColor: "#e11d48",
      levelLabel: "LEVEL 1/3 · 初級",
      targetLangName: "日本語",
      steps: [
        {
          objective: "Order an iced matcha latte at the Tokyo cafe.",
          npcTarget: "いらっしゃいませ！ご注文はお決まりですか？",
          npcPhonetic: "Irasshaimase! Go-chuumon wa o-kimari desu ka?",
          npcTranslations: {
            en: "Welcome! Are you ready to order?",
            ja: "いらっしゃいませ！ご注文はお決まりですか？",
            hi: "स्वागत है! क्या आप ऑर्डर करने के लिए तैयार हैं?",
            es: "¡Bienvenido! ¿Tiene su pedido listo?",
          },
          userTarget: "アイス抹茶ラテをお願いします。",
          userPhonetic: "Aisu matcha rate o onegaishimasu.",
          userTranslations: {
            en: "Iced matcha latte, please.",
            ja: "アイス抹茶ラテをお願いします。",
            hi: "आइस्ड माचा लाते, कृपया।",
            es: "Matcha latte frío, por favor.",
          },
        },
      ],
    },
    bus_stop: {
      npcName: "Tanaka",
      npcRole: "Bus Conductor",
      avatarColor: "#2563eb",
      levelLabel: "LEVEL 2/3 · 中級",
      targetLangName: "日本語",
      steps: [
        {
          objective: "Ask if the bus stops at Shibuya station.",
          npcTarget: "どちらまでご利用ですか？",
          npcPhonetic: "Dochira made go-riyou desu ka?",
          npcTranslations: {
            en: "Where will you be traveling to?",
            ja: "どちらまでご利用ですか？",
            hi: "आप कहाँ तक जा रहे हैं?",
            es: "¿Hasta dónde viaja?",
          },
          userTarget: "渋谷駅に止まりますか？",
          userPhonetic: "Shibuya-eki ni tomarimasu ka?",
          userTranslations: {
            en: "Does it stop at Shibuya Station?",
            ja: "渋谷駅に止まりますか？",
            hi: "क्या यह शिबुया स्टेशन पर रुकती है?",
            es: "¿Para en la estación de Shibuya?",
          },
        },
      ],
    },
    airport: {
      npcName: "Yuki",
      npcRole: "Haneda Gate Agent",
      avatarColor: "#7c3aed",
      levelLabel: "LEVEL 3/3 · 上級",
      targetLangName: "日本語",
      steps: [
        {
          objective: "Confirm your boarding group at Haneda.",
          npcTarget: "パスポートと搭乗券を拝見いたします。",
          npcPhonetic: "Pasupooto to toujouken o haiken itashimasu.",
          npcTranslations: {
            en: "May I see your passport and boarding pass?",
            ja: "パスポートと搭乗券を拝見いたします。",
            hi: "कृपया पासपोर्ट और बोर्डिंग पास दिखाइए।",
            es: "¿Puedo ver su pasaporte y tarjeta de embarque?",
            fr: "Puis-je voir votre passeport et votre carte d'embarquement ?",
            de: "Darf ich Ihren Pass und die Bordkarte sehen?",
            it: "Posso vedere il passaporto e la carta d'imbarco?",
          },
          userTarget: "搭乗は何時からですか？",
          userPhonetic: "Toujou wa nanji kara desu ka?",
          userTranslations: {
            en: "What time does boarding start?",
            ja: "搭乗は何時からですか？",
            hi: "बोर्डिंग कितने बजे शुरू होगी?",
            es: "¿A qué hora empieza el embarque?",
            fr: "À quelle heure commence l'embarquement ?",
            de: "Um wie viel Uhr beginnt das Boarding?",
            it: "A che ora inizia l'imbarco?",
          },
        },
      ],
    },
    taxi: {
      npcName: "Kenji",
      npcRole: "Taxi Driver",
      avatarColor: "#facc15",
      levelLabel: "LEVEL 2/3 · 初級",
      targetLangName: "日本語",
      steps: [
        {
          objective: "Ask the taxi driver to go to Tokyo Station in Japanese.",
          npcTarget: "どちらまで行かれますか？",
          npcPhonetic: "Dochira made ikaremasu ka?",
          npcTranslations: {
            en: "Where would you like to go?",
            ja: "どちらまで行かれますか？",
            es: "¿A dónde le gustaría ir?",
            fr: "Où aimeriez-vous aller ?",
            de: "Wohin möchten Sie fahren?",
            it: "Dove desidera andare?",
            hi: "आप कहाँ जाना चाहेंगे?",
          },
          userTarget: "東京駅までお願いします。",
          userPhonetic: "Toukyou eki made onegaishimasu.",
          userTranslations: {
            en: "To Tokyo Station, please.",
            ja: "東京駅までお願いします。",
            es: "A la estación de Tokio, por favor.",
            fr: "À la gare de Tokyo, s'il vous plaît.",
            de: "Zum Bahnhof Tokio, bitte.",
            it: "Alla stazione di Tokyo, per favore.",
            hi: "टोक्यो स्टेशन तक, कृपया।",
          },
        },
      ],
    },
  },

  // --- FRENCH TARGET LANGUAGE (France) ---
  fr: {
    cafe: {
      npcName: "Pierre",
      npcRole: "Barista Parisien",
      avatarColor: "#2563eb",
      levelLabel: "NIVEAU 1/3 · DÉBUTANT",
      targetLangName: "Français",
      steps: [
        {
          objective: "Greet the Parisian barista and order a café au lait.",
          npcTarget: "Bonjour ! Que désirez-vous prendre aujourd'hui ?",
          npcPhonetic: "Bohn-zhoor! Kuh day-zee-ray voo prahn-druh oh-zhoor-dwee?",
          npcTranslations: {
            en: "Hello! What would you like to have today?",
            ja: "こんにちは！本日は何になさいますか？",
            es: "¡Hola! ¿Qué desea tomar hoy?",
            hi: "नमस्ते! आज आप क्या लेना पसंद करेंगे?",
            fr: "Bonjour ! Que désirez-vous prendre aujourd'hui ?",
            de: "Guten Tag! Was darf es heute für Sie sein?",
            it: "Buongiorno! Cosa desidera prendere oggi?",
          },
          userTarget: "Café au lait, s'il vous plaît.",
          userPhonetic: "Kah-fay oh leh, seel voo pleh.",
          userTranslations: {
            en: "A coffee with milk, please.",
            ja: "カフェオレをお願いします。",
            es: "Un café con leche, por favor.",
            hi: "दूध वाली कॉफ़ी, कृपया।",
            fr: "Café au lait, s'il vous plaît.",
            de: "Einen Milchkaffee, bitte.",
            it: "Un caffè e latte, per favore.",
          },
        },
        {
          objective: "Say whether you are eating in or taking away.",
          npcTarget: "Très bien ! Ce sera sur place ou à emporter ?",
          npcPhonetic: "Treh byan! Suh suh-rah soor plahs oo ah ahm-por-tay?",
          npcTranslations: {
            en: "Very well! For here or to go?",
            ja: "かしこまりました！店内ですか、お持ち帰りですか？",
            es: "¡Muy bien! ¿Para tomar aquí o para llevar?",
            hi: "बहुत बढ़िया! यहाँ पिएंगे या साथ ले जाएंगे?",
            fr: "Très bien ! Ce sera sur place ou à emporter ?",
            de: "Sehr gut! Hier trinken oder zum Mitnehmen?",
            it: "Molto bene! Da consumare qui o da asporto?",
          },
          userTarget: "Sur place, s'il vous plaît.",
          userPhonetic: "Soor plahs, seel voo pleh.",
          userTranslations: {
            en: "For here, please.",
            ja: "店内でお願いします。",
            es: "Para tomar aquí, por favor.",
            hi: "यहाँ के लिए, कृपया।",
            fr: "Sur place, s'il vous plaît.",
            de: "Hier trinken, bitte.",
            it: "Per qui, per favore.",
          },
        },
      ],
    },
    bus_stop: {
      npcName: "Luc",
      npcRole: "Chauffeur de Bus",
      avatarColor: "#0284c7",
      levelLabel: "NIVEAU 2/3 · INTERMÉDIAIRE",
      targetLangName: "Français",
      steps: [
        {
          objective: "Ask if this bus goes to the Eiffel Tower and ask for a ticket.",
          npcTarget: "Bonjour ! Vous allez vers quelle destination ?",
          npcPhonetic: "Bohn-zhoor! Voo zah-lay vehr kehl des-tee-nah-syohn?",
          npcTranslations: {
            en: "Hello! Which destination are you heading towards?",
            ja: "こんにちは！どちらの方面へ行かれますか？",
            es: "¡Hola! ¿A qué destino se dirige?",
            hi: "नमस्ते! आप किस दिशा में जा रहे हैं?",
            fr: "Bonjour ! Vous allez vers quelle destination ?",
            de: "Hallo! Wohin fahren Sie?",
            it: "Buongiorno! Verso quale destinazione è diretto?",
          },
          userTarget: "Pour la Tour Eiffel ?",
          userPhonetic: "Poo-lah toor ay-fehl?",
          userTranslations: {
            en: "For the Eiffel Tower?",
            ja: "エッフェル塔行きですか？",
            es: "¿Para la Torre Eiffel?",
            hi: "एफिल टॉवर के लिए?",
            fr: "Pour la Tour Eiffel ?",
            de: "Zum Eiffelturm?",
            it: "Per la Torre Eiffel?",
          },
        },
      ],
    },
    airport: {
      npcName: "Camille",
      npcRole: "Agente d'embarquement",
      avatarColor: "#7c3aed",
      levelLabel: "NIVEAU 3/3 · AVANCÉ",
      targetLangName: "Français",
      steps: [
        {
          objective: "Check your boarding gate at Paris CDG.",
          npcTarget: "Bonjour, votre passeport et carte d'embarquement s'il vous plaît.",
          npcPhonetic: "Bohn-zhoor, voh-truh pahs-por ay kahrt dahm-bar-kuh-mahn seel voo pleh.",
          npcTranslations: {
            en: "Hello, your passport and boarding pass please.",
            ja: "こんにちは、パスポートと搭乗券をお願いします。",
            es: "Buenos días, su pasaporte y tarjeta de embarque por favor.",
            hi: "नमस्ते, कृपया अपना पासपोर्ट और बोर्डिंग पास दिखाइए।",
            fr: "Bonjour, votre passeport et carte d'embarquement s'il vous plaît.",
            de: "Guten Tag, Ihren Reisepass und die Bordkarte bitte.",
            it: "Buongiorno, passaporto e carta d'imbarco per favore.",
          },
          userTarget: "La porte d'embarquement ?",
          userPhonetic: "Lah port dahm-bar-kuh-mahn?",
          userTranslations: {
            en: "Which is the boarding gate?",
            ja: "搭乗ゲートはどこですか？",
            es: "¿Cuál es la puerta de embarque?",
            hi: "बोर्डिंग गेट कौन सा है?",
            fr: "La porte d'embarquement ?",
            de: "Welches ist das Gate?",
            it: "Qual è il gate d'imbarco?",
          },
        },
      ],
    },
    taxi: {
      npcName: "Jean",
      npcRole: "Chauffeur de Taxi",
      avatarColor: "#facc15",
      levelLabel: "NIVEAU 2/3 · INTERMÉDIAIRE",
      targetLangName: "Français",
      steps: [
        {
          objective: "Ask the taxi driver to take you to the Eiffel Tower in French.",
          npcTarget: "Bonjour ! Où allez-vous ?",
          npcPhonetic: "Bohn-zhoor! Oo ah-lay-voo?",
          npcTranslations: {
            en: "Hello! Where are you going?",
            ja: "こんにちは！どこへ行かれますか？",
            es: "¡Hola! ¿A dónde va?",
            fr: "Bonjour ! Où allez-vous ?",
            de: "Hallo! Wohin fahren Sie?",
            it: "Ciao! Dove va?",
            hi: "नमस्ते! आप कहाँ जा रहे हैं?",
          },
          userTarget: "Tour Eiffel, s'il vous plaît.",
          userPhonetic: "Toor eh-fel, seel voo pleh.",
          userTranslations: {
            en: "To the Eiffel Tower, please.",
            ja: "エッフェル塔までお願いします。",
            es: "A la Torre Eiffel, por favor.",
            fr: "Tour Eiffel, s'il vous plaît.",
            de: "Zum Eiffelturm, bitte.",
            it: "Alla Torre Eiffel, per favore.",
            hi: "एफिल टॉवर तक, कृपया।",
          },
        },
      ],
    },
  },

  // --- ITALIAN TARGET LANGUAGE (Italy) ---
  it: {
    cafe: {
      npcName: "Marco",
      npcRole: "Barista Romano",
      avatarColor: "#16a34a",
      levelLabel: "LIVELLO 1/3 · PRINCIPIANTE",
      targetLangName: "Italiano",
      steps: [
        {
          objective: "Order an espresso at the Italian café bar.",
          npcTarget: "Buongiorno! Cosa ti preparo oggi al bar?",
          npcPhonetic: "Bwohn-JOHR-noh! KOH-zah tee preh-PAH-roh OHD-jee ahl bar?",
          npcTranslations: {
            en: "Good morning! What can I get ready for you at the bar?",
            ja: "おはようございます！カウンターで何をご用意しましょうか？",
            es: "¡Buenos días! ¿Qué te preparo hoy en el bar?",
            hi: "शुभ प्रभात! आज बार में आपके लिए क्या बनाऊँ?",
            fr: "Bonjour ! Que puis-je vous préparer aujourd'hui au bar ?",
            de: "Guten Morgen! Was darf ich Ihnen heute an der Bar zubereiten?",
            it: "Buongiorno! Cosa ti preparo oggi al bar?",
          },
          userTarget: "Un espresso, per favore.",
          userPhonetic: "Oon ehs-PREHS-soh, pehr fah-VOH-reh.",
          userTranslations: {
            en: "An espresso, please.",
            ja: "エスプレッソをお願いします。",
            es: "Un espresso, por favor.",
            hi: "एक एस्प्रेसो, कृपया।",
            fr: "Un espresso, s'il vous plaît.",
            de: "Einen Espresso, bitte.",
            it: "Un espresso, per favore.",
          },
        },
        {
          objective: "Ask for the bill at the cashier.",
          npcTarget: "Subito! Desideri anche un bicchiere d'acqua naturale?",
          npcPhonetic: "SOO-bee-toh! Deh-ZEE-deh-ree AHN-keh oon beek-KYEH-reh DAHK-wah nah-too-RAH-leh?",
          npcTranslations: {
            en: "Right away! Would you also like a glass of still water?",
            ja: "すぐにご用意します！普通のお水も一杯いかがですか？",
            es: "¡Enseguida! ¿Deseas también un vaso de agua sin gas?",
            hi: "तुरंत! क्या आपको एक गिलास सादा पानी भी चाहिए?",
            fr: "Tout de suite ! Désirez-vous aussi un verre d'eau plate ?",
            de: "Sofort! Möchten Sie auch ein Glas stilles Wasser?",
            it: "Subito! Desideri anche un bicchiere d'acqua naturale?",
          },
          userTarget: "Quanto pago, per favore?",
          userPhonetic: "KWAHN-toh PAH-goh, pehr fah-VOH-reh?",
          userTranslations: {
            en: "How much do I pay, please?",
            ja: "お支払いはいくらですか？",
            es: "¿Cuánto pago, por favor?",
            hi: "कितना देना है, कृपया?",
            fr: "Combien dois-je payer, s'il vous plaît ?",
            de: "Wie viel bezahle ich, bitte?",
            it: "Quanto pago, per favore?",
          },
        },
      ],
    },
    bus_stop: {
      npcName: "Giovanni",
      npcRole: "Autista dell'Autobus",
      avatarColor: "#0284c7",
      levelLabel: "LIVELLO 2/3 · INTERMEDIO",
      targetLangName: "Italiano",
      steps: [
        {
          objective: "Ask if this bus goes to the Colosseum in Rome.",
          npcTarget: "Salve! Dove devi andare con questa linea?",
          npcPhonetic: "SAHL-veh! DOH-veh DEH-vee ahn-DAH-reh kohn KWEHS-tah LEE-neh-ah?",
          npcTranslations: {
            en: "Hello! Where do you need to go with this bus line?",
            ja: "こんにちは！この路線でどこへ行かれますか？",
            es: "¡Hola! ¿A dónde necesitas ir con esta línea?",
            hi: "नमस्ते! इस बस लाइन से आपको कहाँ जाना है?",
            fr: "Bonjour ! Où devez-vous aller avec cette ligne de bus ?",
            de: "Hallo! Wohin müssen Sie mit dieser Buslinie fahren?",
            it: "Salve! Dove devi andare con questa linea?",
          },
          userTarget: "Questo autobus porta al Colosseo?",
          userPhonetic: "KWEHS-toh OW-toh-boos POHR-tah ahl koh-lohs-SEH-oh?",
          userTranslations: {
            en: "Does this bus go to the Colosseum?",
            ja: "このバスはコロッセオに行きますか？",
            es: "¿Este autobús lleva al Coliseo?",
            hi: "क्या यह बस कोलोसियम जाती है?",
            fr: "Ce bus mène-t-il au Colisée ?",
            de: "Fährt dieser Bus zum Kolosseum?",
            it: "Questo autobus porta al Colosseo?",
          },
        },
      ],
    },
    airport: {
      npcName: "Chiara",
      npcRole: "Agente di Terra",
      avatarColor: "#7c3aed",
      levelLabel: "LIVELLO 3/3 · AVANZATO",
      targetLangName: "Italiano",
      steps: [
        {
          objective: "Check your flight boarding gate at Rome Fiumicino.",
          npcTarget: "Buon pomeriggio, posso avere passaporto e biglietto?",
          npcPhonetic: "Bwohn poh-meh-REED-joh, POHS-soh ah-VEH-reh pahs-sah-POHR-toh eh beel-LYEHT-toh?",
          npcTranslations: {
            en: "Good afternoon, may I have your passport and ticket?",
            ja: "こんにちは、パスポートとチケットを拝見できますか？",
            es: "Buenas tardes, ¿puedo ver su pasaporte y boleto?",
            hi: "शुभ दोपहर, क्या मैं आपका पासपोर्ट और टिकट देख सकता हूँ?",
            fr: "Bon après-midi, puis-je avoir votre passeport et votre billet ?",
            de: "Guten Tag, darf ich Ihren Pass und das Ticket sehen?",
            it: "Buon pomeriggio, posso avere passaporto e biglietto?",
          },
          userTarget: "Da quale gate si imbarca?",
          userPhonetic: "Dah KWAH-leh gate see eem-BAR-kah?",
          userTranslations: {
            en: "From which gate do we board?",
            ja: "どのゲートから搭乗しますか？",
            es: "¿Desde qué puerta se embarca?",
            hi: "किस गेट से बोर्डिंग होगी?",
            fr: "De quelle porte embarquons-nous ?",
            de: "An welchem Gate steigen wir ein?",
            it: "Da quale gate si imbarca?",
          },
        },
      ],
    },
    taxi: {
      npcName: "Marco",
      npcRole: "Tassista",
      avatarColor: "#facc15",
      levelLabel: "LIVELLO 2/3 · INTERMEDIO",
      targetLangName: "Italiano",
      steps: [
        {
          objective: "Ask the taxi driver to take you to the Colosseum in Italian.",
          npcTarget: "Buongiorno! Dove la porto?",
          npcPhonetic: "Bwon-dzhor-no! Do-veh lah por-to?",
          npcTranslations: {
            en: "Good day! Where shall I take you?",
            ja: "こんにちは！どちらまでお連れしましょうか？",
            es: "¡Buenos días! ¿A dónde le llevo?",
            fr: "Bonjour ! Où vous emmène-je ?",
            de: "Guten Tag! Wohin darf ich Sie bringen?",
            it: "Buongiorno! Dove la porto?",
            hi: "नमस्ते! आपको कहाँ ले चलूँ?",
          },
          userTarget: "Al Colosseo, per favore.",
          userPhonetic: "Al ko-los-seh-o, per fah-vo-reh.",
          userTranslations: {
            en: "To the Colosseum, please.",
            ja: "コロッセオまでお願いします。",
            es: "Al Coliseo, por favor.",
            fr: "Au Colisée, s'il vous plaît.",
            de: "Zum Kolosseum, bitte.",
            it: "Al Colosseo, per favore.",
            hi: "कोलोसियम तक, कृपया।",
          },
        },
      ],
    },
  },
};

export function getBilingualDialogue({
  targetLang,
  nativeLang,
  zone,
  stepIndex = 0,
}: BilingualDialogueOptions): BilingualDialogue {
  // Normalize target language code
  const targetKey = targetLang in SCENARIOS ? targetLang : "es";
  const scenarioGroup = SCENARIOS[targetKey];

  // Normalize zone
  const zoneKey =
    zone.includes("bus")
      ? "bus_stop"
      : zone.includes("taxi") || zone.includes("cab")
      ? "taxi"
      : zone.includes("airport")
      ? "airport"
      : "cafe";
  const scenario = scenarioGroup[zoneKey] || scenarioGroup["cafe"] || SCENARIOS["es"]["cafe"];

  const clampedIndex = Math.min(Math.max(0, stepIndex), scenario.steps.length - 1);
  const step = scenario.steps[clampedIndex];

  // Resolve native translation with fallback to English
  const npcTrans =
    step.npcTranslations[nativeLang] || step.npcTranslations["en"] || step.npcTarget;
  const userTrans =
    step.userTranslations[nativeLang] || step.userTranslations["en"] || step.userTarget;

  return {
    npcName: scenario.npcName,
    npcRole: scenario.npcRole,
    npcAvatarColor: scenario.avatarColor,
    levelLabel: scenario.levelLabel,
    stepProgress: `${clampedIndex + 1} / ${scenario.steps.length}`,
    totalSteps: scenario.steps.length,
    currentStep: clampedIndex + 1,
    objective: step.objective,
    targetLangName: scenario.targetLangName,
    npcTargetText: step.npcTarget,
    npcPhonetics: step.npcPhonetic,
    npcNativeTranslation: npcTrans,
    userSuggestedTarget: step.userTarget,
    userSuggestedPhonetics: step.userPhonetic,
    userSuggestedNative: userTrans,
  };
}

export interface MultilingualScenarioConfig {
  id: string;
  npcName: string;
  npcRole: string;
  location: string;
  city: string;
  targetLanguage: string;
  targetLanguageCode: string;
  nativeLanguageCode: string;
  interactionRadius: number;
  systemPrompt: string;
  greeting: string;
  objectives: string[];
  contextPayload: Record<string, string>;
  dialogue: BilingualDialogue;
}

/**
 * AssemblyAI can only speak text the agent itself produces, so the helper
 * meaning has to ride on line 2 of the very same reply: line 1 is the shop
 * line in the target language, line 2 is what it means for the learner.
 * The client splits the two on the newline (see splitAgentUtterance).
 */
function bilingualReplyRule(language: string, nativeLanguage: string): string {
  return `REPLY FORMAT (every single reply, no exceptions):
- Line 1: your line in ${language}, one short simple sentence.
- Line 2: the meaning of line 1 in ${nativeLanguage}, one short simple sentence.
- Do not add labels, quotes, stage directions, or a third line.`;
}

export function getMultilingualScenario(
  targetLang: string = "es",
  nativeLang: string = "en",
  zone: "cafe" | "bus_stop" | "taxi" | "barber" = "cafe"
): MultilingualScenarioConfig {
  const dialogue = getBilingualDialogue({ targetLang, nativeLang, zone: zone === "barber" ? "cafe" : zone, stepIndex: 0 });

  const targetKey = targetLang in SCENARIOS ? targetLang : "es";
  const scenarioGroup = SCENARIOS[targetKey];
  const zoneKey = zone === "bus_stop" ? "bus_stop" : zone === "taxi" ? "taxi" : zone === "barber" ? "barber" : "cafe";
  const scenario = scenarioGroup[zoneKey] || scenarioGroup["cafe"];
  const objectives = scenario.steps.map((s) => s.objective);

  const cityMap: Record<string, { city: string; country: string; language: string }> = {
    es: { city: "Barcelona", country: "Spain", language: "Spanish" },
    hi: { city: "Delhi", country: "India", language: "Hindi" },
    ja: { city: "Tokyo", country: "Japan", language: "Japanese" },
    fr: { city: "Paris", country: "France", language: "French" },
    it: { city: "Rome", country: "Italy", language: "Italian" },
    te: { city: "Hyderabad", country: "India", language: "Telugu" },
  };

  const meta = cityMap[targetKey] || cityMap.es;
  const nativeName =
    SUPPORTED_LEARNER_LANGUAGES.find((lang) => lang.code === nativeLang)?.name ?? "English";

  if (zone === "barber") {
    const barberNpcTarget =
      targetKey === "es"
        ? "¡Hola! Bienvenido a la barbería. ¿Deseas un corte de pelo?"
        : targetKey === "hi"
        ? "नमस्ते! नाई की दुकान में आपका स्वागत है।"
        : targetKey === "ja"
        ? "こんにちは！床屋へようこそ。"
        : targetKey === "fr"
        ? "Bonjour ! Bienvenue chez le barbier."
        : targetKey === "it"
        ? "Ciao! Benvenuto dal barbiere."
        : "Hello! Welcome to the barber shop.";
    const barberNpcTranslation = "Hello! Welcome to the barber shop. Would you like a haircut?";
    const barberUserTarget =
      targetKey === "es"
        ? "Un corte, por favor."
        : targetKey === "hi"
        ? "बाल काटिए, कृपया।"
        : targetKey === "ja"
        ? "散髪をお願いします。"
        : targetKey === "fr"
        ? "Une coupe, s'il vous plaît."
        : targetKey === "it"
        ? "Un taglio, per favore."
        : targetKey === "te"
        ? "కటింగ్ కావాలి."
        : "A haircut, please.";
    const barberUserNative = "A haircut, please.";

    return {
      id: `${targetKey}-barber-1`,
      npcName: "Marco",
      npcRole: "Master Barber",
      location: "Vintage Barber Salon",
      city: meta.city,
      targetLanguage: meta.language,
      targetLanguageCode: targetKey,
      nativeLanguageCode: nativeLang,
      interactionRadius: 12,
      systemPrompt: `You are Marco, a friendly master barber at Vintage Barber Salon in ${meta.city}, ${meta.country}.
You are speaking directly with an international traveler who is learning ${meta.language}.
Keep replies short, lively, and encouraging. Ask if they want a haircut or shave.
${bilingualReplyRule(meta.language, nativeName)}`,
      greeting: `${barberNpcTarget}\n${barberNpcTranslation}`,
      objectives: [
        "Greet the barber in the local language",
        "Specify your haircut or shave preference",
        "Confirm the styling and say thank you",
      ],
      contextPayload: {
        location: "Vintage Barber Salon, Plot-1-2",
        city: meta.city,
        country: meta.country,
        npcRole: "Master Barber",
        targetLanguage: meta.language,
        nativeLanguage: nativeLang,
        currentObjective: "Greet the barber in the local language",
      },
      dialogue: {
        ...dialogue,
        npcName: "Marco",
        npcRole: "Master Barber",
        npcTargetText: barberNpcTarget,
        npcNativeTranslation: barberNpcTranslation,
        userSuggestedTarget: barberUserTarget,
        userSuggestedNative: barberUserNative,
        objective: "Greet the barber and request a haircut",
      },
    };
  }
  const locationName =
    zone === "cafe"
      ? "Park Promenade Cafe"
      : zone === "taxi"
      ? "City Central Taxi Stand"
      : "City Park Transit Stop";

  const systemPrompt = `You are ${dialogue.npcName}, a friendly ${dialogue.npcRole} at ${locationName} in ${meta.city}, ${meta.country}.
You are speaking directly with an international traveler who is learning ${meta.language}.

ROLEPLAY RULES:
- Greet the user in ${meta.language} and speak naturally in ${meta.language}.
- Keep replies short, lively, and encouraging (1 to 2 sentences max for a game conversation).
- If the learner replies in ${meta.language}, celebrate their attempt and respond warmly.
- If the learner is confused or speaks English, gently guide them with the phrase in ${meta.language} and its meaning.
- Current objective: "${dialogue.objective}".
- Guide the user toward replying with: "${dialogue.userSuggestedTarget}" (${dialogue.userSuggestedNative}).
${bilingualReplyRule(meta.language, nativeName)}`;

  return {
    id: `${targetKey}-${zoneKey}-1`,
    npcName: dialogue.npcName,
    npcRole: dialogue.npcRole,
    location: locationName,
    city: meta.city,
    targetLanguage: meta.language,
    targetLanguageCode: targetKey,
    nativeLanguageCode: nativeLang,
    interactionRadius: 12,
    systemPrompt,
    greeting: `${dialogue.npcTargetText}\n${dialogue.npcNativeTranslation}`,
    objectives,
    contextPayload: {
      location: locationName,
      city: meta.city,
      country: meta.country,
      npcRole: dialogue.npcRole,
      targetLanguage: meta.language,
      nativeLanguage: nativeLang,
      currentObjective: dialogue.objective,
    },
    dialogue,
  };
}


export interface ScriptedNpcLine {
  text: string;
  phonetic: string;
  translations: Record<string, string>;
}

export function getScriptedNpcLines(targetLang: string, zone: string): ScriptedNpcLine[] {
  if (!(targetLang in SCENARIOS)) return [];
  const scenarioGroup = SCENARIOS[targetLang];
  const zoneKey =
    zone.includes("bus")
      ? "bus_stop"
      : zone.includes("taxi") || zone.includes("cab")
      ? "taxi"
      : "cafe";
  const scenario = scenarioGroup[zoneKey] || scenarioGroup["cafe"];
  if (!scenario) return [];
  return scenario.steps.map((step) => ({
    text: step.npcTarget,
    phonetic: step.npcPhonetic,
    translations: step.npcTranslations,
  }));
}

export function getBarberScriptedNpcLines(targetLang: string): ScriptedNpcLine[] {
  if (!(targetLang in SCENARIOS)) return [];
  const scenario = getMultilingualScenario(targetLang, "en", "barber");
  const greetingTranslation = scenario.dialogue.npcNativeTranslation;
  const suggestionTranslation = scenario.dialogue.userSuggestedNative;
  return [
    {
      text: scenario.greeting,
      phonetic: "",
      translations: { en: greetingTranslation },
    },
    {
      text: scenario.dialogue.npcTargetText,
      phonetic: "",
      translations: { en: greetingTranslation },
    },
    {
      text: scenario.dialogue.userSuggestedTarget,
      phonetic: "",
      translations: { en: suggestionTranslation },
    },
  ];
}
