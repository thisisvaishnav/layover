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
  UNIFIED_PLAZA_BOUNDS,
  UNIFIED_PLAZA_OBSTACLES,
  UNIFIED_PLAZA_HOTSPOTS,
  getSpawnPositionForZone,
  getZoneFromPosition,
} from "@/lib/world/unified-plaza";
import { Hotspot, Position3D } from "@/lib/world/types";
import { useGameStore } from "@/lib/game/store";
import { HotspotPrompt } from "./HotspotPrompt";
import { InteractiveLearningModal } from "./InteractiveLearningModal";
import { MinimapHUD, MinimapHUDHandle } from "./MinimapHUD";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface Cafe3DWorldProps {
  onStartTalk?: () => void;
  onStopTalk?: () => void;
  onSimulateSpeech?: (text: string) => void;
  isVoiceActive?: boolean;
  className?: string;
  scenarioName?: string;
  placeType?: string;
  targetLang?: string;
  nativeLang?: string;
  hideControlsOverlay?: boolean;
  onSceneReady?: () => void;
}

export function Cafe3DWorld({
  onStartTalk,
  onStopTalk,
  onSimulateSpeech,
  isVoiceActive,
  className,
  scenarioName: _scenarioName = "Transit Plaza · Walkable 3D",
  placeType = "cafe",
  targetLang = "es",
  nativeLang = "en",
  hideControlsOverlay = false,
  onSceneReady,
}: Cafe3DWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Cafe3DScene | null>(null);
  const controlsRef = useRef<WorldControlsManager | null>(null);
  const minimapRef = useRef<MinimapHUDHandle | null>(null);

  // Player position state - spawn at chosen zone
  const initialSpawn = getSpawnPositionForZone(placeType);
  const playerPosRef = useRef<Position3D>({ ...initialSpawn });
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const isDialogueOpenRef = useRef(isDialogueOpen);

  useEffect(() => {
    isDialogueOpenRef.current = isDialogueOpen;
  }, [isDialogueOpen]);

  const [currentZone, setCurrentZone] = useState<string>("cafe");

  const { baristaAction } = useGameStore();

  const onSceneReadyRef = useRef(onSceneReady);
  useEffect(() => {
    onSceneReadyRef.current = onSceneReady;
  }, [onSceneReady]);

  // Open interactive learning dialogue modal
  const handleOpenDialogue = useCallback(() => {
    setIsDialogueOpen(true);
  }, []);

  // Initialize Three.js scene & game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize 3D Scene in unified mode
    const scene = new Cafe3DScene(canvasRef.current, placeType, {
      onPlayerMove: (pos, rot) => {
        minimapRef.current?.updatePlayer(pos, rot);
      },
      onReady: () => {
        onSceneReadyRef.current?.();
      },
    });
    sceneRef.current = scene;

    // 2. Initialize Keyboard Controls Manager (Arrow keys + WASD)
    const controls = new WorldControlsManager({
      onInteract: () => {
        handleOpenDialogue();
      },
      onTalkToggle: () => {
        handleOpenDialogue();
      },
    });
    controlsRef.current = controls;

    // 3. 60fps Movement & Proximity Tick Loop
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);
      const delta = Math.min((now - lastTime) / 1000, 0.05); // clamp delta
      lastTime = now;

      // Don't move avatar while dialogue modal is open so typing/spacebar doesn't trigger movement
      if (isDialogueOpenRef.current) {
        scene.updatePlayerPosition(playerPosRef.current, false, 0, 0);
        return;
      }

      const input = controls.getState();
      const dir = resolveVelocity(input);
      const isWalking = dir.x !== 0 || dir.z !== 0;

      // Normalized speed
      const speed = 4.4; // units per second
      const newPos = resolveMovement(
        playerPosRef.current,
        dir,
        speed,
        delta,
        UNIFIED_PLAZA_OBSTACLES,
        UNIFIED_PLAZA_BOUNDS,
        0.38
      );

      playerPosRef.current = newPos;
      // updatePlayerPosition forwards position & heading to onPlayerMove hook for MinimapHUD
      scene.updatePlayerPosition(newPos, isWalking, dir.x, dir.z);

      // Track active zone
      const detectedZone = getZoneFromPosition(newPos);
      setCurrentZone(detectedZone);

      // Proximity detection for unified plaza hotspots
      const spot = findActiveHotspot(newPos, UNIFIED_PLAZA_HOTSPOTS);
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
  }, [handleOpenDialogue, placeType]);

  // Sync Barista animation with game store
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setMateoTalking(baristaAction === "speaking");
    sceneRef.current.setBaristaBrewing(baristaAction === "brewing");
  }, [baristaAction]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-stone-950 select-none group ${
        className || "h-[460px] md:h-[540px] rounded-3xl border border-stone-800 shadow-2xl"
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
        tabIndex={0}
      />

      {/* Top Left: Controls & Zone Identity Overlay */}
      {!hideControlsOverlay && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          <div className="bg-stone-950/85 backdrop-blur-md border border-stone-800 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-stone-200">
              {currentZone === "cafe"
                ? "☕ Café de la Luna"
                : currentZone === "airport"
                ? "✈️ Airport Gate B12"
                : "🚏 City Bus Stop"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              Walkable Plaza
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-sm border border-stone-800/80 rounded-xl px-3 py-1.5 text-[11px] text-stone-300 shadow-lg">
            <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono font-bold text-amber-400">
              Arrow Keys / WASD
            </span>
            <span className="text-stone-400">walk</span>
            <span className="mx-1 text-stone-600">·</span>
            <span className="px-1.5 py-0.5 rounded bg-stone-800 font-mono font-bold text-amber-400">
              E
            </span>
            <span className="text-stone-400">interact</span>
          </div>
        </div>
      )}

      {/* Zone Quick-Warp Mini HUD (Top Right) */}
      <div className="absolute top-4 right-4 z-10 hidden md:flex items-center gap-1.5 bg-stone-950/80 backdrop-blur-md border border-stone-800 p-1.5 rounded-2xl text-[11px]">
        <span className="text-stone-400 px-2 font-bold text-[10px] uppercase tracking-wider">
          Zones:
        </span>
        <button
          onClick={() => {
            playerPosRef.current = { x: -14, y: 0, z: 2 };
          }}
          className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
            currentZone === "cafe"
              ? "bg-amber-500 text-black shadow-sm"
              : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          ☕ Café
        </button>
        <button
          onClick={() => {
            playerPosRef.current = { x: 0, y: 0, z: 2.5 };
          }}
          className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
            currentZone === "bus_stop"
              ? "bg-amber-500 text-black shadow-sm"
              : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          🚏 Bus Stop
        </button>
        <button
          onClick={() => {
            playerPosRef.current = { x: 14, y: 0, z: 2 };
          }}
          className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
            currentZone === "airport"
              ? "bg-amber-500 text-black shadow-sm"
              : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          ✈️ Airport Gate
        </button>
      </div>

      {/* Floating Active Hotspot Prompt */}
      {activeHotspot && !isDialogueOpen && (
        <HotspotPrompt
          hotspot={activeHotspot}
          onInteract={handleOpenDialogue}
          onTalk={handleOpenDialogue}
        />
      )}

      {/* Bottom Left: Live Minimap / City Radar HUD */}
      <MinimapHUD ref={minimapRef} currentZone={currentZone} />

      {/* Bottom Right: Touch / Screen Directional Controls (Moveable with Arrow Keys or buttons) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 bg-stone-900/80 backdrop-blur-md border border-stone-800 p-2 rounded-2xl shadow-2xl">
        <button
          onMouseDown={() => controlsRef.current?.setDirection("forward", true)}
          onMouseUp={() => controlsRef.current?.setDirection("forward", false)}
          onTouchStart={() => controlsRef.current?.setDirection("forward", true)}
          onTouchEnd={() => controlsRef.current?.setDirection("forward", false)}
          className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
          title="Forward (Arrow Up / W)"
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
            title="Left (Arrow Left / A)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onMouseDown={() => controlsRef.current?.setDirection("backward", true)}
            onMouseUp={() => controlsRef.current?.setDirection("backward", false)}
            onTouchStart={() => controlsRef.current?.setDirection("backward", true)}
            onTouchEnd={() => controlsRef.current?.setDirection("backward", false)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
            title="Backward (Arrow Down / S)"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onMouseDown={() => controlsRef.current?.setDirection("right", true)}
            onMouseUp={() => controlsRef.current?.setDirection("right", false)}
            onTouchStart={() => controlsRef.current?.setDirection("right", true)}
            onTouchEnd={() => controlsRef.current?.setDirection("right", false)}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 flex items-center justify-center text-xs font-bold transition-all active:scale-90"
            title="Right (Arrow Right / D)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Screenshot-Accurate Interactive Learning Dialogue Modal */}
      <InteractiveLearningModal
        isOpen={isDialogueOpen}
        onClose={() => setIsDialogueOpen(false)}
        zone={currentZone}
        targetLang={targetLang}
        nativeLang={nativeLang}
        onStartTalk={onStartTalk}
        onStopTalk={onStopTalk}
        onSimulateSpeech={onSimulateSpeech}
        isVoiceActive={isVoiceActive}
      />
    </div>
  );
}
