export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  accentColor: string;
  destinationsCount: number;
}

export interface DestinationOption {
  id: string;
  name: string;
  category: "coffee" | "bakery" | "restaurant" | "street_food" | "market";
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
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: "es",
    name: "Español (España)",
    nativeName: "Castellano",
    flag: "🇪🇸",
    accentColor: "from-amber-600 to-amber-500",
    destinationsCount: 2,
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
    categoryLabel: "Cafetería y Barra Castiza",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Mateo",
    npcRole: "Barista & Dueño",
    difficulty: "Principiante",
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
    id: "spain-tapas-bar",
    name: "Taberna El Chulapo",
    category: "restaurant",
    categoryLabel: "Bar de Tapas & Cañas",
    city: "Madrid",
    country: "España",
    flag: "🇪🇸",
    languageCode: "es",
    npcName: "Lucía",
    npcRole: "Camarera",
    difficulty: "Intermedio",
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
    categoryLabel: "Panadería & Pastelería",
    city: "París",
    country: "Francia",
    flag: "🇫🇷",
    languageCode: "fr",
    npcName: "Mme. Dubois",
    npcRole: "Maître Boulangère",
    difficulty: "Principiante",
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
    categoryLabel: "Bar de Ramen en Barra",
    city: "Tokio",
    country: "Japón",
    flag: "🇯🇵",
    languageCode: "ja",
    npcName: "Kenji",
    npcRole: "Taisho (Chef)",
    difficulty: "Intermedio",
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
    categoryLabel: "Trattoria & Heladería",
    city: "Roma",
    country: "Italia",
    flag: "🇮🇹",
    languageCode: "it",
    npcName: "Marco",
    npcRole: "Cameriere",
    difficulty: "Principiante",
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
    categoryLabel: "Taquería de Calle",
    city: "Ciudad de México",
    country: "México",
    flag: "🇲🇽",
    languageCode: "es-mx",
    npcName: "Don Chava",
    npcRole: "Taquero Mayor",
    difficulty: "Intermedio",
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
