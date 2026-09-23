"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Cafe3DScene } from "@/lib/world/scene-builder";
import { WorldControlsManager } from "@/lib/world/controls";
import {
  resolveVelocity,
  resolveMovement,
  findActiveHotspot,
} from "@/lib/world/math";
import {
  CAFE_BOUNDS,
  CAFE_OBSTACLES,
  MADRID_CAFE_HOTSPOTS,
} from "@/lib/world/hotspots";
import { Hotspot, Position3D } from "@/lib/world/types";
import { useGameStore } from "@/lib/game/store";
import { HotspotPrompt } from "./HotspotPrompt";
import { VocabularyModal } from "./VocabularyModal";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Volume2,
} from "lucide-react";

interface Cafe3DWorldProps {
  onStartTalk?: () => void;
  onStopTalk?: () => void;
  onSimulateSpeech?: (text: string) => void;
  isVoiceActive?: boolean;
}

export function Cafe3DWorld({
  onStartTalk,
  onStopTalk,
  onSimulateSpeech,
  isVoiceActive,
}: Cafe3DWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Cafe3DScene | null>(null);
  const controlsRef = useRef<WorldControlsManager | null>(null);

  // Player position state
  const playerPosRef = useRef<Position3D>({ x: 0, y: 0, z: 2.0 });
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [inspectingHotspot, setInspectingHotspot] = useState<Hotspot | null>(null);

  const { baristaAction } = useGameStore();

  // Handle interaction (E key or button)
  const handleInteract = useCallback(() => {
    if (activeHotspot) {
      setInspectingHotspot(activeHotspot);
    }
  }, [activeHotspot]);

  // Handle talk toggle (Space key or button)
  const handleTalkToggle = useCallback(() => {
    if (isVoiceActive) {
      onStopTalk?.();
    } else {
      onStartTalk?.();
    }
  }, [isVoiceActive, onStartTalk, onStopTalk]);

  // Initialize Three.js scene & game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize 3D Scene
    const scene = new Cafe3DScene(canvasRef.current);
    sceneRef.current = scene;

    // 2. Initialize Keyboard Controls Manager
    const controls = new WorldControlsManager({
      onInteract: () => {
        handleInteract();
      },
      onTalkToggle: () => {
        handleTalkToggle();
      },
    });
    controlsRef.current = controls;

    // 3. 60fps Movement & Proximity Tick Loop
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);
      const delta = Math.min((now - lastTime) / 1000, 0.1); // clamp delta
      lastTime = now;

      const input = controls.getState();
      const dir = resolveVelocity(input);
      const isWalking = dir.x !== 0 || dir.z !== 0;

      const speed = 4.2; // units per second
      const newPos = resolveMovement(
        playerPosRef.current,
        dir,
        speed,
        delta,
        CAFE_OBSTACLES,
        CAFE_BOUNDS,
        0.38
      );

      playerPosRef.current = newPos;
      scene.updatePlayerPosition(newPos, isWalking, dir.x, dir.z);

      // Proximity detection
      const spot = findActiveHotspot(newPos, MADRID_CAFE_HOTSPOTS);
      setActiveHotspot(spot);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      controls.destroy();
      scene.destroy();
      sceneRef.current = null;
      controlsRef.current = null;
    };
  }, [handleInteract, handleTalkToggle]);

  // Sync Barista animation with game store actions
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setMateoTalking(baristaAction === "speaking");
    sceneRef.current.setBaristaBrewing(baristaAction === "brewing");
  }, [baristaAction]);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] rounded-3xl overflow-hidden bg-stone-950 border border-stone-800 shadow-2xl select-none group">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
        tabIndex={0}
      />

      {/* Top Left: Controls & Context Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
        <div className="bg-stone-950/80 backdrop-blur-md border border-stone-800 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-200">
            Café de la Luna · Madrid 3D
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-stone-900/80 backdrop-blur-sm border border-stone-800/80 rounded-xl px-3 py-1.5 text-[11px] text-stone-300">
          <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono font-bold text-amber-400">
            W A S D
          </span>
          <span className="text-stone-400">moverse</span>
          <span className="mx-1 text-stone-600">·</span>
          <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono font-bold text-amber-400">
            E
          </span>
          <span className="text-stone-400">inspeccionar</span>
        </div>
      </div>

      {/* Top Right: Status indicators */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {baristaAction === "brewing" && (
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Mateo está preparando tu café...</span>
          </div>
        )}
      </div>

      {/* Floating Active Hotspot Prompt */}
      {activeHotspot && !inspectingHotspot && (
        <HotspotPrompt
          hotspot={activeHotspot}
          onInteract={() => setInspectingHotspot(activeHotspot)}
          onTalk={onStartTalk}
        />
      )}

      {/* Bottom Right: Touch / Screen Directional Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 bg-stone-900/75 backdrop-blur-md border border-stone-800 p-2 rounded-2xl shadow-xl">
        <button
          onMouseDown={() => controlsRef.current?.setDirection("forward", true)}
          onMouseUp={() => controlsRef.current?.setDirection("forward", false)}
          onTouchStart={() => controlsRef.current?.setDirection("forward", true)}
          onTouchEnd={() => controlsRef.current?.setDirection("forward", false)}
          className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          title="Avanzar (W / ↑)"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={() => controlsRef.current?.setDirection("left", true)}
            onMouseUp={() => controlsRef.current?.setDirection("left", false)}
            onTouchStart={() => controlsRef.current?.setDirection("left", true)}
            onTouchEnd={() => controlsRef.current?.setDirection("left", false)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
            title="Izquierda (A / ←)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onMouseDown={() => controlsRef.current?.setDirection("backward", true)}
            onMouseUp={() => controlsRef.current?.setDirection("backward", false)}
            onTouchStart={() => controlsRef.current?.setDirection("backward", true)}
            onTouchEnd={() => controlsRef.current?.setDirection("backward", false)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
            title="Retroceder (S / ↓)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onMouseDown={() => controlsRef.current?.setDirection("right", true)}
            onMouseUp={() => controlsRef.current?.setDirection("right", false)}
            onTouchStart={() => controlsRef.current?.setDirection("right", true)}
            onTouchEnd={() => controlsRef.current?.setDirection("right", false)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
            title="Derecha (D / →)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vocabulary & Learning Inspection Modal */}
      <VocabularyModal
        hotspot={inspectingHotspot}
        onClose={() => setInspectingHotspot(null)}
        onSelectPhrase={(phrase) => {
          onSimulateSpeech?.(phrase);
        }}
      />
    </div>
  );
}
