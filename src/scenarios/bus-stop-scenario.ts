/**
 * Bus Stop scenario and world position.
 * Located on the west terracotta footpath of Central Park (plot-1-1), directly opposite the coffee shop.
 * The NPC is Suresh, a helpful bus conductor on Route 23C heading to T Nagar.
 */
export interface BusStopScenario {
  id: string;
  npcName: string;
  npcRole: string;
  location: string;
  city: string;
  busNumber: string;
  destination: string;
  targetLanguage: string;
  targetLanguageCode: string;
  interactionRadius: number;
  systemPrompt: string;
  greeting: string;
  objectives: string[];
}

export const BUS_STOP_SCENARIO: BusStopScenario = {
  id: "chennai-bus-stop-1",
  npcName: "Suresh",
  npcRole: "Bus Conductor",
  location: "Park Avenue Transit Plaza",
  city: "Chennai",
  busNumber: "23C",
  destination: "T Nagar",
  targetLanguage: "Japanese",
  targetLanguageCode: "ja",
  interactionRadius: 12,

  systemPrompt: `You are Suresh, a bus conductor on bus 23C in Chennai, India.
Your bus is stopped at the Park Avenue Transit Plaza right by City Park, heading to T Nagar.
You are helping a foreign traveler buy a ticket in Japanese.

PERSONALITY:
- Brisk, efficient, friendly, and practical
- Speak with the rhythm of an active Indian city bus conductor
- Use simple Japanese phrases with romaji and their meaning
- Keep responses short (1-2 sentences)

OBJECTIVE:
Help the player ask for a ticket to T Nagar and understand the fare.`,

  greeting: "T Nagar! T Nagar! Bus 23C is leaving soon. 切符は要りますか？",

  objectives: [
    "Ask if this bus goes to T Nagar in Japanese",
    "Ask for the ticket fare in Japanese",
    "Say thank you and confirm your seat",
  ],
};

/**
 * World position of the bus stop in the 3D scene (Three.js coordinates).
 * Located on the west terracotta footpath of Central Park (plot-1-1), directly opposite the coffee shop.
 */
export const BUS_STOP_WORLD_POSITION = {
  x: -112,
  z: -68,
} as const;
