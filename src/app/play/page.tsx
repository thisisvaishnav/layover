"use client";

import { useEffect } from "react";
import { useVoiceAgent } from "@/lib/voice-agent/useVoiceAgent";
import { useGameStore } from "@/lib/game/store";
import { Header } from "@/components/navigation/Header";
import { CafeVisual } from "@/components/cafe/CafeVisual";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { ObjectivesHUD } from "@/components/hud/ObjectivesHUD";
import { OrderReceipt } from "@/components/hud/OrderReceipt";
import { TranscriptHUD } from "@/components/hud/TranscriptHUD";
import { FeedbackModal } from "@/components/hud/FeedbackModal";
import { MapPin, Compass } from "lucide-react";
import { SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";

export default function PlayPage() {
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

  // Auto-prompt to connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const currentLevelInfo = SPAIN_CAFE_SCENARIO.levels[level];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Top Navigation */}
      <Header
        status={status}
        onConnect={connect}
        onReset={() => {
          resetGame();
          disconnect();
          connect();
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage & Voice Controls (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Visual Café Scene */}
          <CafeVisual />

          {/* Voice Controls with Push-To-Talk */}
          <VoiceControls
            status={status}
            audioLevel={audioLevel}
            onStartTalk={startTalk}
            onStopTalk={stopTalk}
            onSimulateSpeech={simulateSpeech}
          />

          {/* Live Transcript Log */}
          <TranscriptHUD />
        </div>

        {/* Right Column: Mission HUD & Café Receipt (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Location & Scenario Briefing Card */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Escenario Activo</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                España · Nivel {level}
              </span>
            </div>
            <h2 className="text-base font-bold text-stone-100">
              {SPAIN_CAFE_SCENARIO.name} · {SPAIN_CAFE_SCENARIO.city}
            </h2>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {currentLevelInfo.description}
            </p>

            {/* Travel Context Tip */}
            <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-start gap-2 text-[11px] text-amber-200/90">
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Dato de viaje:</strong> En los bares de Madrid es muy común
                pedir un café con leche templado si tienes prisa, o cortado si
                quieres menos leche.
              </span>
            </div>
          </div>

          {/* Objectives Checklist */}
          <ObjectivesHUD />

          {/* Real-time Order Receipt Ticket */}
          <OrderReceipt />
        </div>
      </main>

      {/* Completion Modal */}
      <FeedbackModal />
    </div>
  );
}
