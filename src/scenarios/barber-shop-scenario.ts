/**
 * World position of the barber shop in the 3D scene (Three.js coordinates).
 * Located in the left-bottom (south-west) corner of the plot immediately to the right of Central Park (plot-1-2).
 * Sits along the western edge of plot-1-2 facing towards the road separating the park and the plot:
 * - Central Park: x in [-118, 26], z in [-118, 26]
 * - Boulevard Road: x in [26, 46]
 * - Plot-1-2 (Right of Park): x in [46, 118], z in [-118, 26]
 * - Barber Shop: { x: 58, z: -68 } (Plot-1-2, bottom-left quadrant facing West towards the road)
 */
export const BARBER_SHOP_WORLD_POSITION = {
  x: 58,
  z: -68,
} as const;

export interface BarberShopScenarioConfig {
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

export const DEFAULT_BARBER_SHOP_SCENARIO: BarberShopScenarioConfig = {
  id: "barber_shop_global_1",
  npcName: "Marco",
  npcRole: "Master Barber",
  location: "Vintage Barber Salon",
  city: "Barcelona",
  targetLanguage: "Spanish",
  systemPrompt: `You are Marco, a friendly master barber at the Vintage Barber Salon located in the transit plaza on the plot immediately to the right of Central Park in Barcelona.
You speak conversational Spanish and help travelers choose a haircut, styling, or traditional shave.`,
  greeting: "¡Hola! Bienvenido a la barbería. ¿Deseas un corte de pelo o arreglo de barba hoy?",
  interactionRadius: 12,
  objectives: [
    "Greet the barber in the local language",
    "Specify your haircut or shave preference",
    "Confirm the styling and say thank you",
  ],
  contextPayload: {
    location: "Vintage Barber Salon, Plot-1-2",
    npcType: "barber",
    zone: "barber",
  },
};
