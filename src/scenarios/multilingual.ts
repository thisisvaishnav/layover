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
          userTarget: "एक कप मसाला चाय, कृपया।",
          userPhonetic: "Ek cup masala chai, kripya.",
          userTranslations: {
            en: "A cup of masala chai, please.",
            ja: "マサラチャイを1杯お願いします。",
            es: "Una taza de té masala, por favor.",
            fr: "Une tasse de thé masala, s'il vous plaît.",
            de: "Eine Tasse Masala-Tee, bitte.",
            it: "Una tazza di tè masala, per favore.",
            hi: "एक कप मसाला चाय, कृपया।",
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
          userTarget: "कम चीनी डालना, धन्यवाद।",
          userPhonetic: "Kam cheeni daalna, dhanyawaad.",
          userTranslations: {
            en: "Less sugar, thank you.",
            ja: "砂糖少なめで、ありがとう。",
            es: "Poco azúcar, gracias.",
            fr: "Moins de sucre, merci.",
            de: "Wenig Zucker, danke.",
            it: "Poco zucchero, grazie.",
            hi: "कम चीनी डालना, धन्यवाद।",
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
          objective: "Ask if this bus goes to Connaught Place and get a ticket.",
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
          userTarget: "क्या यह बस कनाट प्लेस जाती है?",
          userPhonetic: "Kya yeh bus Connaught Place jaati hai?",
          userTranslations: {
            en: "Does this bus go to Connaught Place?",
            ja: "このバスはコンノートプレイスに行きますか？",
            es: "¿Este autobús va a Connaught Place?",
            fr: "Ce bus va-t-il à Connaught Place ?",
            de: "Fährt dieser Bus zum Connaught Place?",
            it: "Questo autobus va a Connaught Place?",
            hi: "क्या यह बस कनाट प्लेस जाती है?",
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
          userTarget: "यह लीजिए। बोर्डिंग गेट कौन सा है?",
          userPhonetic: "Yeh lijiye. Boarding gate kaun sa hai?",
          userTranslations: {
            en: "Here you go. Which is the boarding gate?",
            ja: "どうぞ。搭乗ゲートはどこですか？",
            es: "Aquí tiene. ¿Cuál es la puerta de embarque?",
            fr: "Voilà. Quelle est la porte d'embarquement ?",
            de: "Hier, bitte. Welches ist das Flugsteigtor?",
            it: "Ecco qui. Qual è il gate d'imbarco?",
            hi: "यह लीजिए। बोर्डिंग गेट कौन सा है?",
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
          userTarget: "ఇదిగోండి డబ్బులు, ధన్యవాదాలు.",
          userPhonetic: "Idigondi dabbulu, dhanyavaadaalu.",
          userTranslations: {
            en: "Here is the money, thank you.",
            ja: "こちらがお金です、ありがとう。",
            hi: "यह रहे पैसे, धन्यवाद।",
            es: "Aquí tiene el dinero, gracias.",
            fr: "Voici l'argent, merci.",
            de: "Hier ist das Geld, danke.",
            it: "Ecco i soldi, grazie.",
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
          userTarget: "ఒక ఇరానీ చాయ్ ఇవ్వండి.",
          userPhonetic: "Oka Iraanee chaay ivvandi.",
          userTranslations: {
            en: "Please give me one Irani chai.",
            ja: "イラニチャイを1つください。",
            hi: "एक ईरानी चाय दीजिए।",
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
          userTarget: "Aquí tiene. ¿Queda algún asiento de ventana?",
          userPhonetic: "Ah-KEE TYEH-neh. KEH-dah ahl-GOON ah-SYEHN-toh deh vehn-TAH-nah?",
          userTranslations: {
            en: "Here you go. Is there any window seat left?",
            ja: "どうぞ。窓側の席はまだ空いていますか？",
            hi: "यह लीजिए। क्या कोई खिड़की वाली सीट बची है?",
            fr: "Voici. Reste-t-il une place côté fenêtre ?",
            de: "Bitte sehr. Gibt es noch einen Fensterplatz?",
            it: "Ecco qui. È rimasto un posto vicino al finestrino?",
            es: "Aquí tiene. ¿Queda algún asiento de ventana?",
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
          userTarget: "アイス抹茶ラテを一つお願いします。",
          userPhonetic: "Aisu matcha rate o hitotsu onegaishimasu.",
          userTranslations: {
            en: "One iced matcha latte, please.",
            ja: "アイス抹茶ラテを一つお願いします。",
            hi: "कृपया एक आइस्ड माचा लाते दीजिए।",
            es: "Un matcha latte frío, por favor.",
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
          userTarget: "このバスは渋谷駅に止まりますか？",
          userPhonetic: "Kono basu wa Shibuya-eki ni tomarimasu ka?",
          userTranslations: {
            en: "Does this bus stop at Shibuya Station?",
            ja: "このバスは渋谷駅に止まりますか？",
            hi: "क्या यह बस शिबुया स्टेशन पर रुकती है?",
            es: "¿Este autobús para en la estación de Shibuya?",
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
          },
          userTarget: "はい、どうぞ。搭乗は何時からですか？",
          userPhonetic: "Hai, douzo. Toujou wa nanji kara desu ka?",
          userTranslations: {
            en: "Here you go. What time does boarding start?",
            ja: "はい、どうぞ。搭乗は何時からですか？",
            hi: "हाँ, यह लीजिए। बोर्डिंग कितने बजे शुरू होगी?",
            es: "Sí, aquí tiene. ¿A qué hora empieza el embarque?",
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
    zone.includes("bus") ? "bus_stop" : zone.includes("airport") ? "airport" : "cafe";
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
