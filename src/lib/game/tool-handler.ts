import { useGameStore } from "./store";

export interface ToolCallPayload {
  tool_call_id: string;
  name: string;
  arguments: Record<string, unknown> | string;
}

export interface ToolResult {
  tool_call_id: string;
  result: string;
}

export function handleToolCall(toolCall: ToolCallPayload): ToolResult {
  const store = useGameStore.getState();
  let args: Record<string, unknown> = {};

  if (typeof toolCall.arguments === "string") {
    try {
      args = JSON.parse(toolCall.arguments);
    } catch {
      args = {};
    }
  } else if (typeof toolCall.arguments === "object" && toolCall.arguments !== null) {
    args = toolCall.arguments;
  }

  console.log(`[Tool Call] Executing '${toolCall.name}':`, args);

  switch (toolCall.name) {
    case "order_item": {
      const item = (args.item as string) || "café";
      const quantity = typeof args.quantity === "number" ? args.quantity : 1;
      const modifications = Array.isArray(args.modifications)
        ? (args.modifications as string[])
        : [];

      store.addItemToOrder(item, quantity, modifications);

      return {
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify({
          status: "success",
          message: `¡Marchando ${quantity} ${item}! Ya está anotado en la comanda.`,
          order_total_items: store.order.length + 1,
        }),
      };
    }

    case "modify_order": {
      const milk = args.milk_type as string | undefined;
      const sugar = args.sugar as string | undefined;
      const temp = args.temperature as string | undefined;

      store.modifyOrderDetails({ milk, sugar, temp });

      return {
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify({
          status: "success",
          message: `Personalización guardada: leche ${milk || "estándar"}, ${
            sugar || "azúcar estándar"
          }, ${temp || "normal"}.`,
        }),
      };
    }

    case "trigger_unexpected": {
      const situation = (args.situation_type as string) || "out_of_milk";
      const explanation =
        (args.barista_explanation as string) ||
        "¡Perdona, se nos acaba de agotar la leche de avena!";

      store.triggerUnexpectedSituation(situation, explanation);

      return {
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify({
          status: "triggered",
          situation,
          instruction:
            "Espera la respuesta del viajero para ver cómo se adapta a esta situación.",
        }),
      };
    }

    case "finish_mission": {
      const success = Boolean(args.success);
      const rating = typeof args.fluency_rating === "number" ? args.fluency_rating : 4;
      const note =
        (args.cultural_note as string) ||
        "En España es habitual dejar propina redondeando unos céntimos en el platillo.";

      store.finishGame({
        overallScore: Math.round(rating * 20),
        feedback: note,
      });

      return {
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify({
          status: "completed",
          evaluation_recorded: true,
          success,
        }),
      };
    }

    default: {
      console.warn(`[Tool Call] Unknown tool: ${toolCall.name}`);
      return {
        tool_call_id: toolCall.tool_call_id,
        result: JSON.stringify({
          status: "unknown_tool",
          message: `La herramienta '${toolCall.name}' no está registrada en el sistema.`,
        }),
      };
    }
  }
}
