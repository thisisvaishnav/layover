export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  accentColor: string;
  destinationsCount: number;
}

export interface OnboardingCountry {
  code: string;
  country: string;
  language: string;
  nativeName: string;
  flag: string;
  tagline: string;
}

export const ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  {
    code: "es",
    country: "Spain",
    language: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    tagline: "Madrid & Barcelona",
  },
  {
    code: "hi",
    country: "India",
    language: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    tagline: "Delhi & Mumbai",
  },
  {
    code: "ja",
    country: "Japan",
    language: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    tagline: "Tokyo & Kyoto",
  },
  {
    code: "fr",
    country: "France",
    language: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    tagline: "Paris & Lyon",
  },
  {
    code: "it",
    country: "Italy",
    language: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    tagline: "Rome & Florence",
  },
];

export const DEFAULT_STARTING_PLACE = "cafe";

export interface DestinationOption {
  id: string;
  name: string;
  category: "coffee" | "bakery" | "restaurant" | "street_food" | "market" | "grocery" | "airport" | "hotel" | "pharmacy";
  placeType?: "coffee" | "grocery" | "airport" | "hotel" | "pharmacy" | "restaurant" | "bakery";
  categoryLabel: string;
  city: string;
  country: string;
  flag: string;
  languageCode: string;
  npcName: string;
  npcRole: string;
  difficulty: "Principiante" | "Intermedio" | "Avanzado";
  description: string;
  learningHighlights: string[];
  status: "live" | "coming_soon";
  bgGradient: string;
  worldCode?: string;
  simpleMission?: string;
  stars?: number;
  bossIcon?: string;
  simpleHighlights?: string[];
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: "es",
    name: "Español (España)",
    nativeName: "Castellano",
    flag: "🇪🇸",
    accentColor: "from-amber-600 to-amber-500",
    destinationsCount: 6,
  },
  {
    code: "fr",
    name: "Francés",
    nativeName: "Français",
    flag: "🇫🇷",
    accentColor: "from-blue-600 to-indigo-500",
    destinationsCount: 1,
  },
  {
    code: "ja",
    name: "Japonés",
    nativeName: "日本語",
    flag: "🇯🇵",
    accentColor: "from-rose-600 to-red-500",
    destinationsCount: 1,
  },
  {
    code: "it",
    name: "Italiano",
    nativeName: "Italiano",
    flag: "🇮🇹",
    accentColor: "from-emerald-600 to-teal-500",
    destinationsCount: 1,
  },
  {
    code: "es-mx",
    name: "Español (México)",
    nativeName: "Español Mexicano",
    flag: "🇲🇽",
    accentColor: "from-teal-600 to-emerald-500",
    destinationsCount: 1,
  },
];

export const DESTINATIONS: DestinationOption[] = [
  {
    id: "spain-madrid-cafe",
    name: "Café de la Luna",
    category: "coffee",
    placeType: "coffee",
    categoryLabel: "Coffee Shop",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Mateo",
    npcRole: "Barista",
    difficulty: "Principiante",
    worldCode: "WORLD 1-1",
    simpleMission: "Order hot coffee, warm milk & sweet churros!",
    stars: 1,
    bossIcon: "☕",
    simpleHighlights: ["Say hello & please", "Choose your milk", "Pay with coins"],
    description:
      "Sumérgete en el bullicioso Barrio de las Letras. Explora la vitrina de churros y porras, pide un café con leche templado y resuelve imprevistos con Mateo.",
    learningHighlights: [
      "Variedades de café en España (solo, cortado, con leche)",
      "Pedir temperatura y leche personalizada",
      "Pagar con tarjeta o efectivo ante fallos del datáfono",
    ],
    status: "live",
    bgGradient: "from-amber-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "place-grocery-store",
    name: "Supermercado Central",
    category: "grocery",
    placeType: "grocery",
    categoryLabel: "Grocery Store",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Elena",
    npcRole: "Cashier & Grocer",
    difficulty: "Principiante",
    worldCode: "WORLD 1-2",
    simpleMission: "Buy fresh fruits, bread & pay at checkout!",
    stars: 1,
    bossIcon: "🛒",
    simpleHighlights: ["Ask where items are", "Weigh fresh fruit", "Ask for a bag & receipt"],
    description:
      "Explora los pasillos del supermercado. Pesa fruta fresca en la báscula, pregunta por el pan del día y paga en caja con Elena.",
    learningHighlights: [
      "Nombres de frutas, verduras y lácteos",
      "Preguntar precios y pesar por kilos",
      "Pedir bolsa y pagar en la caja registradora",
    ],
    status: "live",
    bgGradient: "from-emerald-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "place-airport-terminal",
    name: "Aeropuerto Barajas · Gate B12",
    category: "airport",
    placeType: "airport",
    categoryLabel: "Airport Gate",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Sofia",
    npcRole: "Flight Gate Agent",
    difficulty: "Intermedio",
    worldCode: "WORLD 1-3",
    simpleMission: "Check in your luggage & find your boarding gate!",
    stars: 2,
    bossIcon: "✈️",
    simpleHighlights: ["Show passport & ticket", "Drop off heavy luggage", "Find your flight gate"],
    description:
      "Navega por la concurrida terminal del aeropuerto. Muestra tu pasaporte, factura maletas pesadas y pregunta la puerta de embarque.",
    learningHighlights: [
      "Facturación de equipaje de mano y bodega",
      "Entender anuncios de vuelos y retrasos",
      "Preguntar por la puerta de embarque correcta",
    ],
    status: "live",
    bgGradient: "from-sky-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "place-hotel-desk",
    name: "Gran Hotel Plaza",
    category: "hotel",
    placeType: "hotel",
    categoryLabel: "Hotel Front Desk",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Javier",
    npcRole: "Hotel Concierge",
    difficulty: "Principiante",
    worldCode: "WORLD 1-4",
    simpleMission: "Check in to your room, get key & ask for Wi-Fi!",
    stars: 1,
    bossIcon: "🏨",
    simpleHighlights: ["Say reservation name", "Ask for Wi-Fi password", "Ask breakfast time"],
    description:
      "Haz el check-in en la recepción del hotel. Consigue la llave de tu habitación, la contraseña del Wi-Fi y pregunta por el desayuno.",
    learningHighlights: [
      "Fórmulas de check-in y reserva",
      "Preguntar horarios de desayuno y salida (check-out)",
      "Pedir toallas o indicaciones de la ciudad",
    ],
    status: "live",
    bgGradient: "from-amber-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "place-pharmacy",
    name: "Farmacia San Lucas",
    category: "pharmacy",
    placeType: "pharmacy",
    categoryLabel: "Pharmacy",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Dr. Clara",
    npcRole: "Pharmacist",
    difficulty: "Intermedio",
    worldCode: "WORLD 1-5",
    simpleMission: "Ask for headache medicine & band-aids!",
    stars: 2,
    bossIcon: "💊",
    simpleHighlights: ["Explain what hurts", "Ask how many pills to take", "Pay at counter"],
    description:
      "Pide consejo a la farmacéutica. Explica tus síntomas, compra tiritas y analgésicos para continuar tu viaje sin dolor.",
    learningHighlights: [
      "Partes del cuerpo y síntomas comunes de viaje",
      "Posología: cuántas pastillas y cada cuántas horas",
      "Pedir tiritas y medicamentos sin receta",
    ],
    status: "live",
    bgGradient: "from-teal-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "spain-tapas-bar",
    name: "Taberna El Chulapo",
    category: "restaurant",
    placeType: "restaurant",
    categoryLabel: "Tapas Restaurant",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Lucía",
    npcRole: "Tapas Host",
    difficulty: "Intermedio",
    worldCode: "WORLD 1-6",
    simpleMission: "Order spicy bravas & cold drinks!",
    stars: 2,
    bossIcon: "🍽️",
    simpleHighlights: ["Order tapas plates", "Ask for cold drinks", "Ask for the bill"],
    description:
      "Pide raciones de patatas bravas, croquetas y pinchos de tortilla en una clásica taberna madrileña con mucho ambiente.",
    learningHighlights: [
      "Pedir cañas y dobles de cerveza",
      "Preguntar por alérgenos e ingredientes",
      "Pedir la cuenta en la barra",
    ],
    status: "live",
    bgGradient: "from-orange-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "france-paris-bakery",
    name: "Boulangerie Saint-Germain",
    category: "bakery",
    placeType: "bakery",
    categoryLabel: "Bakery",
    city: "París",
    country: "Francia",
    flag: "🇫🇷",
    languageCode: "fr",
    npcName: "Mme. Dubois",
    npcRole: "Master Baker",
    difficulty: "Principiante",
    worldCode: "WORLD 2-1",
    simpleMission: "Buy fresh baguette & croissant!",
    stars: 1,
    bossIcon: "🥐",
    simpleHighlights: ["Bonjour & s'il vous plaît", "Pick baked goods", "Merci & au revoir"],
    description:
      "Aprende a pedir baguettes 'bien cuites', pains au chocolat y tartes aux pommes con la cortesía y formalidad francesa adecuada.",
    learningHighlights: [
      "Fórmulas de cortesía francesas (s'il vous plaît)",
      "Términos de horneado y bollería fina",
      "Manejo de monedas de euro",
    ],
    status: "live",
    bgGradient: "from-blue-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "japan-tokyo-ramen",
    name: "Shinjuku Men-ya",
    category: "restaurant",
    placeType: "restaurant",
    categoryLabel: "Ramen Bar",
    city: "Tokio",
    country: "Japón",
    flag: "🇯🇵",
    languageCode: "ja",
    npcName: "Kenji",
    npcRole: "Ramen Chef",
    difficulty: "Intermedio",
    worldCode: "WORLD 3-1",
    simpleMission: "Order hot ramen & custom noodles!",
    stars: 2,
    bossIcon: "🍜",
    simpleHighlights: ["Greeting in ramen bar", "Firm or soft noodles", "Say thanks for food"],
    description:
      "Interactúa con la máquina de tickets de ramen, especifica la firmeza de los fideos (katame) y la riqueza del caldo tonkotsu.",
    learningHighlights: [
      "Frases de entrada y salida (Irasshaimase, Gochisousama)",
      "Personalización de caldo y fideos",
      "Etiqueta en barra de comida japonesa",
    ],
    status: "live",
    bgGradient: "from-rose-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "italy-rome-trattoria",
    name: "Trattoria & Gelato Navona",
    category: "restaurant",
    placeType: "restaurant",
    categoryLabel: "Trattoria",
    city: "Roma",
    country: "Italia",
    flag: "🇮🇹",
    languageCode: "it",
    npcName: "Marco",
    npcRole: "Italian Waiter",
    difficulty: "Principiante",
    worldCode: "WORLD 4-1",
    simpleMission: "Order fresh pasta & sweet gelato!",
    stars: 1,
    bossIcon: "🍝",
    simpleHighlights: ["Italian greetings", "Pick gelato cup or cone", "Ask for the check"],
    description:
      "Pide una auténtica cacio e pepe, pregunta por los sabores de helado del día (coppetta o cono) y pide el recibo con cortesía.",
    learningHighlights: [
      "Distinción entre antipasti, primi y secondi",
      "Sabores de gelato artesanal italiano",
      "Pedir 'il conto' sin confusiones",
    ],
    status: "live",
    bgGradient: "from-emerald-950/70 via-stone-900 to-stone-950",
  },
  {
    id: "mexico-cdmx-tacos",
    name: "Taquería Los Parados",
    category: "street_food",
    placeType: "restaurant",
    categoryLabel: "Taco Stand",
    city: "Ciudad de México",
    country: "México",
    flag: "🇲🇽",
    languageCode: "es-mx",
    npcName: "Don Chava",
    npcRole: "Master Taquero",
    difficulty: "Intermedio",
    worldCode: "WORLD 5-1",
    simpleMission: "Order 3 tacos al pastor with lime!",
    stars: 2,
    bossIcon: "🌮",
    simpleHighlights: ["Order street tacos", "Choose mild or spicy salsa", "Pay with coins"],
    description:
      "Pide tacos al pastor con copia, cilantro y piña. Aprende a calibrar el picante de las salsas y a pedir aguas frescas.",
    learningHighlights: [
      "Jerga taquera mexicana (con todo, con copia)",
      "Nivel de picante de las salsas",
      "Cálculo de la propina y pago",
    ],
    status: "live",
    bgGradient: "from-teal-950/70 via-stone-900 to-stone-950",
  },
];

export const PLACES_CATEGORIES = [
  { id: "all", label: "All Places", icon: "🗺️" },
  { id: "coffee", label: "Coffee Shop", icon: "☕" },
  { id: "grocery", label: "Grocery Store", icon: "🛒" },
  { id: "airport", label: "Airport", icon: "✈️" },
  { id: "hotel", label: "Hotel Desk", icon: "🏨" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "bakery", label: "Bakery", icon: "🥐" },
] as const;

export function findDestinationById(idOrPlace: string): DestinationOption {
  const match =
    DESTINATIONS.find((d) => d.id === idOrPlace || d.placeType === idOrPlace) ||
    DESTINATIONS[0];
  return match;
}

