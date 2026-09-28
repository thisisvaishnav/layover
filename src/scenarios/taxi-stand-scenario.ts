/**
 * World position of the taxi stand in the 3D scene (Three.js coordinates).
 * Located in Plot-1-0 (the south-west plot, west of Central Park) inside the open
 * south-east apron left free by the L-shaped multi-story parking garage (the garage
 * fills the north and west wings), hugging the curb of the north-south boulevard
 * that runs along the plot's eastern edge.
 */
export const TAXI_STAND_WORLD_POSITION = {
  x: -150,
  z: -80,
} as const;

/**
 * Y-axis rotation so the bay row runs north-south, parallel to that boulevard:
 * - passenger shelter, totem and bollards end up on the west (courtyard) side
 * - marked bays and stationed cabs end up against the eastern curb
 * - cabs face north, matching the northbound lane of the adjacent road
 */
export const TAXI_STAND_ROTATION = -Math.PI / 2;

export interface TaxiStandScenarioConfig {
  id: string;
  npcName: string;
  npcRole: string;
  location: string;
  city: string;
  targetLanguage: string;
  systemPrompt: string;
  greeting: string;
  objectives: string[];
  contextPayload: Record<string, string>;
  interactionRadius?: number;
}

export const DEFAULT_TAXI_STAND_SCENARIO: TaxiStandScenarioConfig = {
  id: "taxi_stand_global_1",
  npcName: "Javier",
  npcRole: "Taxi Driver",
  location: "City Central Taxi Stand",
  city: "Tokyo",
  targetLanguage: "Japanese",
  systemPrompt: `You are Javier, a friendly local taxi driver stationed at the City Central Taxi Stand next to the multi-story parking building in Tokyo.
You speak conversational Japanese and help travelers get to their destination safely.`,
  greeting: "こんにちは！今日はどちらまでお連れしましょうか？",
  interactionRadius: 12,
  objectives: [
    "Greet the taxi driver in the local language",
    "State your destination clearly",
    "Ask for the estimated fare and say thank you",
  ],
  contextPayload: {
    location: "City Central Taxi Stand, Plot-1-0",
    npcType: "taxi_driver",
    zone: "taxi",
  },
};
