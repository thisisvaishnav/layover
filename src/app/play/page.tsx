"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useVoiceAgent } from "@/lib/voice-agent/useVoiceAgent";
import { useGameStore } from "@/lib/game/store";
import { Cafe3DWorld } from "@/components/world/Cafe3DWorld";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { ObjectivesHUD } from "@/components/hud/ObjectivesHUD";
import { OrderReceipt } from "@/components/hud/OrderReceipt";
import { TranscriptHUD } from "@/components/hud/TranscriptHUD";
import { FeedbackModal } from "@/components/hud/FeedbackModal";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import {
  ArrowLeft,
  Trophy,
  Receipt,
  MessageSquare,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from "lucide-react";
import { DESTINATIONS } from "@/scenarios/catalog";

function PlayGameContent() {
  const searchParams = useSearchParams();

  const destId = searchParams.get("destination") || searchParams.get("place") || "cafe";
  const targetLang = searchParams.get("lang") || searchParams.get("target") || "es";
  const nativeLang = searchParams.get("native") || searchParams.get("from") || "ja";

  const matchedDest =
    DESTINATIONS.find((d) => d.id === destId || d.placeType === destId) || DESTINATIONS[0];
  const placeType = destId;

  const {
    status,
    audioLevel,
    connect,
    disconnect,
    startTalk,
    stopTalk,
    simulateSpeech,
  } = useVoiceAgent();

  const { resetGame, level } = useGameStore();

  // 3D Scene readiness & loading curtain state
  const [isSceneReady, setIsSceneReady] = useState(false);

  // Floating HUD panel states
  const [activePanel, setActivePanel] = useState<"none" | "objectives" | "receipt" | "transcript">(
    "none"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Safety watchdog: ensure loading screen resolves even on slow devices or WebGL issues
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setIsSceneReady(true);
    }, 4500);
    return () => clearTimeout(watchdog);
  }, []);

  // Connect voice agent once 3D world is ready
  useEffect(() => {
    if (isSceneReady) {
      connect();
    }
  }, [isSceneReady, connect]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* 0. Full-Screen Flight & 3D World Loading Curtain */}
      <LoadingScreen
        isLoading={!isSceneReady}
        targetLang={targetLang}
        nativeLang={nativeLang}
        placeType={placeType}
      />

      {/* 1. Full-Screen 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Cafe3DWorld
          onStartTalk={startTalk}
          onStopTalk={stopTalk}
          onSimulateSpeech={simulateSpeech}
          isVoiceActive={status === "connected" || status === "ready"}
          className="w-full h-full"
          scenarioName="Metro Transit Plaza · Walkable 3D"
          placeType={placeType}
          targetLang={targetLang}
          nativeLang={nativeLang}
          onSceneReady={() => setIsSceneReady(true)}
        />
      </div>

      {/* 2. Top Floating Navigation Bar */}
      <header className="absolute top-4 inset-x-4 z-20 pointer-events-none flex items-center justify-between gap-3">
        {/* Left: Back to Places & Destination Identity */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-2xl bg-stone-950/80 hover:bg-stone-900 border border-stone-800 backdrop-blur-md text-stone-300 hover:text-stone-100 text-xs font-bold transition-all flex items-center gap-2 shadow-xl active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="bg-stone-950/80 backdrop-blur-md border border-stone-800 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2 text-xs font-semibold">
            <span className="text-base">{matchedDest.bossIcon || matchedDest.flag}</span>
            <span className="font-bold text-stone-100 hidden sm:inline">
              {matchedDest.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#e52521] text-white font-arcade">
              {matchedDest.worldCode || `LEVEL ${level}`}
            </span>
          </div>
        </div>

        {/* Center: Live Voice Status Pill */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-stone-950/80 backdrop-blur-md border border-stone-800/80 rounded-2xl px-3.5 py-2 shadow-xl text-xs">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              status === "ready" || status === "connected"
                ? "bg-emerald-500 animate-pulse"
                : status === "connecting"
                ? "bg-amber-400 animate-ping"
                : "bg-stone-500"
            }`}
          />
          <span className="font-bold text-stone-200">
            {status === "ready"
              ? "Voz Activa con Mateo"
              : status === "connected"
              ? "Conectado"
              : status === "connecting"
              ? "Conectando..."
              : "Voz Desconectada"}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            AssemblyAI 24kHz
          </span>
        </div>

        {/* Right: Floating Tool Toggles (Objectives, Receipt, Transcript, Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Misiones / Objectives Button */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "objectives" ? "none" : "objectives")
            }
            className={`px-3 py-2 rounded-2xl border backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl active:scale-95 cursor-pointer ${
              activePanel === "objectives"
                ? "bg-[#ffcc00] text-black border-black shadow-[2px_2px_0px_#000]"
                : "bg-stone-950/80 hover:bg-stone-900 border-stone-800 text-stone-300"
            }`}
            title="Stage Quests"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quests</span>
          </button>

          {/* Ticket / Order Receipt Button */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "receipt" ? "none" : "receipt")
            }
            className={`px-3 py-2 rounded-2xl border backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl active:scale-95 cursor-pointer ${
              activePanel === "receipt"
                ? "bg-[#ffcc00] text-black border-black shadow-[2px_2px_0px_#000]"
                : "bg-stone-950/80 hover:bg-stone-900 border-stone-800 text-stone-300"
            }`}
            title="Order Receipt"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Order</span>
          </button>

          {/* Transcript Log Button */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "transcript" ? "none" : "transcript")
            }
            className={`px-3 py-2 rounded-2xl border backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl active:scale-95 cursor-pointer ${
              activePanel === "transcript"
                ? "bg-[#ffcc00] text-black border-black shadow-[2px_2px_0px_#000]"
                : "bg-stone-950/80 hover:bg-stone-900 border-stone-800 text-stone-300"
            }`}
            title="Voice Transcript"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Reset Game Session */}
          <button
            onClick={() => {
              resetGame();
              disconnect();
              connect();
            }}
            className="p-2 rounded-2xl bg-stone-950/80 hover:bg-stone-900 border border-stone-800 backdrop-blur-md text-stone-400 hover:text-stone-100 shadow-xl transition-all active:scale-95"
            title="Reiniciar Simulación"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-stone-950/80 hover:bg-stone-900 border border-stone-800 backdrop-blur-md text-stone-400 hover:text-stone-100 shadow-xl transition-all active:scale-95"
            title="Pantalla Completa"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* 3. Floating Sliding Drawer for Active Panel (Objectives / Receipt / Transcript) */}
      {activePanel !== "none" && (
        <div className="absolute top-20 right-4 z-30 w-80 md:w-96 max-h-[78vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-right-4 duration-200">
          <div className="relative">
            <button
              onClick={() => setActivePanel("none")}
              className="absolute top-3 right-3 z-10 p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {activePanel === "objectives" && <ObjectivesHUD />}
            {activePanel === "receipt" && <OrderReceipt />}
            {activePanel === "transcript" && <TranscriptHUD />}
          </div>
        </div>
      )}

      {/* 4. Bottom Floating Voice & Push-To-Talk Dock */}
      <footer className="absolute bottom-5 inset-x-4 z-20 pointer-events-none flex flex-col items-center gap-2">
        <div className="pointer-events-auto max-w-lg w-full">
          <VoiceControls
            status={status}
            audioLevel={audioLevel}
            onStartTalk={startTalk}
            onStopTalk={stopTalk}
            onSimulateSpeech={simulateSpeech}
          />
        </div>
      </footer>

      {/* 5. Completion Modal */}
      <FeedbackModal />
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-stone-400">Cargando Mundo 3D...</span>
          </div>
        </div>
      }
    >
      <PlayGameContent />
    </Suspense>
  );
}
