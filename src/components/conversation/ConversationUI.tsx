"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X, Mic, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useConversationStore } from "@/lib/conversation/store";
import type { ConversationMessage, ConversationStatus } from "@/lib/conversation/types";
import { buildLessonLine, type LessonLine } from "@/lib/conversation/format";
import { getConversationUiStrings, type ConversationUiStrings } from "@/lib/conversation/ui-strings";
import { getBilingualDialogue, getMultilingualScenario, getPlaceInfo } from "@/scenarios/multilingual";

const TEAL = "#14B8A6";
const AMBER = "#F5B301";
const YELLOW = "#FFC93B";
const CREAM = "#FAF6EC";

interface ConversationUIProps {
  onClose(): void;
  onStartRecording?(): Promise<boolean> | void;
  onStopRecording?(): void;
  onSendTextMessage?(text: string): void;
}

/**
 * Bottom-sheet conversation card, laid out like the design mock:
 * header (avatar, name, role, learning language, level pill, step counter),
 * amber objective band, NPC/You dialogue cards, then the big mic button.
 */
export function ConversationUI({
  onClose,
  onStartRecording,
  onStopRecording,
  onSendTextMessage,
}: ConversationUIProps) {
  const {
    status,
    messages,
    currentNpcName,
    currentObjective,
    currentStep,
    totalSteps,
    isOpen,
    errorMessage,
    partialUserTranscript,
    targetLang = "es",
    nativeLang = "en",
    zone = "cafe",
    npcRole,
    suggestedTarget,
    suggestedPhonetics,
    suggestedNative,
    isMicRecording,
  } = useConversationStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  const strings = getConversationUiStrings(nativeLang);
  const scenario = getMultilingualScenario(targetLang, nativeLang, zone);
  const role = npcRole ?? scenario.npcRole;
  const targetLanguage = scenario.targetLanguage;
  const levelLabel = scenario.dialogue.levelLabel;

  const npcMsg = findLastNpcMessage(messages);
  const userMsg = findLastUserMessage(messages);

  const npcLine: LessonLine | null = npcMsg
    ? buildLessonLine({
        text: npcMsg.text,
        phonetic: npcMsg.phonetic,
        translation: npcMsg.translation,
        targetLang,
        nativeLang,
      })
    : null;

  const sayLine: LessonLine | null = suggestedTarget
    ? buildLessonLine({
        text: suggestedTarget,
        phonetic: suggestedPhonetics || undefined,
        translation: suggestedNative || undefined,
        targetLang,
        nativeLang,
      })
    : null;

  const userLine: LessonLine | null = userMsg
    ? buildLessonLine({
        text: userMsg.text,
        phonetic: userMsg.phonetic,
        translation: userMsg.translation,
        targetLang,
        nativeLang,
      })
    : null;

  // While it is the learner's turn, the right-hand card shows the line to say.
  // Once they have spoken, it shows their own last reply instead.
  const yourTurn =
    status === "CONNECTING" || status === "CONNECTED" || status === "LISTENING";
  const showSuggestion = yourTurn && Boolean(sayLine);
  const youLine: LessonLine | null = showSuggestion ? sayLine : userLine ?? sayLine;

  // The barber shop keeps the café zone internally (its dialogue is a separate
  // scripted branch), so the place name has to come from the shop's own role.
  const placeZone = /barber/i.test(role) ? "barber" : zone;
  const place = getPlaceInfo(placeZone, targetLang);
  const caption = getMicCaption(status, isMicRecording, strings);

  // Auto-scroll to the latest content
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, partialUserTranscript, status]);

  const handleSendText = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const store = useConversationStore.getState();
    store.finalizeUserTurn(trimmed);
    onSendTextMessage?.(trimmed);
    const sentCount = useConversationStore.getState().messages.length;

    // Provide intelligent NPC scripted response if voice agent is disconnected or as immediate fallback
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      const state = useConversationStore.getState();
      // A live agent reply already landed — do not answer it a second time.
      if (state.messages.length !== sentCount) return;
      const currentMessages = state.messages;
      const last = currentMessages[currentMessages.length - 1];
      if (last && last.speaker === "USER" && state.status !== "NPC_SPEAKING") {
        const nextStep = state.currentStep;
        const dialogue = getBilingualDialogue({
          targetLang: state.targetLang ?? "es",
          nativeLang: state.nativeLang ?? "en",
          zone: state.zone ?? "cafe",
          stepIndex: nextStep,
        });

        const reply: Omit<ConversationMessage, "id" | "timestamp"> = {
          speaker: "NPC",
          text: dialogue.npcTargetText,
          phonetic: dialogue.npcPhonetics,
          translation: dialogue.npcNativeTranslation,
        };

        store.addMessage(reply);
        store.advanceStep();
        if (state.currentStep >= state.totalSteps) {
          store.setStatus("COMPLETED");
        } else {
          store.setStatus("LISTENING");
        }
      }
    }, 1000);
  };

  const handleMicToggle = async () => {
    const store = useConversationStore.getState();
    if (store.isMicRecording) {
      // Finish recording turn
      onStopRecording?.();
      store.setIsMicRecording(false);
      if (store.partialUserTranscript) {
        handleSendText(store.partialUserTranscript);
      } else if (store.suggestedTarget) {
        handleSendText(store.suggestedTarget);
      }
    } else {
      // Start recording turn
      const previousStatus = store.status;
      store.setStatus("USER_SPEAKING");
      if (onStartRecording) {
        const started = await onStartRecording();
        if (started === false) {
          // Mic never opened (no live session / permission denied) — roll back
          useConversationStore.getState().setStatus(previousStatus);
        }
      } else {
        store.setIsMicRecording(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex flex-col border-t-4 border-black rounded-t-[18px] font-sans overflow-hidden shadow-[0_-8px_0px_#000]"
      style={{
        height: "58vh",
        minHeight: "420px",
        maxHeight: "560px",
        background: CREAM,
        zIndex: 40,
      }}
      role="dialog"
      aria-label={`Conversation with ${currentNpcName}`}
    >
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-black flex-shrink-0" style={{ background: CREAM }}>
        <div
          className="w-11 h-11 rounded-[10px] border-2 border-black flex items-center justify-center text-xl shadow-[3px_3px_0px_#000] shrink-0"
          style={{ background: TEAL }}
          aria-hidden
        >
          {place.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-black text-black text-[15px] uppercase tracking-tight truncate leading-tight">
            {currentNpcName}
          </div>
          <div className="text-[11px] font-mono text-black/60 truncate leading-tight mt-0.5">
            {role} · {strings.learning.replace("{lang}", targetLanguage)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline-block px-2.5 py-1 rounded-full border-2 border-black font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#000] max-w-[160px] truncate"
            style={{ background: AMBER }}
          >
            {levelLabel}
          </span>
          <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-white font-mono text-[11px] font-black text-black shadow-[2px_2px_0px_#000] tabular-nums">
            {currentStep}/{totalSteps}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center font-black text-sm bg-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close conversation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── OBJECTIVE BAND ── */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-y-2 border-black flex-shrink-0"
        style={{ background: AMBER }}
      >
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/75 border-2 border-black bg-white px-2 py-0.5 rounded-md shrink-0 shadow-[1px_1px_0px_#000]">
          {strings.objective}
        </span>
        <span className="text-[13px] font-bold text-black leading-snug min-w-0">
          {currentObjective}
        </span>
      </div>

      {/* ── PLACE BANNER ── */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 border-y-2 border-black flex-shrink-0"
        style={{ background: TEAL }}
      >
        <span className="text-[15px] shrink-0" aria-hidden>
          {place.icon}
        </span>
        <span className="font-black text-[12px] uppercase tracking-tight text-black truncate">
          This is the {place.label}
        </span>
        <span className="ml-auto shrink-0 max-w-[45%] truncate font-mono text-[11px] font-bold text-black border-2 border-black bg-white px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#000]">
          {place.targetLabel}
        </span>
      </div>

      {/* ── DIALOGUE ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 min-h-0 bg-graph-paper"
        style={{ scrollBehavior: "smooth" }}
      >
        {status === "ERROR" && (
          <div className="flex items-center justify-between gap-2 p-2.5 mb-3 border-2 border-black rounded-[10px] bg-[#FF5722]/10 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-[#FF5722] shrink-0" />
              <span className="text-[11px] font-mono font-bold text-black">
                {errorMessage ?? "Voice session ended. Tap Retry to reconnect."}
              </span>
            </div>
            <button
              onClick={() => {
                const current = useConversationStore.getState();
                current.openConversation(currentNpcName, currentObjective, current.totalSteps, {
                  targetLang,
                  nativeLang,
                  zone,
                  npcRole: current.npcRole,
                  suggestedTarget,
                  suggestedPhonetics,
                  suggestedNative,
                });
              }}
              className="px-3 py-1 bg-[#FF5722] text-black hover:bg-black hover:text-white border-2 border-black text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer transition-colors shrink-0 shadow-[2px_2px_0px_#000]"
            >
              {strings.retry}
            </button>
          </div>
        )}

        {status === "COMPLETED" && (
          <div className="flex items-center gap-2 p-2.5 mb-3 border-2 border-black rounded-[10px] bg-[#00D084]/20 shadow-[3px_3px_0px_#000]">
            <CheckCircle2 className="w-5 h-5 text-[#00D084] shrink-0" />
            <span className="text-sm font-black uppercase tracking-wider text-black">
              {strings.complete}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DialogueCard
            label={strings.npc}
            accent={TEAL}
            align="left"
            line={npcLine}
            empty={strings.empty}
          />

          <DialogueCard
            label={showSuggestion ? "Say this" : strings.you}
            accent={YELLOW}
            align="right"
            line={youLine}
            empty={strings.empty}
            hint={showSuggestion ? "Say this word out loud:" : undefined}
          >
            {showSuggestion && (
              <button
                type="button"
                onClick={() => sayLine && handleSendText(sayLine.text)}
                aria-label="Send suggested phrase"
                className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-black hover:text-white border-2 border-black font-mono font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{strings.send}</span>
              </button>
            )}
          </DialogueCard>
        </div>
      </div>

      {/* ── MIC ── */}
      <div
        className="flex-shrink-0 border-t-2 border-black px-4 pt-2.5 pb-3 flex flex-col items-center gap-1"
        style={{ background: CREAM }}
      >
        <button
          type="button"
          onClick={handleMicToggle}
          aria-label={isMicRecording ? "Stop recording and send" : "Speak"}
          className={`w-16 h-16 rounded-[18px] border-[3px] border-black flex items-center justify-center cursor-pointer transition-all shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#000] ${
            isMicRecording ? "bg-[#FF5722] animate-pulse" : "hover:-translate-x-0.5 hover:-translate-y-0.5"
          }`}
          style={isMicRecording ? undefined : { background: YELLOW }}
          title={isMicRecording ? "Stop recording and send" : "Speak"}
        >
          <Mic className={`w-7 h-7 text-black ${isMicRecording ? "animate-bounce" : ""}`} />
        </button>

        <span className="text-[12px] font-bold text-black text-center leading-snug">
          {caption}
        </span>

        {isMicRecording && partialUserTranscript && (
          <span className="text-[11px] font-mono italic text-black/60 text-center truncate max-w-full">
            ● {strings.youSaid}: {partialUserTranscript}
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function DialogueCard({
  label,
  accent,
  align,
  line,
  empty,
  hint,
  children,
}: {
  label: string;
  accent: string;
  align: "left" | "right";
  line: LessonLine | null;
  empty: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-2 border-black rounded-[10px] bg-white p-3 shadow-[4px_4px_0px_#000]">
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <span
          className="font-mono text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-md px-2 py-0.5 shadow-[1px_1px_0px_#000]"
          style={{ background: accent }}
        >
          {label}
        </span>
      </div>

      {hint && (
        <div className="text-[10px] font-mono font-black uppercase tracking-wider text-black/60">
          {hint}
        </div>
      )}

      <div className="text-[17px] font-black text-black leading-snug tracking-tight">
        {line?.text ?? empty}
      </div>
      {line?.phonetic && <div className="text-[11px] font-mono text-black/55">{line.phonetic}</div>}
      {line?.translation && (
        <div className="text-[13px] text-black/70">
          <span className="font-mono font-bold uppercase text-[11px] text-black/50">Meaning: </span>
          {line.translation}
        </div>
      )}
      {line?.gloss && (
        <div className="text-[11px] font-mono text-black mt-0.5">
          <span className="inline-block bg-[#FFB800] border border-black px-1.5 py-0.5 font-bold rounded shadow-[1px_1px_0px_#000]">
            {line.gloss}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function getMicCaption(
  status: ConversationStatus,
  isMicRecording: boolean | undefined,
  strings: ConversationUiStrings
): string {
  if (isMicRecording) return strings.listening;
  switch (status) {
    case "CONNECTING":
    case "CONNECTED":
      return strings.connecting;
    case "PROCESSING":
      return strings.thinking;
    case "NPC_SPEAKING":
      return strings.speaking;
    case "USER_SPEAKING":
      return strings.listening;
    case "COMPLETED":
      return strings.complete;
    default:
      return strings.micHint;
  }
}

function findLastNpcMessage(messages: ConversationMessage[]): ConversationMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.speaker === "NPC") return msg;
  }
  return undefined;
}

function findLastUserMessage(messages: ConversationMessage[]): ConversationMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.speaker === "USER") return msg;
  }
  return undefined;
}
