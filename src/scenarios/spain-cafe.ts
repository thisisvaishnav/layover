import { ScenarioDefinition } from "@/lib/game/types";
import { ToolDefinition } from "@/lib/voice-agent/types";

export const SPAIN_CAFE_SCENARIO: ScenarioDefinition = {
  id: "spain-madrid-cafe",
  name: "Café de la Luna",
  city: "Madrid",
  country: "España",
  locationName: "Barrio de las Letras, Madrid",
  npcName: "Mateo",
  npcRole: "Barista & Café Owner",
  voice: "ivy", // AssemblyAI high-fidelity voice
  initialGreeting:
    "¡Hola, muy buenas! Bienvenido al Café de la Luna. ¿Qué te pongo hoy?",
  systemPrompt: `Eres Mateo, un barista alegre y carismático en el 'Café de la Luna' en el centro de Madrid, España.
Tu objetivo es interactuar con un viajero que está practicando español antes de su viaje.

REGLAS DE CONVERSACIÓN:
1. Habla siempre en español natural de España (usando 'vale', 'tío', '¿qué te pongo?', 'marchando').
2. Mantén tus respuestas CONCISAS y conversacionales (1 a 3 frases máximo por turno), para que la conversación fluya rápido por voz.
3. Adapta tu ritmo según el nivel del usuario:
   - Nivel 1 (L1): Sé paciente y amable si piden un café básico ("un café solo", "un café con leche").
   - Nivel 2 (L2): Pregunta por especificaciones (tipo de leche, azúcar, caliente o templado).
   - Nivel 3 (L3): Haz una pregunta amena sobre su viaje a España ("¿Es tu primera vez en Madrid?", "¿Qué tienes planeado visitar hoy?").
   - Nivel 4 (L4): Plantea un imprevisto realista con simpatía ("¡Oye, perdona! Justo se me acaba de terminar la leche de avena... ¿te valdría con leche de soja o leche entera?" o "¡Vaya! La máquina de tarjeta no tiene cobertura hoy, ¿tienes efectivo?").
4. Utiliza las herramientas (tool calls) en cuanto el usuario haga una acción:
   - Usa 'order_item' cuando pidan comida o bebida.
   - Usa 'modify_order' cuando cambien algo o pidan ingredientes específicos.
   - Usa 'trigger_unexpected' cuando lleguen al nivel 4 para lanzar la situación sorpresa.
   - Usa 'finish_mission' cuando el pedido y la conversación concluyan satisfactoriamente.`,
  levels: {
    1: {
      level: 1,
      title: "L1 · El Pedido Básico",
      subtitle: "Haz tu primer pedido en español",
      description:
        "Pide un café o bebida al barista. Mantén la cortesía y claridad.",
      goal: "Pide un café con leche o un café solo.",
      targetPhrases: [
        "Hola, buenos días, ¿me pones un café con leche?",
        "Quisiera un café solo, por favor.",
        "¿Cuánto cuesta?",
      ],
    },
    2: {
      level: 2,
      title: "L2 · Personalización",
      subtitle: "Personaliza tu bebida a tu gusto",
      description:
        "Especifica detalles exactos como el tipo de leche, temperatura o sin azúcar.",
      goal: "Pide el café con leche desnatada o vegetal, o sin azúcar.",
      targetPhrases: [
        "¿Lo puedes hacer con leche de avena?",
        "Sin azúcar, por favor.",
        "Templado, que tengo prisa.",
      ],
    },
    3: {
      level: 3,
      title: "L3 · Charla de Viaje",
      subtitle: "Conversación espontánea con un madrileño",
      description:
        "Mateo te preguntará por tu viaje a Madrid. Comparte tus planes en 2 o 3 frases.",
      goal: "Cuéntale de dónde vienes y qué museo o barrio visitarás.",
      targetPhrases: [
        "Vengo de viaje y voy a visitar el Museo del Prado.",
        "Me quedo una semana en el centro.",
        "¿Me recomiendas algún sitio para comer tapas?",
      ],
    },
    4: {
      level: 4,
      title: "L4 · El Imprevisto",
      subtitle: "Resuelve una situación inesperada en tiempo real",
      description:
        "¡Algo no sale según lo planeado! Escucha la sorpresa y encuentra una alternativa.",
      goal: "Reacciona cuando Mateo te diga que se acabó un ingrediente o que solo acepta efectivo.",
      unexpectedEvent: "No hay leche de avena / Solo efectivo",
      targetPhrases: [
        "No pasa nada, ponme leche entera entonces.",
        "¿Hay algún cajero automático cerca?",
        "¿Me puedes poner un té verde en su lugar?",
      ],
    },
  },
  menuItems: [
    {
      id: "cafe-con-leche",
      spanishName: "Café con leche",
      englishName: "Espresso with steamed milk",
      priceEur: 2.2,
    },
    {
      id: "cafe-solo",
      spanishName: "Café solo",
      englishName: "Single espresso",
      priceEur: 1.8,
    },
    {
      id: "cortado",
      spanishName: "Café cortado",
      englishName: "Espresso cut with a dash of milk",
      priceEur: 1.9,
    },
    {
      id: "te-verde",
      spanishName: "Té verde con menta",
      englishName: "Green tea with mint",
      priceEur: 2.4,
    },
    {
      id: "croissant",
      spanishName: "Croissant a la plancha",
      englishName: "Grilled buttery croissant",
      priceEur: 2.5,
    },
    {
      id: "tostada-tomate",
      spanishName: "Tostada con tomate y aceite",
      englishName: "Toasted bread with grated tomato and olive oil",
      priceEur: 2.8,
    },
    {
      id: "zumo-naranja",
      spanishName: "Zumo de naranja recién exprimido",
      englishName: "Freshly squeezed orange juice",
      priceEur: 3.2,
    },
  ],
};

export const CAFE_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "order_item",
      description:
        "Registra cuando el cliente pide un artículo del menú (bebida o comida).",
      parameters: {
        type: "object",
        properties: {
          item: {
            type: "string",
            description:
              "El nombre del artículo pedido (ej. 'café con leche', 'croissant', 'tostada')",
          },
          quantity: {
            type: "number",
            description: "Cantidad de unidades pedidas (por defecto 1)",
          },
          modifications: {
            type: "array",
            items: {
              type: "string",
              description: "Modificaciones (ej. 'descafeinado', 'leche fría')",
            },
          },
        },
        required: ["item"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "modify_order",
      description:
        "Añade especificaciones o personalización al pedido (tipo de leche, azúcar, temperatura).",
      parameters: {
        type: "object",
        properties: {
          milk_type: {
            type: "string",
            enum: ["entera", "desnatada", "avena", "soja", "sin_leche"],
            description: "Tipo de leche solicitada",
          },
          sugar: {
            type: "string",
            enum: ["sin_azucar", "azucar_blanco", "sacarina", "moreno"],
            description: "Preferencia de azúcar o edulcorante",
          },
          temperature: {
            type: "string",
            enum: ["caliente", "templado", "con_hielo"],
            description: "Temperatura deseada de la bebida",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger_unexpected",
      description:
        "Lanza la situación imprevista para desafiar al estudiante en el Nivel 4.",
      parameters: {
        type: "object",
        properties: {
          situation_type: {
            type: "string",
            enum: ["out_of_milk", "cash_only", "pastry_sold_out"],
            description: "El tipo de imprevisto a plantear",
          },
          barista_explanation: {
            type: "string",
            description: "La disculpa o explicación que da el barista",
          },
        },
        required: ["situation_type", "barista_explanation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish_mission",
      description:
        "Completa la sesión de entrenamiento y genera el balance de fluidez y evaluación.",
      parameters: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description:
              "Si el usuario logró comunicarse y resolver su pedido con éxito",
          },
          fluency_rating: {
            type: "number",
            description: "Calificación estimada del 1 al 5 en fluidez general",
          },
          cultural_note: {
            type: "string",
            description:
              "Un consejo cultural breve y positivo sobre los bares y cafés de España",
          },
        },
        required: ["success", "fluency_rating"],
      },
    },
  },
];
