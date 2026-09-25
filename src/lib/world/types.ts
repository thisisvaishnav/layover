export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface VocabularyItem {
  spanish: string;
  english: string;
  phonetics?: string;
  tip?: string;
}

export interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  npcName?: string;
  position: Position3D;
  interactionRadius: number;
  actionKeyPrompt: string;
  spanishPhrases: string[];
  vocabulary: VocabularyItem[];
  culturalNote: string;
  iconName: "coffee" | "croissant" | "book-open" | "credit-card" | "utensils" | "shopping-cart" | "plane" | "hotel" | "pill" | "sparkles";
}
