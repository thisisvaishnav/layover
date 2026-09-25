import { AABB, Hotspot, Position3D } from "./types";

/**
 * Unified Transit Plaza Bounds:
 * A seamless 48m x 26m district hosting:
 * - West Wing (x: -24 to -6): Madrid Café de la Luna
 * - Central Courtyard (x: -6 to +6): City Bus Stop
 * - East Wing (x: +6 to +24): International Airport Terminal Gate B12
 */
export const UNIFIED_PLAZA_BOUNDS: AABB = {
  minX: -24.0,
  maxX: 24.0,
  minZ: -12.0,
  maxZ: 12.0,
};

export type PlazaZone = "cafe" | "bus_stop" | "airport";

export const PLAZA_SPAWN_POINTS: Record<string, Position3D> = {
  cafe: { x: -14.0, y: 0, z: 2.0 },
  bus_stop: { x: 0.0, y: 0, z: 2.5 },
  bus: { x: 0.0, y: 0, z: 2.5 },
  airport: { x: 14.0, y: 0, z: 2.0 },
};

export function getSpawnPositionForZone(zoneOrPlace?: string): Position3D {
  if (!zoneOrPlace) return PLAZA_SPAWN_POINTS.cafe;
  const key = zoneOrPlace.toLowerCase();
  if (key.includes("airport") || key.includes("gate") || key.includes("aeropuerto")) {
    return PLAZA_SPAWN_POINTS.airport;
  }
  if (key.includes("bus") || key.includes("autobus") || key.includes("stop")) {
    return PLAZA_SPAWN_POINTS.bus_stop;
  }
  return PLAZA_SPAWN_POINTS.cafe;
}

export function getZoneFromPosition(pos: Position3D): PlazaZone {
  if (pos.x < -6.0) return "cafe";
  if (pos.x > 6.0) return "airport";
  return "bus_stop";
}

/**
 * Solid obstacles across the unified plaza
 */
export const UNIFIED_PLAZA_OBSTACLES: AABB[] = [
  // --- 1. CAFÉ ZONE (WEST WING: x around -14) ---
  // Main barista wooden counter
  { minX: -16.8, maxX: -11.2, minZ: -3.5, maxZ: -2.0 },
  // Pastry glass vitrine
  { minX: -11.2, maxX: -9.2, minZ: -3.5, maxZ: -2.2 },
  // Espresso machine & back bar shelf
  { minX: -16.0, maxX: -13.5, minZ: -4.8, maxZ: -3.6 },
  // Café bistro table 1
  { minX: -18.5, maxX: -17.0, minZ: 0.5, maxZ: 2.0 },
  // Café bistro table 2
  { minX: -11.0, maxX: -9.5, minZ: 1.0, maxZ: 2.5 },

  // --- 2. BUS STOP ZONE (CENTRAL COURTYARD: x around 0) ---
  // Bus shelter glass back wall & bench
  { minX: -2.5, maxX: 2.5, minZ: -4.2, maxZ: -3.2 },
  // Bus route totem pillar sign
  { minX: 3.0, maxX: 3.8, minZ: -3.5, maxZ: -2.7 },
  // Streetlamp & planter
  { minX: -4.2, maxX: -3.2, minZ: -1.0, maxZ: 0.0 },

  // --- 3. AIRPORT ZONE (EAST WING: x around +14) ---
  // Airport Gate check-in podium desk
  { minX: 11.5, maxX: 16.5, minZ: -3.5, maxZ: -2.0 },
  // Baggage drop conveyor & weight scale
  { minX: 8.8, maxX: 11.2, minZ: -3.5, maxZ: -2.2 },
  // Flight departures LED display board
  { minX: 13.0, maxX: 15.0, minZ: -5.0, maxZ: -3.8 },
  // Terminal waiting lounge seats
  { minX: 10.5, maxX: 12.0, minZ: 1.0, maxZ: 3.0 },
  { minX: 16.0, maxX: 17.5, minZ: 1.0, maxZ: 3.0 },
];

/**
 * Interactive Hotspots across all 3 zones in the unified world
 */
export const UNIFIED_PLAZA_HOTSPOTS: Hotspot[] = [
  // --- ZONE 1: CAFÉ ---
  {
    id: "barista_mateo",
    title: "Café de la Luna · Mateo",
    subtitle: "Barista Mateo · Spanish Coffee & Tapas",
    npcName: "Mateo",
    position: { x: -14.0, y: 0, z: -1.4 },
    interactionRadius: 2.4,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Mateo",
    iconName: "coffee",
    culturalNote:
      "In Spain, asking for 'un café con leche' is standard for breakfast. You can specify temperature like 'templado' (lukewarm).",
    spanishPhrases: [
      "¡Hola! ¿Me pones un café con leche templado?",
      "Quisiera un croissant y agua sin gas, por favor.",
      "¿Cuánto es todo?",
    ],
    vocabulary: [
      { spanish: "Café con leche", english: "Coffee with milk", phonetics: "kah-FEH kohn LEH-cheh" },
      { spanish: "Templado", english: "Lukewarm / warm", phonetics: "tehm-PLAH-doh" },
      { spanish: "La cuenta", english: "The bill / check", phonetics: "lah KWEHN-tah" },
    ],
  },
  {
    id: "pastry_case",
    title: "Vitrina de Pasteles",
    subtitle: "Pastries & Fresh Bakery",
    position: { x: -10.2, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver pasteles y bocadillos",
    iconName: "croissant",
    culturalNote: "A traditional Spanish mid-morning snack is 'media tostada con tomate y aceite'.",
    spanishPhrases: ["¿Tienen tostada con tomate?", "¿El cruasán es del día?"],
    vocabulary: [
      { spanish: "Tostada", english: "Toast", phonetics: "tohs-TAH-dah" },
      { spanish: "Zumo de naranja", english: "Orange juice", phonetics: "THOO-moh deh nah-RAHN-hah" },
    ],
  },

  // --- ZONE 2: BUS STOP ---
  {
    id: "bus_conductor",
    title: "Parada de Autobús · Srinivas",
    subtitle: "Conductor / Dispatcher Srinivas",
    npcName: "Srinivas",
    position: { x: 0.0, y: 0, z: -2.4 },
    interactionRadius: 2.4,
    actionKeyPrompt: "[Espacio / Mic] Speak with Conductor",
    iconName: "book-open",
    culturalNote:
      "Public transit ticket booths and drivers expect you to state your destination clearly before paying.",
    spanishPhrases: [
      "¿Este autobús va hacia el centro?",
      "Un billete sencillo para Golconda, por favor.",
      "¿A qué hora sale el próximo?",
    ],
    vocabulary: [
      { spanish: "Billete", english: "Ticket", phonetics: "bee-YEH-teh" },
      { spanish: "Próxima parada", english: "Next stop", phonetics: "PROHK-see-mah pah-RAH-dah" },
      { spanish: "¿Cuánto cuesta?", english: "How much does it cost?", phonetics: "KWAHN-toh KWEHS-tah" },
    ],
  },
  {
    id: "bus_route_map",
    title: "Plano de Rutas y Horarios",
    subtitle: "Bus Transit Schedules & Routes",
    position: { x: 3.4, y: 0, z: -2.0 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Consultar líneas y frecuencias",
    iconName: "book-open",
    culturalNote: "Buses usually run every 10-15 minutes on metro trunk routes.",
    spanishPhrases: ["¿Qué línea pasa por la estación?", "¿Dónde está la parada más cercana?"],
    vocabulary: [
      { spanish: "Línea", english: "Route line", phonetics: "LEE-neh-ah" },
      { spanish: "Horario", english: "Timetable / schedule", phonetics: "oh-RAH-ree-oh" },
    ],
  },

  // --- ZONE 3: AIRPORT GATE ---
  {
    id: "airport_agent",
    title: "Puerta B12 · Agente Elena",
    subtitle: "Flight Boarding & Baggage Check-in",
    npcName: "Elena",
    position: { x: 14.0, y: 0, z: -1.4 },
    interactionRadius: 2.4,
    actionKeyPrompt: "[Espacio / Mic] Check in with Elena",
    iconName: "credit-card",
    culturalNote:
      "At international boarding gates, always have your boarding pass and passport open and ready.",
    spanishPhrases: [
      "Buenas tardes, vengo a facturar mi equipaje.",
      "¿Mi vuelo sale a tiempo?",
      "¿Puedo llevar una maleta de mano adicional?",
    ],
    vocabulary: [
      { spanish: "Tarjeta de embarque", english: "Boarding pass", phonetics: "tar-HEH-tah deh ehm-BAR-keh" },
      { spanish: "Equipaje de mano", english: "Carry-on luggage", phonetics: "eh-kee-PAH-heh deh MAH-noh" },
      { spanish: "Puerta de embarque", english: "Boarding gate", phonetics: "PWEHR-tah deh ehm-BAR-keh" },
    ],
  },
  {
    id: "baggage_scale",
    title: "Báscula de Equipajes B12",
    subtitle: "Baggage Drop & Weight Scale",
    position: { x: 10.0, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Pesar maleta",
    iconName: "utensils",
    culturalNote: "Standard European short-haul flights permit up to 23kg for checked baggage.",
    spanishPhrases: ["¿Cuánto pesa mi maleta?", "¿Hay sobrepeso?"],
    vocabulary: [
      { spanish: "Peso", english: "Weight", phonetics: "PEH-soh" },
      { spanish: "Kilos", english: "Kilograms", phonetics: "KEE-lohs" },
    ],
  },
];
