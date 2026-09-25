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

/**
 * Supermercado / Grocery Store Hotspots
 */
export const GROCERY_HOTSPOTS: Hotspot[] = [
  {
    id: "cashier_elena",
    title: "Caja Registradora con Elena",
    subtitle: "Habla con la cajera para pagar tu compra del supermercado",
    npcName: "Elena",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Elena",
    iconName: "shopping-cart",
    culturalNote: "En España se suele preguntar si quieres bolsa de plástico (cuestan unos céntimos) o si traes la tuya.",
    spanishPhrases: [
      "¡Hola! ¿Cuánto es en total?",
      "¿Me da una bolsa, por favor?",
      "Voy a pagar con tarjeta.",
      "No necesito ticket, gracias.",
    ],
    vocabulary: [
      {
        spanish: "¿Quiere bolsa?",
        english: "Do you want a bag?",
        phonetics: "KYEH-reh BOHL-sah",
        tip: "Lleva siempre una bolsa de tela reusable.",
      },
      {
        spanish: "Ticket de compra",
        english: "Receipt",
        phonetics: "TEE-keht deh KOHM-prah",
        tip: "El justificante de tu compra.",
      },
      {
        spanish: "Tarjeta de fidelidad",
        english: "Loyalty card / club card",
        phonetics: "tar-HEH-tah deh fee-deh-lee-DAHD",
        tip: "Muchos supermercados te preguntan si tienes su tarjeta de puntos.",
      },
    ],
  },
  {
    id: "produce_shelf",
    title: "Sección de Frutas y Verduras",
    subtitle: "Aprende a pedir fruta por kilos o piezas",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver Frutas",
    iconName: "croissant",
    culturalNote: "En los mercados y tiendas locales, es común pedir 'un kilo de manzanas' o 'medio kilo de tomates'.",
    spanishPhrases: [
      "Póngame un kilo de plátanos, por favor.",
      "¿A cuánto están los tomates hoy?",
      "¿Están maduros los aguacates?",
      "Solo medio kilo de fresas.",
    ],
    vocabulary: [
      {
        spanish: "Un kilo",
        english: "One kilogram",
        phonetics: "oon KEE-loh",
        tip: "Aproximadamente 2.2 libras.",
      },
      {
        spanish: "Medio kilo",
        english: "Half a kilogram (500g)",
        phonetics: "MEH-dyoh KEE-loh",
        tip: "Ideal para frutas delicadas o raciones individuales.",
      },
      {
        spanish: "Maduro",
        english: "Ripe",
        phonetics: "mah-DOO-roh",
        tip: "Listo para comer hoy mismo.",
      },
    ],
  },
  {
    id: "dairy_bread_aisle",
    title: "Panadería y Lácteos",
    subtitle: "Pan fresco del día y productos lácteos",
    position: { x: -3.8, y: 0, z: 2.2 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver Pan y Lácteos",
    iconName: "book-open",
    culturalNote: "En España se compra pan fresco casi a diario en barras o baguettes.",
    spanishPhrases: [
      "¿Esta barra de pan está recién hecha?",
      "¿Dónde está la leche sin lactosa?",
      "¿Tienen yogures naturales?",
    ],
    vocabulary: [
      {
        spanish: "Barra de pan",
        english: "Baguette / loaf of bread",
        phonetics: "BAH-rrah deh PAHN",
        tip: "El acompañamiento básico de cualquier comida española.",
      },
      {
        spanish: "Leche entera / desnatada",
        english: "Whole milk / skimmed milk",
        phonetics: "LEH-cheh ehn-TEH-rah / dehs-nah-TAH-dah",
        tip: "Semidesnatada = 2% milk.",
      },
    ],
  },
];

/**
 * Aeropuerto / Airport Terminal Hotspots
 */
export const AIRPORT_HOTSPOTS: Hotspot[] = [
  {
    id: "airport_gate_agent",
    title: "Puerta de Embarque con Sofia",
    subtitle: "Habla con la agente de puerta sobre tu vuelo y asiento",
    npcName: "Sofia",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Sofia",
    iconName: "plane",
    culturalNote: "Muestra tu pasaporte abierto por la página de la foto junto con tu tarjeta en el móvil.",
    spanishPhrases: [
      "¡Hola! Aquí tiene mi pasaporte y tarjeta de embarque.",
      "¿El vuelo sale a tiempo o tiene retraso?",
      "¿Es esta la puerta para el vuelo a Madrid?",
      "¿Puedo cambiar a un asiento de ventanilla?",
    ],
    vocabulary: [
      {
        spanish: "Tarjeta de embarque",
        english: "Boarding pass",
        phonetics: "tar-HEH-tah deh ehm-BAHR-keh",
        tip: "Digital en el móvil o impresa en papel.",
      },
      {
        spanish: "Asiento de ventanilla / pasillo",
        english: "Window / aisle seat",
        phonetics: "ah-SYEHN-toh deh vehn-tah-NEE-yah / pah-SEE-yoh",
        tip: "Pídelo educadamente en el mostrador.",
      },
      {
        spanish: "Puerta de embarque",
        english: "Boarding gate",
        phonetics: "PWEHR-tah deh ehm-BAHR-keh",
        tip: "Verifica siempre la letra y el número en las pantallas.",
      },
    ],
  },
  {
    id: "luggage_drop",
    title: "Báscula y Facturación de Equipaje",
    subtitle: "Pesa tus maletas y aprende términos de equipaje",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Pesar Equipaje",
    iconName: "credit-card",
    culturalNote: "Las aerolíneas suelen permitir 1 bulto de mano de hasta 10kg y facturar maletas de 23kg.",
    spanishPhrases: [
      "Quiero facturar esta maleta, por favor.",
      "¿Cuánto pesa? ¿Está dentro del límite?",
      "Esta mochila va conmigo en cabina.",
    ],
    vocabulary: [
      {
        spanish: "Equipaje de mano",
        english: "Carry-on luggage",
        phonetics: "eh-kee-PAH-heh deh MAH-noh",
        tip: "Va contigo en el avión.",
      },
      {
        spanish: "Maleta facturada",
        english: "Checked bag",
        phonetics: "mah-LEH-tah fahk-too-RAH-dah",
        tip: "Va en la bodega del avión.",
      },
    ],
  },
  {
    id: "flight_screen",
    title: "Pantalla de Salidas (FIDS)",
    subtitle: "Consulta los vuelos y el estado de tu salida",
    position: { x: -3.8, y: 0, z: 2.2 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver Pantalla",
    iconName: "plane",
    culturalNote: "Las pantallas indican: En hora (On time), Retrasado (Delayed), Embarcando (Boarding) o Última llamada (Last call).",
    spanishPhrases: [
      "¿Dónde puedo mirar las pantallas de vuelos?",
      "¿A qué hora empieza el embarque?",
    ],
    vocabulary: [
      {
        spanish: "En hora",
        english: "On time",
        phonetics: "ehn OH-rah",
        tip: "Tu vuelo no tiene demora.",
      },
      {
        spanish: "Última llamada",
        english: "Last call",
        phonetics: "OOL-tee-mah yah-MAH-dah",
        tip: "¡Debes correr hacia la puerta de embarque!",
      },
    ],
  },
];

/**
 * Gran Hotel / Hotel Desk Hotspots
 */
export const HOTEL_HOTSPOTS: Hotspot[] = [
  {
    id: "hotel_concierge",
    title: "Recepción del Hotel con Javier",
    subtitle: "Haz el check-in y pide las llaves de tu habitación",
    npcName: "Javier",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Javier",
    iconName: "hotel",
    culturalNote: "En los hoteles españoles te pedirán el documento de identidad o pasaporte de todos los huéspedes para el registro oficial.",
    spanishPhrases: [
      "¡Buenas tardes! Tengo una reserva a nombre de García.",
      "¿A qué hora es el check-out?",
      "¿Me puede dar la tarjeta de la habitación?",
      "¿El desayuno está incluido en la reserva?",
    ],
    vocabulary: [
      {
        spanish: "Tengo una reserva a nombre de...",
        english: "I have a reservation under the name of...",
        phonetics: "TEHN-goh OO-nah reh-SEHR-bah ah NOHM-breh deh",
        tip: "La frase esencial al llegar a cualquier hotel.",
      },
      {
        spanish: "Tarjeta llave",
        english: "Key card",
        phonetics: "tar-HEH-tah YAH-beh",
        tip: "Abre la puerta y activa la luz de la habitación.",
      },
      {
        spanish: "Desayuno incluido",
        english: "Breakfast included",
        phonetics: "deh-sah-YOO-noh een-kloo-EE-doh",
        tip: "Consulta los horarios de buffet matutino.",
      },
    ],
  },
  {
    id: "hotel_wifi",
    title: "Wi-Fi y Servicios del Hotel",
    subtitle: "Pregunta por la contraseña del Wi-Fi y ascensor",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver Servicios",
    iconName: "hotel",
    culturalNote: "Muchos hoteles ofrecen Wi-Fi gratis introduciendo tu número de habitación y apellido.",
    spanishPhrases: [
      "¿Cuál es la contraseña del Wi-Fi?",
      "¿Dónde está el ascensor?",
      "¿En qué piso está la habitación?",
    ],
    vocabulary: [
      {
        spanish: "Contraseña del Wi-Fi",
        english: "Wi-Fi password",
        phonetics: "kohn-trah-SEH-nyah dehl WEE-fee",
        tip: "Pregúntalo siempre al hacer check-in.",
      },
      {
        spanish: "Ascensor",
        english: "Elevator / lift",
        phonetics: "ah-sehn-SOHR",
        tip: "Piso = floor.",
      },
    ],
  },
];

/**
 * Farmacia / Pharmacy Hotspots
 */
export const PHARMACY_HOTSPOTS: Hotspot[] = [
  {
    id: "pharmacist_clara",
    title: "Mostrador con la Farmacéutica Clara",
    subtitle: "Explica tus síntomas o pide medicamentos para el viaje",
    npcName: "Dr. Clara",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Clara",
    iconName: "pill",
    culturalNote: "En España las farmacias se identifican con una cruz verde luminosa en la calle. Son muy profesionales y te asesoran directamente.",
    spanishPhrases: [
      "Hola, me duele mucho la cabeza. ¿Tiene algo?",
      "Tengo dolor de garganta y un poco de fiebre.",
      "¿Se necesita receta médica para esto?",
      "¿Cuántas pastillas debo tomar al día?",
    ],
    vocabulary: [
      {
        spanish: "Me duele...",
        english: "My ... hurts",
        phonetics: "meh DWEH-leh",
        tip: "Me duele la cabeza (head), el estómago (stomach), la garganta (throat).",
      },
      {
        spanish: "Analgésico / Pastillas",
        english: "Painkiller / Pills",
        phonetics: "ah-nahl-HEH-see-koh / pahs-TEE-yahs",
        tip: "Paracetamol e ibuprofeno son los más comunes.",
      },
      {
        spanish: "Cada ocho horas",
        english: "Every eight hours",
        phonetics: "KAH-dah OH-choh OH-rahs",
        tip: "Instrucción clásica de posología médica.",
      },
    ],
  },
  {
    id: "pharmacy_firstaid",
    title: "Botiquín y Tiritas",
    subtitle: "Aprende a pedir artículos de primeros auxilios",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Ver Botiquín",
    iconName: "pill",
    culturalNote: "Caminar por ciudades adoquinadas provoca ampollas frecuentes a los turistas.",
    spanishPhrases: [
      "¿Tiene apósitos para ampollas en los pies?",
      "Quiero una caja de tiritas, por favor.",
      "¿Tiene desinfectante o alcohol?",
    ],
    vocabulary: [
      {
        spanish: "Tiritas",
        english: "Band-aids / adhesive bandages",
        phonetics: "tee-REE-tahs",
        tip: "En Latinoamérica también se dicen curitas.",
      },
      {
        spanish: "Ampolla",
        english: "Blister",
        phonetics: "ahm-POH-yah",
        tip: "Común en los talones tras largas caminatas.",
      },
    ],
  },
];

/**
 * Tapas Restaurant / Taberna Hotspots
 */
export const RESTAURANT_HOTSPOTS: Hotspot[] = [
  {
    id: "restaurant_host_lucia",
    title: "Mesa y Barra con Lucía",
    subtitle: "Pide una mesa, consulta tapas y pide bebidas",
    npcName: "Lucía",
    position: { x: 0.0, y: 0, z: -1.4 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[Espacio / Mic] Hablar con Lucía",
    iconName: "utensils",
    culturalNote: "En España, una 'tapa' es una pequeña porción que acompaña la bebida. Una 'ración' es un plato entero para compartir.",
    spanishPhrases: [
      "¡Hola! ¿Tienen mesa para dos personas?",
      "Nos pones dos cañas y una ración de bravas, por favor.",
      "¿Qué nos recomiendas de la casa?",
      "¿Nos traes la cuenta cuando puedas?",
    ],
    vocabulary: [
      {
        spanish: "Caña",
        english: "Small draft beer (200ml)",
        phonetics: "KAH-nyah",
        tip: "La medida clásica de cerveza en los bares españoles.",
      },
      {
        spanish: "Ración",
        english: "Full portion / plate to share",
        phonetics: "rah-SYOHN",
        tip: "Media ración = half portion.",
      },
      {
        spanish: "Patatas bravas",
        english: "Spicy fried potatoes with brava sauce",
        phonetics: "pah-TAH-tahs BRAH-bahs",
        tip: "La tapa más emblemática de Madrid.",
      },
    ],
  },
  {
    id: "restaurant_bill",
    title: "Pagar la Cuenta",
    subtitle: "Pide el ticket y consulta si puedes pagar con tarjeta",
    position: { x: 3.6, y: 0, z: -1.5 },
    interactionRadius: 2.0,
    actionKeyPrompt: "[E] Pagar Cuenta",
    iconName: "credit-card",
    culturalNote: "En España no es obligatorio dejar el 20% de propina como en EE.UU.; se suele dejar el cambio o 1-2 euros si el servicio fue genial.",
    spanishPhrases: [
      "La cuenta, por favor.",
      "¿Se puede pagar con tarjeta?",
      "Quédate con el cambio.",
    ],
    vocabulary: [
      {
        spanish: "La cuenta",
        english: "The bill / check",
        phonetics: "lah KWEHN-tah",
        tip: "Se suele pedir haciendo el gesto de firmar en el aire.",
      },
      {
        spanish: "Propina",
        english: "Tip",
        phonetics: "proh-PEE-nah",
        tip: "Opcional pero agradecida por el personal.",
      },
    ],
  },
];

/**
 * Master resolver to return hotspots matching place type
 */
export function getHotspotsForPlace(placeTypeOrId: string): Hotspot[] {
  const normalized = placeTypeOrId.toLowerCase();

  if (normalized.includes("grocery") || normalized.includes("supermercado")) {
    return GROCERY_HOTSPOTS;
  }
  if (normalized.includes("airport") || normalized.includes("aeropuerto")) {
    return AIRPORT_HOTSPOTS;
  }
  if (normalized.includes("hotel")) {
    return HOTEL_HOTSPOTS;
  }
  if (normalized.includes("pharmacy") || normalized.includes("farmacia")) {
    return PHARMACY_HOTSPOTS;
  }
  if (normalized.includes("restaurant") || normalized.includes("tapas") || normalized.includes("taberna") || normalized.includes("chulapo")) {
    return RESTAURANT_HOTSPOTS;
  }
  // Default to coffee shop
  return MADRID_CAFE_HOTSPOTS;
}

