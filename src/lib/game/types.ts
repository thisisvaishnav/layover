export type GameLevel = 1 | 2 | 3 | 4;

export interface LevelInfo {
  level: GameLevel;
  title: string;
  subtitle: string;
  description: string;
  goal: string;
  targetPhrases: string[];
  unexpectedEvent?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  spanishName: string;
  quantity: number;
  priceEur: number;
  modifications: string[];
}

export type BaristaEmotion =
  | "friendly"
  | "curious"
  | "busy"
  | "apologetic"
  | "pleased";

export type BaristaAction =
  | "idle"
  | "listening"
  | "speaking"
  | "brewing"
  | "serving"
  | "apologizing";

export interface GameObjective {
  id: string;
  level: GameLevel;
  label: string;
  hintSpanish: string;
  hintEnglish: string;
  completed: boolean;
}

export interface FluencyEvaluation {
  overallScore: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  city: string;
  country: string;
  locationName: string;
  npcName: string;
  npcRole: string;
  systemPrompt: string;
  initialGreeting: string;
  voice: string;
  levels: Record<GameLevel, LevelInfo>;
  menuItems: Array<{
    id: string;
    spanishName: string;
    englishName: string;
    priceEur: number;
  }>;
}
