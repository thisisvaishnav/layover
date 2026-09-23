import { AABB, Hotspot } from "./types";

/**
 * Madrid Café Room Dimensions: -6 to +6 in X, -5 to +5 in Z
 */
export const CAFE_BOUNDS: AABB = {
  minX: -6.0,
  maxX: 6.0,
  minZ: -5.0,
  maxZ: 5.0,
};

/**
 * Solid obstacles in the café (Counter, pastry vitrine, tables)
 */
export const CAFE_OBSTACLES: AABB[] = [
  // Main barista wooden counter
  {
    minX: -2.8,
    maxX: 2.8,
    minZ: -3.5,
    maxZ: -2.0,
  },
  // Pastry glass vitrine (right wing of counter)
  {
    minX: 2.8,
    maxX: 4.8,
    minZ: -3.5,
    maxZ: -2.2,
  },
  // Espresso machine & back shelf
  {
    minX: -2.0,
    maxX: 0.5,
    minZ: -4.8,
    maxZ: -3.6,
  },
  // Café table 1 (near window)
  {
    minX: -4.5,
    maxX: -3.0,
    minZ: 0.5,
    maxZ: 2.0,
  },
  // Café table 2
  {
    minX: 3.0,
    maxX: 4.5,
    minZ: 1.0,
    maxZ: 2.5,
  },
];

/**
 * Madrid Café interactive learning hotspots
 */
export const MADRID_CAFE_HOTSPOTS: Hotspot[] = [
  {
    id: "barista_mateo",
    title: "Mostrador de Mateo",
    subtitle: "Habla con el barista Mateo para hacer tu pedido",
    npcName: "Mateo",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Mateo",
    iconName: "coffee",
    culturalNote:
      "En Madrid, al acercarte a la barra se suele saludar con un enérgico '¡Buenas!' o '¡Hola, buenas!'.",
    spanishPhrases: [
      "¡Hola, muy buenas! ¿Me pones un café con leche?",
      "Quisiera un café solo con hielo, por favor.",
      "¿Me lo puedes poner templado, por favor?",
      "¿Tienes leche de avena o de soja?",
    ],
    vocabulary: [
      {
        spanish: "Café con leche",
        english: "Coffee with milk (half espresso, half steamed milk)",
        phonetics: "kah-FEH kohn LEH-cheh",
        tip: "El clásico desayuno español.",
      },
      {
        spanish: "Templado",
        english: "Lukewarm / warm (not scalding hot)",
        phonetics: "tehm-PLAH-doh",
        tip: "Perfecto si tienes prisa y no quieres quemarte la lengua.",
      },
      {
        spanish: "¿Qué te pongo?",
        english: "What can I get you?",
        phonetics: "keh teh POHN-goh",
        tip: "La frase universal de los baristas en España.",
      },
    ],
  },
  {
    id: "pastry_case",
    title: "Vitrina de Bollería y Tapas",
    subtitle: "Explora la bollería tradicional y los dulces típicos",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 1.8,
    actionKeyPrompt: "[E] Inspeccionar vitrina de bollería",
    iconName: "croissant",
    culturalNote:
      "En Madrid es típico mojar los churros o porras recién hechos en chocolate espeso caliente.",
    spanishPhrases: [
      "¿Los churros están recién hechos?",
      "Ponme también una napolitana de chocolate.",
      "¿Tenéis pincho de tortilla para acompañar?",
      "¿El cruasán es de mantequilla?",
    ],
    vocabulary: [
      {
        spanish: "Porras",
        english: "Thick Madrid-style churros",
        phonetics: "POHR-rahs",
        tip: "Más gruesas y esponjosas que los churros finos.",
      },
      {
        spanish: "Napolitana de chocolate",
        english: "Pain au chocolat / chocolate croissant",
        phonetics: "nah-poh-lee-TAH-nah",
        tip: "Muy popular en todas las pastelerías de Madrid.",
      },
      {
        spanish: "Pincho de tortilla",
        english: "Slice of Spanish potato omelette",
        phonetics: "PEEN-choh deh tor-TEE-yah",
        tip: "Acompañado siempre de un trozo de pan.",
      },
    ],
  },
  {
    id: "coffee_board",
    title: "Pizarra de Variedades de Café",
    subtitle: "Aprende los tipos y proporciones de café en España",
    position: { x: -3.8, y: 0, z: -2.8 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver estilos de café",
    iconName: "book-open",
    culturalNote:
      "En España el café no es solo 'café': la cantidad exacta de leche determina su nombre.",
    spanishPhrases: [
      "Un cortado corto de café, por favor.",
      "Un café manchado con leche de soja.",
      "Descafeinado de máquina con leche fría.",
      "Un carajillo de orujo para entrar en calor.",
    ],
    vocabulary: [
      {
        spanish: "Café cortado",
        english: "Espresso with a splash of warm milk",
        phonetics: "kor-TAH-doh",
        tip: "Menos leche que el café con leche, más suave que el solo.",
      },
      {
        spanish: "Café solo",
        english: "Straight black espresso shot",
        phonetics: "kah-FEH SOH-loh",
        tip: "Intenso, servido en taza pequeña.",
      },
      {
        spanish: "Manchado",
        english: "Mostly steamed milk with a drop ('stain') of coffee",
        phonetics: "mahn-CHAH-doh",
        tip: "Ideal si quieres sabor a café muy suave.",
      },
      {
        spanish: "Con hielo",
        english: "Served with a separate glass containing an ice cube",
        phonetics: "kohn YEH-loh",
        tip: "Viertes el café caliente sobre el hielo tú mismo.",
      },
    ],
  },
  {
    id: "pos_register",
    title: "Caja Registradora",
    subtitle: "Paga tu consumición y resuelve imprevistos (Nivel 4)",
    position: { x: -2.0, y: 0, z: -1.6 },
    interactionRadius: 1.8,
    actionKeyPrompt: "[E] Pagar / Ver formas de pago",
    iconName: "credit-card",
    culturalNote:
      "Aunque la tarjeta es común, en pequeños bares de barrio madrileños siempre es prudente llevar monedas de euro.",
    spanishPhrases: [
      "¿Se puede pagar con tarjeta?",
      "No hay problema, tengo efectivo.",
      "¿Tienes cambio de 20 euros?",
      "Quédate con la vuelta.",
    ],
    vocabulary: [
      {
        spanish: "¿Se puede pagar con tarjeta?",
        english: "Can I pay by card?",
        phonetics: "seh PWEH-deh pah-GAHR kohn tar-HEH-tah",
        tip: "Pregunta común antes de sacar el móvil o la tarjeta.",
      },
      {
        spanish: "Efectivo",
        english: "Cash",
        phonetics: "eh-fehk-TEE-voh",
        tip: "Monedas y billetes.",
      },
      {
        spanish: "La vuelta",
        english: "Change (money returned)",
        phonetics: "lah VWEHL-tah",
        tip: "'Quédate con la vuelta' = Keep the change.",
      },
    ],
  },
  {
    id: "terrace_table",
    title: "Mesa del Salón",
    subtitle: "Siéntate a disfrutar de tu consumición y pide la cuenta",
    position: { x: 3.6, y: 0, z: 2.0 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Sentarse en la mesa",
    iconName: "utensils",
    culturalNote:
      "En muchos cafés de España, consumir en la mesa o terraza puede tener un pequeño suplemento respecto a la barra.",
    spanishPhrases: [
      "¿Me cobras cuando puedas, por favor?",
      "¿Nos pones un vaso de agua del grifo?",
      "Estaba todo riquísimo, muchas gracias.",
      "La cuenta, por favor.",
    ],
    vocabulary: [
      {
        spanish: "¿Me cobras cuando puedas?",
        english: "Can you charge me whenever you have a moment?",
        phonetics: "meh KOH-brahs KWAHN-doh PWEH-dahs",
        tip: "Forma muy educada y natural de pedir que te cobren en la mesa.",
      },
      {
        spanish: "Agua del grifo",
        english: "Tap water",
        phonetics: "AH-gwah dehl GREE-foh",
        tip: "En Madrid el agua del grifo de la sierra es famosa por su gran calidad.",
      },
      {
        spanish: "Riquísimo",
        english: "Delicious / very tasty",
        phonetics: "ree-KEE-see-moh",
        tip: "El mejor cumplido para el barista.",
      },
    ],
  },
];
