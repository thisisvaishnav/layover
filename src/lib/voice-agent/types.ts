export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: {
    type: string;
    description?: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
}

export interface SessionUpdateConfig {
  type: "session.update";
  session?: {
    system_prompt?: string;
    greeting?: string;
    voice?: string;
    tools?: ToolDefinition[];
    vad_threshold?: number;
    min_silence?: number;
    max_silence?: number;
  };
  agent_id?: string;
}

export interface InputAudioEvent {
  type: "input.audio";
  data: string; // base64-encoded PCM16
}

export interface ToolResultEvent {
  type: "tool.result";
  tool_call_id: string;
  result: string;
}

export interface SessionEndEvent {
  type: "session.end";
}

export type ClientEvent =
  | SessionUpdateConfig
  | InputAudioEvent
  | ToolResultEvent
  | SessionEndEvent;

export interface SessionReadyEvent {
  type: "session.ready";
  session_id?: string;
}

export interface SpeechStartedEvent {
  type: "input.speech.started";
}

export interface SpeechStoppedEvent {
  type: "input.speech.stopped";
}

export interface TranscriptUserEvent {
  type: "transcript.user";
  text: string;
  is_final?: boolean;
}

export interface TranscriptAgentEvent {
  type: "transcript.agent";
  text: string;
  is_final?: boolean;
}

export interface ReplyAudioEvent {
  type: "reply.audio";
  data: string; // base64 PCM16 24kHz
}

export interface ReplyDoneEvent {
  type: "reply.done";
  status: "completed" | "interrupted";
}

export interface ToolCallEvent {
  type: "tool.call";
  tool_call_id: string;
  name: string;
  arguments: Record<string, unknown> | string;
}

export interface SessionEndedEvent {
  type: "session.ended";
}

export interface SessionErrorEvent {
  type: "session.error";
  error: string;
  message?: string;
}

export type ServerEvent =
  | SessionReadyEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | TranscriptUserEvent
  | TranscriptAgentEvent
  | ReplyAudioEvent
  | ReplyDoneEvent
  | ToolCallEvent
  | SessionEndedEvent
  | SessionErrorEvent;

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "ready"
  | "error";

export interface TranscriptMessage {
  id: string;
  sender: "user" | "npc";
  text: string;
  translation?: string;
  timestamp: number;
  isFinal?: boolean;
}
