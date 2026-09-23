import { create } from "zustand";
import {
  GameLevel,
  OrderItem,
  BaristaAction,
  BaristaEmotion,
  GameObjective,
  FluencyEvaluation,
} from "./types";
import { TranscriptMessage } from "../voice-agent/types";
import { SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";

const INITIAL_OBJECTIVES: GameObjective[] = [
  {
    id: "obj-l1-greet-order",
    level: 1,
    label: "Saluda y pide tu café",
    hintSpanish: "¡Hola! ¿Me pones un café con leche, por favor?",
    hintEnglish: "Hello! Can I have an espresso with milk, please?",
    completed: false,
  },
  {
    id: "obj-l2-customize",
    level: 2,
    label: "Personaliza tu leche o azúcar",
    hintSpanish: "¿Lo tienes con leche de avena? Y sin azúcar.",
    hintEnglish: "Do you have oat milk? And without sugar.",
    completed: false,
  },
  {
    id: "obj-l3-travel-chat",
    level: 3,
    label: "Comenta tu viaje por Madrid",
    hintSpanish: "Estoy de vacaciones una semana para conocer el Prado.",
    hintEnglish: "I'm on vacation for a week to visit the Prado Museum.",
    completed: false,
  },
  {
    id: "obj-l4-resolve-unexpected",
    level: 4,
    label: "Resuelve el imprevisto con soltura",
    hintSpanish: "No te preocupes, ponme leche entera o pago en efectivo.",
    hintEnglish: "No worries, whole milk is fine or I'll pay cash.",
    completed: false,
  },
];

interface GameState {
  level: GameLevel;
  order: OrderItem[];
  baristaAction: BaristaAction;
  baristaEmotion: BaristaEmotion;
  objectives: GameObjective[];
  transcripts: TranscriptMessage[];
  currentUnexpected: {
    type: string;
    explanation: string;
    resolved: boolean;
  } | null;
  isCompleted: boolean;
  evaluation: FluencyEvaluation | null;
  audioLevel: number;
  pushToTalkActive: boolean;
  isMuted: boolean;
  showTranslation: boolean;

  // Actions
  setLevel: (level: GameLevel) => void;
  addItemToOrder: (name: string, quantity?: number, modifications?: string[]) => void;
  modifyOrderDetails: (details: { milk?: string; sugar?: string; temp?: string }) => void;
  setBaristaAction: (action: BaristaAction) => void;
  setBaristaEmotion: (emotion: BaristaEmotion) => void;
  addTranscriptMessage: (
    sender: "user" | "npc",
    text: string,
    translation?: string
  ) => void;
  completeObjective: (id: string) => void;
  triggerUnexpectedSituation: (type: string, explanation: string) => void;
  resolveUnexpectedSituation: () => void;
  finishGame: (evalData?: Partial<FluencyEvaluation>) => void;
  setAudioLevel: (level: number) => void;
  setPushToTalkActive: (active: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  toggleTranslation: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  level: 1,
  order: [],
  baristaAction: "idle",
  baristaEmotion: "friendly",
  objectives: INITIAL_OBJECTIVES,
  transcripts: [
    {
      id: "initial-greeting",
      sender: "npc",
      text: SPAIN_CAFE_SCENARIO.initialGreeting,
      translation:
        "Hello, good day! Welcome to Café de la Luna. What can I get you today?",
      timestamp: Date.now(),
      isFinal: true,
    },
  ],
  currentUnexpected: null,
  isCompleted: false,
  evaluation: null,
  audioLevel: 0,
  pushToTalkActive: false,
  isMuted: false,
  showTranslation: true,

  setLevel: (level) => {
    set({ level });
    // Update barista reaction
    set({ baristaEmotion: "curious" });
  },

  addItemToOrder: (name, quantity = 1, modifications = []) => {
    // Look up in menu
    const found = SPAIN_CAFE_SCENARIO.menuItems.find(
      (m) =>
        m.spanishName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(m.id)
    );

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      name: found ? found.englishName : name,
      spanishName: found ? found.spanishName : name,
      quantity,
      priceEur: found ? found.priceEur * quantity : 2.5 * quantity,
      modifications,
    };

    set((state) => ({
      order: [...state.order, newItem],
      baristaAction: "brewing",
      baristaEmotion: "pleased",
    }));

    // Check objective 1
    get().completeObjective("obj-l1-greet-order");

    // Automatically transition barista action back to serving then idle
    setTimeout(() => {
      set({ baristaAction: "serving" });
      setTimeout(() => {
        set({ baristaAction: "idle" });
      }, 2500);
    }, 2000);
  },

  modifyOrderDetails: (details) => {
    set((state) => {
      const updatedOrder = state.order.map((item, idx) => {
        if (idx === state.order.length - 1) {
          const mods = [...item.modifications];
          if (details.milk) mods.push(`Leche: ${details.milk}`);
          if (details.sugar) mods.push(`Azúcar: ${details.sugar}`);
          if (details.temp) mods.push(`Temp: ${details.temp}`);
          return { ...item, modifications: mods };
        }
        return item;
      });

      return {
        order: updatedOrder,
        baristaAction: "speaking",
      };
    });

    get().completeObjective("obj-l2-customize");
  },

  setBaristaAction: (action) => set({ baristaAction: action }),
  setBaristaEmotion: (emotion) => set({ baristaEmotion: emotion }),

  addTranscriptMessage: (sender, text, translation) => {
    set((state) => ({
      transcripts: [
        ...state.transcripts,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          sender,
          text,
          translation,
          timestamp: Date.now(),
          isFinal: true,
        },
      ],
    }));

    // If level 3 and user talks about travel/visit, complete objective 3
    if (get().level >= 3 && sender === "user") {
      const lower = text.toLowerCase();
      if (
        lower.includes("viaje") ||
        lower.includes("madrid") ||
        lower.includes("visitar") ||
        lower.includes("vacaciones") ||
        lower.includes("museo") ||
        lower.includes("prado") ||
        lower.includes("días") ||
        lower.includes("españa")
      ) {
        get().completeObjective("obj-l3-travel-chat");
      }
    }
  },

  completeObjective: (id) => {
    set((state) => ({
      objectives: state.objectives.map((obj) =>
        obj.id === id ? { ...obj, completed: true } : obj
      ),
    }));
  },

  triggerUnexpectedSituation: (type, explanation) => {
    set({
      currentUnexpected: {
        type,
        explanation,
        resolved: false,
      },
      baristaAction: "apologizing",
      baristaEmotion: "apologetic",
    });
  },

  resolveUnexpectedSituation: () => {
    set((state) => ({
      currentUnexpected: state.currentUnexpected
        ? { ...state.currentUnexpected, resolved: true }
        : null,
      baristaAction: "speaking",
      baristaEmotion: "friendly",
    }));
    get().completeObjective("obj-l4-resolve-unexpected");
  },

  finishGame: (evalData) => {
    const defaultEval: FluencyEvaluation = {
      overallScore: 92,
      fluency: 88,
      vocabulary: 94,
      grammar: 90,
      feedback:
        "¡Excelente trabajo! Te desenvolviste con naturalidad y manejaste el imprevisto con cortesía española.",
      strengths: [
        "Uso correcto de fórmulas de cortesía ('por favor', 'buenas')",
        "Comprensión rápida ante el imprevisto del barista",
        "Pronunciación clara reconocida sin vacilaciones",
      ],
      improvements: [
        "En España es muy común decir '¿Cuánto es?' al pedir la cuenta",
        "Puedes usar 'marchando' o 'ponme' para sonar aún más local",
      ],
      ...evalData,
    };

    set({
      isCompleted: true,
      evaluation: defaultEval,
      baristaEmotion: "pleased",
    });
  },

  setAudioLevel: (level) => set({ audioLevel: level }),
  setPushToTalkActive: (active) => set({ pushToTalkActive: active }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  toggleTranslation: () =>
    set((state) => ({ showTranslation: !state.showTranslation })),

  resetGame: () => {
    set({
      level: 1,
      order: [],
      baristaAction: "idle",
      baristaEmotion: "friendly",
      objectives: INITIAL_OBJECTIVES,
      transcripts: [
        {
          id: "initial-greeting",
          sender: "npc",
          text: SPAIN_CAFE_SCENARIO.initialGreeting,
          translation:
            "Hello, good day! Welcome to Café de la Luna. What can I get you today?",
          timestamp: Date.now(),
          isFinal: true,
        },
      ],
      currentUnexpected: null,
      isCompleted: false,
      evaluation: null,
      audioLevel: 0,
      pushToTalkActive: false,
    });
  },
}));
