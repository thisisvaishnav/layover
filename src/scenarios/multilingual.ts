export interface LearnerLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LEARNER_LANGUAGES: LearnerLanguage[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
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
      ja: "カフェ",
    },
  },
  bus_stop: {
    label: "Bus Stop",
    icon: "🚌",
    target: {
      ja: "バス停",
    },
  },
  taxi: {
    label: "Taxi Stand",
    icon: "🚕",
    target: {
      ja: "タクシー乗り場",
    },
  },
  barber: {
    label: "Barber Shop",
    icon: "💈",
    target: {
      ja: "床屋",
    },
  },
};

/**
 * "This is the Coffee Shop" — English label for the banner, plus the same place
 * named in the language being practised. Falls back the same way dialogue does
 * (unknown language code → Japanese).
 */
export function getPlaceInfo(zone: string, targetLang: string): PlaceInfo {
  const zoneKey = zone.includes("barber")
    ? "barber"
    : zone.includes("bus")
    ? "bus_stop"
    : zone.includes("taxi") || zone.includes("cab")
    ? "taxi"
    : "cafe";
  const langKey = targetLang in SCENARIOS ? targetLang : "ja";
  const entry = PLACE_LABELS[zoneKey];
  return {
    zone: zoneKey as PlaceInfo["zone"],
    label: entry.label,
    targetLabel: entry.target[langKey] ?? entry.target.ja,
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
            ja: "いらっしゃいませ！ご注文はお決まりですか？",
          },
          userTarget: "アイス抹茶ラテをお願いします。",
          userPhonetic: "Aisu matcha rate o onegaishimasu.",
          userTranslations: {
            ja: "アイス抹茶ラテをお願いします。",
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
            ja: "どちらまでご利用ですか？",
          },
          userTarget: "渋谷駅に止まりますか？",
          userPhonetic: "Shibuya-eki ni tomarimasu ka?",
          userTranslations: {
            ja: "渋谷駅に止まりますか？",
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
            ja: "パスポートと搭乗券を拝見いたします。",
          },
          userTarget: "搭乗は何時からですか？",
          userPhonetic: "Toujou wa nanji kara desu ka?",
          userTranslations: {
            ja: "搭乗は何時からですか？",
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
            ja: "どちらまで行かれますか？",
          },
          userTarget: "東京駅までお願いします。",
          userPhonetic: "Toukyou eki made onegaishimasu.",
          userTranslations: {
            ja: "東京駅までお願いします。",
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
  const targetKey = targetLang in SCENARIOS ? targetLang : "ja";
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
  const scenario = scenarioGroup[zoneKey] || scenarioGroup["cafe"] || SCENARIOS["ja"]["cafe"];

  const clampedIndex = Math.min(Math.max(0, stepIndex), scenario.steps.length - 1);
  const step = scenario.steps[clampedIndex];

  // Resolve native translation with fallback to Japanese
  const npcTrans =
    step.npcTranslations[nativeLang] || step.npcTranslations["ja"] || step.npcTarget;
  const userTrans =
    step.userTranslations[nativeLang] || step.userTranslations["ja"] || step.userTarget;

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
 * The helper meaning rides on line 2 of every reply: line 1 is the shop line in
 * the target language, line 2 is what it means for the learner.
 */
function bilingualReplyRule(language: string, nativeLanguage: string): string {
  return `REPLY FORMAT (every single reply, no exceptions):
- Line 1: your line in ${language}, one short simple sentence.
- Line 2: the meaning of line 1 in ${nativeLanguage}, one short simple sentence.
- Do not add labels, quotes, stage directions, or a third line.`;
}

export function getMultilingualScenario(
  targetLang: string = "ja",
  nativeLang: string = "ja",
  zone: "cafe" | "bus_stop" | "taxi" | "barber" = "cafe"
): MultilingualScenarioConfig {
  const dialogue = getBilingualDialogue({ targetLang, nativeLang, zone: zone === "barber" ? "cafe" : zone, stepIndex: 0 });

  const targetKey = targetLang in SCENARIOS ? targetLang : "ja";
  const scenarioGroup = SCENARIOS[targetKey];
  const zoneKey = zone === "bus_stop" ? "bus_stop" : zone === "taxi" ? "taxi" : zone === "barber" ? "barber" : "cafe";
  const scenario = scenarioGroup[zoneKey] || scenarioGroup["cafe"];
  const objectives = scenario.steps.map((s) => s.objective);

  const cityMap: Record<string, { city: string; country: string; language: string }> = {
    ja: { city: "Tokyo", country: "Japan", language: "Japanese" },
  };

  const meta = cityMap[targetKey] || cityMap.ja;
  const nativeName =
    SUPPORTED_LEARNER_LANGUAGES.find((lang) => lang.code === nativeLang)?.name ?? "Japanese";

  if (zone === "barber") {
    const barberNpcTarget = "こんにちは！床屋へようこそ。";
    const barberNpcTranslation = "こんにちは！床屋へようこそ。カットはいかがですか？";
    const barberUserTarget = "散髪をお願いします。";
    const barberUserNative = "散髪をお願いします。";

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

PRONUNCIATION RULES:
- The learner is practising pronunciation. The app shows them the phrase to say and updates it each step; judge what they just said against the phrase the conversation is currently on.
- If their words differ from it: briefly name the word that was wrong, then say the full correct phrase slowly and clearly, then stop and wait for them to try again.
- Do not move the conversation forward until they have said it correctly, or until they have tried 3 times.
- Never mock or over-praise a mistake; stay short and practical.
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
- If the learner is confused or speaks ${nativeName}, gently guide them with the phrase in ${meta.language} and its meaning.
- Current objective: "${dialogue.objective}".
- Guide the user toward replying with: "${dialogue.userSuggestedTarget}" (${dialogue.userSuggestedNative}).

PRONUNCIATION RULES:
- The learner is practising pronunciation. The app shows them the phrase to say and updates it each step; judge what they just said against the phrase the conversation is currently on.
- If their words differ from it: briefly name the word that was wrong, then say the full correct phrase slowly and clearly, then stop and wait for them to try again.
- Do not move the conversation forward until they have said it correctly, or until they have tried 3 times.
- Never mock or over-praise a mistake; stay short and practical.
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
  const scenario = getMultilingualScenario(targetLang, "ja", "barber");
  const greetingTranslation = scenario.dialogue.npcNativeTranslation;
  const suggestionTranslation = scenario.dialogue.userSuggestedNative;
  return [
    {
      text: scenario.greeting,
      phonetic: "",
      translations: { ja: greetingTranslation },
    },
    {
      text: scenario.dialogue.npcTargetText,
      phonetic: "",
      translations: { ja: greetingTranslation },
    },
    {
      text: scenario.dialogue.userSuggestedTarget,
      phonetic: "",
      translations: { ja: suggestionTranslation },
    },
  ];
}
