import test from "node:test";
import assert from "node:assert/strict";
import { handleToolCall } from "../src/lib/game/tool-handler";
import { useGameStore } from "../src/lib/game/store";

test("Tool Call: 'order_item' adds item to order and triggers barista brewing", () => {
  useGameStore.getState().resetGame();

  const result = handleToolCall({
    tool_call_id: "call-1",
    name: "order_item",
    arguments: { item: "café con leche", quantity: 2 },
  });

  assert.equal(result.tool_call_id, "call-1");
  const payload = JSON.parse(result.result);
  assert.equal(payload.status, "success");

  const state = useGameStore.getState();
  assert.equal(state.order.length, 1);
  assert.equal(state.order[0].spanishName, "Café con leche");
  assert.equal(state.order[0].quantity, 2);
  assert.equal(state.baristaAction, "brewing");
});

test("Tool Call: 'modify_order' records customizations on current order", () => {
  const result = handleToolCall({
    tool_call_id: "call-2",
    name: "modify_order",
    arguments: {
      milk_type: "avena",
      sugar: "sin_azucar",
      temperature: "templado",
    },
  });

  assert.equal(result.tool_call_id, "call-2");
  const payload = JSON.parse(result.result);
  assert.equal(payload.status, "success");

  const state = useGameStore.getState();
  const lastItem = state.order[state.order.length - 1];
  assert.ok(lastItem.modifications.some((m) => m.includes("avena")));
  assert.ok(lastItem.modifications.some((m) => m.includes("sin_azucar")));
});

test("Tool Call: 'trigger_unexpected' triggers L4 surprise event", () => {
  const result = handleToolCall({
    tool_call_id: "call-3",
    name: "trigger_unexpected",
    arguments: {
      situation_type: "out_of_milk",
      barista_explanation: "Se nos terminó la leche de avena",
    },
  });

  assert.equal(result.tool_call_id, "call-3");
  const state = useGameStore.getState();
  assert.ok(state.currentUnexpected);
  assert.equal(state.currentUnexpected?.type, "out_of_milk");
  assert.equal(state.baristaAction, "apologizing");
});

test("Tool Call: 'finish_mission' completes mission and sets evaluation", () => {
  const result = handleToolCall({
    tool_call_id: "call-4",
    name: "finish_mission",
    arguments: {
      success: true,
      fluency_rating: 4.5,
      cultural_note: "¡Buen viaje por Madrid!",
    },
  });

  assert.equal(result.tool_call_id, "call-4");
  const state = useGameStore.getState();
  assert.equal(state.isCompleted, true);
  assert.ok(state.evaluation);
  assert.equal(state.evaluation?.overallScore, 90);
});

test("Tool Call: Unknown tool returns graceful status without throwing", () => {
  const result = handleToolCall({
    tool_call_id: "call-unknown",
    name: "non_existent_tool",
    arguments: {},
  });

  const payload = JSON.parse(result.result);
  assert.equal(payload.status, "unknown_tool");
});
