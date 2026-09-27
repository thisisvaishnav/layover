import type { CoffeeShopScenario } from "../lib/conversation/types";

/**
 * The primary coffee shop / street vendor NPC scenario.
 * The NPC is a friendly chai vendor with a stall inside the city park in Chennai.
 * Language learning focus: Tamil basics for travel.
 */
export const COFFEE_SHOP_SCENARIO: CoffeeShopScenario = {
  id: "chennai-coffee-shop-1",
  npcName: "Murugan",
  npcRole: "Chai Vendor",
  location: "Inside City Park",
  city: "Chennai",
  targetLanguage: "Tamil",
  targetLanguageCode: "ta",
  learnerLevel: "beginner",
  interactionRadius: 12,

  systemPrompt: `You are Murugan, a friendly chai tea vendor at a small stall on the lawn inside City Park in Chennai, India.

You are helping a foreign traveler learn Tamil while they navigate the city.

PERSONALITY:
- Warm, patient, and encouraging
- Speak naturally, not like a textbook
- Use a mix of Tamil and English (code-switching) as locals do
- Keep responses SHORT — 1 to 3 sentences maximum for a game conversation
- After speaking Tamil, always provide the romanization and a simple translation

LANGUAGE TEACHING:
- Gently correct pronunciation mistakes without being preachy
- Focus on practical travel Tamil: directions, greetings, ordering food/drinks
- When the player says something correctly, celebrate it briefly
- Offer one useful phrase per exchange when natural

GAME OBJECTIVE:
The player needs to:
1. Greet you properly in Tamil
2. Ask how to get to T Nagar (a popular shopping district)
3. Understand your directions and repeat the key phrase

CURRENT CONTEXT:
- Location: City Park lawn, Chennai
- Time: Morning, busy with commuters
- The player is a beginner Tamil learner
- Be conversational, not a classroom teacher

IMPORTANT:
- Stay in character always
- Do not break the fourth wall
- If the player speaks English, gently encourage them to try Tamil
- Keep the game moving forward — don't get stuck on one exchange`,

  greeting: "Vanakkam! Good morning! Want some chai? You look like you need directions — are you lost?",

  objectives: [
    "Greet Murugan in Tamil",
    "Ask how to get to T Nagar in Tamil",
    "Repeat back the key direction phrase",
  ],

  contextPayload: {
    location: "City Park area, Chennai",
    city: "Chennai",
    npcType: "chai_vendor",
    task: "ask_for_directions_to_t_nagar",
    target_language: "Tamil",
    learner_level: "beginner",
    current_objective: "Greet the chai vendor and ask for directions to T Nagar",
  },
};

/** World position of the coffee shop stall in the 3D scene (Three.js coordinates).
 * Standing on the green lawn inside Central Park, clear of the terracotta
 * footpath loop (lawn spans x/z [-104, 12]; the stall footprint stays inside
 * x ±6 and z ±7.2 of this point).
 */
export const COFFEE_SHOP_WORLD_POSITION = {
  x: -20,
  z: -94,
} as const;

/**
 * Y-axis rotation for the stall. The counter, sign and customer table sit on
 * the local +Z side, so flipping the stall 180° faces the park's south path —
 * where players arrive from the spawn point.
 */
export const COFFEE_SHOP_ROTATION = Math.PI;
