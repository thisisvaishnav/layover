"use client";

import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  Mic,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  getBilingualDialogue,
  BilingualDialogue,
} from "@/scenarios/multilingual";
import { retroAudio } from "@/lib/audio/retro-audio";

interface InteractiveLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: string;
  targetLang: string;
  nativeLang: string;
  onStartTalk?: () => void;
  onStopTalk?: () => void;
  onSimulateSpeech?: (phrase: string) => void;
  isVoiceActive?: boolean;
}

export function InteractiveLearningModal({
  isOpen,
  onClose,
  zone,
  targetLang,
  nativeLang,
  onStartTalk,
  onStopTalk,
  onSimulateSpeech,
  isVoiceActive = false,
}: InteractiveLearningModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPressingMic, setIsPressingMic] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Fetch current dialogue matching current step and languages
  const dialogue: BilingualDialogue = getBilingualDialogue({
    targetLang,
    nativeLang,
    zone,
    stepIndex,
  });

  // Handle keyboard push-to-talk (Spacebar) when modal is focused
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isPressingMic) {
        e.preventDefault();
        setIsPressingMic(true);
        onStartTalk?.();
        retroAudio.playSelect();
      }
      if (e.code === "Escape") {
        onClose();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPressingMic) {
        e.preventDefault();
        setIsPressingMic(false);
        onStopTalk?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, isPressingMic, onStartTalk, onStopTalk, onClose]);

  if (!isOpen) return null;

  // Speak NPC audio using Web Speech synthesis as instant audio fallback
  const handlePlayAudio = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Map langCode to BCP-47
    const langMap: Record<string, string> = {
      es: "es-ES",
      te: "te-IN",
      ja: "ja-JP",
      en: "en-US",
      fr: "fr-FR",
      hi: "hi-IN",
    };
    utterance.lang = langMap[langCode] || langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    retroAudio.playSelect();
  };

  const handleNextStep = () => {
    if (stepIndex < dialogue.totalSteps - 1) {
      setStepIndex((s) => s + 1);
      setFeedbackSuccess(false);
      retroAudio.playPowerUp();
    } else {
      // Completed all steps in this zone!
      setFeedbackSuccess(true);
      retroAudio.play1Up();
    }
  };

  const handleRepeatStep = () => {
    setStepIndex(0);
    setFeedbackSuccess(false);
    retroAudio.playSelect();
  };

  const handleTriggerUserSpeech = () => {
    onSimulateSpeech?.(dialogue.userSuggestedTarget);
    setFeedbackSuccess(true);
    retroAudio.playCoin();
    setTimeout(() => {
      if (stepIndex < dialogue.totalSteps - 1) {
        handleNextStep();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Container: Matches the warm cream, high contrast retro card in the user's screenshot */}
      <div className="w-full max-w-xl bg-[#faeed2] text-stone-950 border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000] overflow-hidden flex flex-col font-sans">
        {/* 1. TOP BAR */}
        <div className="px-4 py-3 bg-[#faeed2] border-b-2 border-black flex items-center justify-between gap-2">
          {/* NPC Profile */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_#000]"
              style={{ backgroundColor: dialogue.npcAvatarColor }}
            >
              {dialogue.npcName[0]}
            </div>
            <div>
              <div className="font-bold text-base text-black leading-tight">
                {dialogue.npcName}
              </div>
              <div className="text-xs font-semibold text-stone-700">
                {dialogue.npcRole} · learning{" "}
                <span className="font-bold text-black">{dialogue.targetLangName}</span>
              </div>
            </div>
          </div>

          {/* Badges & Close button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-block px-2.5 py-1 rounded-lg border-2 border-black bg-white text-[10px] font-bold tracking-wider uppercase shadow-[1px_1px_0px_#000]">
              {dialogue.levelLabel}
            </div>
            <div className="px-2.5 py-1 rounded-lg border-2 border-black bg-white text-[11px] font-mono font-bold shadow-[1px_1px_0px_#000]">
              {dialogue.stepProgress}
            </div>
            <button
              onClick={() => {
                retroAudio.playSelect();
                onClose();
              }}
              className="w-7 h-7 rounded-lg border-2 border-black bg-white hover:bg-stone-100 text-black flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#000] cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
              title="Close [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. OBJECTIVE BANNER (Yellow) */}
        <div className="bg-[#ffaa00] px-4 py-2.5 border-b-2 border-black text-black">
          <div className="text-[10px] font-bold tracking-wider uppercase opacity-85">
            OBJECTIVE
          </div>
          <div className="text-xs sm:text-sm font-bold leading-snug">
            {dialogue.objective}
          </div>
        </div>

        {/* 3. TWO SIDE-BY-SIDE INTERACTION CARDS */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#faeed2]">
          {/* Left Card: NPC */}
          <div className="bg-[#fef9ee] border-2 border-black rounded-xl p-3.5 shadow-[3px_3px_0px_#000] flex flex-col justify-between min-h-[140px] relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-stone-600">
                  {dialogue.npcName}
                </span>
                <button
                  onClick={() => handlePlayAudio(dialogue.npcTargetText, targetLang)}
                  className="p-1 rounded hover:bg-stone-200 text-stone-700 transition-colors"
                  title="Listen pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Target line in foreign script */}
              <div className="text-xl sm:text-2xl font-bold text-black leading-snug mb-1">
                {dialogue.npcTargetText}
              </div>

              {/* Romanized Phonetics */}
              <div className="text-xs italic font-medium text-amber-800 font-mono mb-1">
                {dialogue.npcPhonetics}
              </div>
            </div>

            {/* Translation in Learner's Native Language */}
            <div className="text-xs font-semibold text-stone-600 border-t border-black/10 pt-2 mt-2">
              {dialogue.npcNativeTranslation}
            </div>
          </div>

          {/* Right Card: YOU */}
          <div className="bg-[#fef9ee] border-2 border-black rounded-xl p-3.5 shadow-[3px_3px_0px_#000] flex flex-col justify-between min-h-[140px] relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-stone-600">
                  YOU
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  Target
                </span>
              </div>

              {/* User Suggested Target Phrase */}
              <div className="text-lg sm:text-xl font-bold text-black leading-snug mb-1">
                {dialogue.userSuggestedTarget}
              </div>

              {/* Romanized Phonetics */}
              <div className="text-xs italic font-medium text-stone-600 font-mono mb-1">
                {dialogue.userSuggestedPhonetics}
              </div>
            </div>

            {/* Native Meaning */}
            <div className="text-xs font-semibold text-stone-600 border-t border-black/10 pt-2 mt-2">
              {dialogue.userSuggestedNative}
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ACTION & PUSH-TO-TALK MIC */}
        <div className="px-4 py-4 bg-[#faeed2] border-t-2 border-black flex flex-col items-center justify-center gap-2">
          {/* Centered Yellow Mic Button */}
          <div className="flex items-center gap-3">
            <button
              onMouseDown={() => {
                setIsPressingMic(true);
                onStartTalk?.();
                retroAudio.playSelect();
              }}
              onMouseUp={() => {
                setIsPressingMic(false);
                onStopTalk?.();
              }}
              onTouchStart={() => {
                setIsPressingMic(true);
                onStartTalk?.();
                retroAudio.playSelect();
              }}
              onTouchEnd={() => {
                setIsPressingMic(false);
                onStopTalk?.();
              }}
              className={`w-14 h-14 rounded-2xl border-3 border-black flex items-center justify-center cursor-pointer transition-all shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#000] ${
                isPressingMic || isVoiceActive
                  ? "bg-[#e52521] text-white scale-105"
                  : "bg-[#ffcc00] hover:bg-[#ffb700] text-black"
              }`}
              title="Hold to speak (or hold Spacebar)"
            >
              <Mic
                className={`w-7 h-7 ${
                  isPressingMic || isVoiceActive ? "animate-pulse" : ""
                }`}
              />
            </button>
          </div>

          <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            {isPressingMic ? (
              <span className="text-[#e52521] animate-pulse">
                🎙️ Listening... Release when done
              </span>
            ) : (
              <span>Hold to speak the line above (or hold Spacebar)</span>
            )}
          </div>

          {/* Quick Fallback / Advance controls */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleTriggerUserSpeech}
              className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-stone-50 text-[11px] font-bold text-black shadow-[2px_2px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Saying This</span>
            </button>

            {stepIndex < dialogue.totalSteps - 1 ? (
              <button
                onClick={handleNextStep}
                className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-stone-800 text-[11px] font-bold shadow-[2px_2px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-y-0.5"
              >
                <span>Next Line</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleRepeatStep}
                className="px-3 py-1.5 rounded-lg border-2 border-black bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold shadow-[2px_2px_0px_#000] flex items-center gap-1 cursor-pointer active:translate-y-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
