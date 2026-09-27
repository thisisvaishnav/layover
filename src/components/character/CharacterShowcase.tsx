"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { createPlayerCharacter, type PlayerCharacter } from "@/player/player-character";
import { createPlayerState } from "@/player/movement-controller";
import { retroAudio } from "@/lib/audio/retro-audio";
import {
  RotateCcw,
  Footprints,
  Hand,
} from "lucide-react";

export interface CharacterShowcaseProps {
  selectedCountryCode?: string;
  selectedCountryName?: string;
  selectedCountryFlag?: string;
  nativeLangName?: string;
  mode?: "hero" | "completion" | "compact";
  className?: string;
  onInteract?: () => void;
}

// Localized dialogue snippets matching the game's actual 3D scenarios
const COUNTRY_GREETINGS: Record<
  string,
  { phrase: string; phonetic: string; translation: string }
> = {
  es: {
    phrase: "¡Dos cafés, por favor! ☕",
    phonetic: "Dohs kah-FES, por fah-VOR!",
    translation: "Two coffees, please!",
  },
  hi: {
    phrase: "एक कप मसाला चाय, कृपया! ☕",
    phonetic: "Ek cup masala chai, kripya!",
    translation: "One cup of masala chai, please!",
  },
  ja: {
    phrase: "こんにちは！カフェラテをください ☕",
    phonetic: "Konnichiwa! Kafe rate o kudasai",
    translation: "Hello! A cafe latte please",
  },
  fr: {
    phrase: "Deux cafés, s'il vous plaît ! ☕",
    phonetic: "Duh ka-FAY, seel voo play!",
    translation: "Two coffees, please!",
  },
  it: {
    phrase: "Due caffè, per favore! ☕",
    phonetic: "DOO-eh kahf-FEH, pehr fah-VOH-reh!",
    translation: "Two coffees, please!",
  },
};

export default function CharacterShowcase({
  selectedCountryCode = "es",
  selectedCountryName = "Spain",
  selectedCountryFlag = "🇪🇸",
  mode = "hero",
  className = "",
  onInteract,
}: CharacterShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction & animation states
  const [animMode, setAnimMode] = useState<"idle" | "walk" | "wave">("idle");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [speechVisible, setSpeechVisible] = useState<boolean>(true);
  const [waveTimer, setWaveTimer] = useState<number>(0);

  // Mutable refs for Three.js animation loop (initialized purely)
  const stateRef = useRef({
    animMode: "idle" as "idle" | "walk" | "wave",
    rotationY: 0.2,
    targetRotationY: 0.2,
    isDragging: false,
    dragStartX: 0,
    dragStartRotation: 0.2,
    lastInteractionTime: 0,
    waveTime: 0,
    walkTime: 0,
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.animMode = animMode;
  }, [animMode]);

  // Greeting information based on selected country
  const greeting = COUNTRY_GREETINGS[selectedCountryCode] || COUNTRY_GREETINGS.es;

  // Trigger temporary wave greeting
  const triggerWave = useCallback(() => {
    try {
      retroAudio.playSelect();
    } catch {
      // Audio might be muted
    }
    setAnimMode("wave");
    stateRef.current.waveTime = 0;
    stateRef.current.lastInteractionTime = Date.now();
    setSpeechVisible(true);

    if (onInteract) onInteract();

    // Auto-return to idle after 3.2s of waving
    if (waveTimer) clearTimeout(waveTimer);
    const timer = window.setTimeout(() => {
      setAnimMode("idle");
    }, 3200);
    setWaveTimer(timer);
  }, [onInteract, waveTimer]);

  // Three.js Mount & Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isDisposed = false;
    let animationFrameId: number;

    stateRef.current.lastInteractionTime = Date.now();

    // 1. Scene & Camera
    const scene = new THREE.Scene();

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (e) {
      console.warn("WebGL not supported or context lost:", e);
      return;
    }

    // Dynamic framing to ensure full character (height ~5.2) and podium (diameter ~5.6)
    // are completely visible with comfortable breathing room on all screen ratios
    const updateCameraFraming = () => {
      const w = container.clientWidth || 380;
      const h = container.clientHeight || 420;
      if (w === 0 || h === 0) return;

      const aspect = w / h;
      camera.aspect = aspect;

      const targetFitHeight = 7.6;
      const targetFitWidth = 6.4;

      const fovRad = (camera.fov * Math.PI) / 180;
      const distForHeight = (targetFitHeight / 2) / Math.tan(fovRad / 2);
      const distForWidth = (targetFitWidth / 2) / (Math.tan(fovRad / 2) * aspect);

      const targetDist = Math.max(distForHeight, distForWidth, 12.2);
      camera.position.set(0, 2.4 + targetDist * 0.09, targetDist);
      camera.lookAt(0, 2.4, 0);

      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    updateCameraFraming();

    // 3. Stage & Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    scene.add(keyLight);

    // Warm front fill to bring out facial features and clothing details
    const fillLight = new THREE.DirectionalLight(0xfff1e6, 0.5);
    fillLight.position.set(0, 3, 8);
    scene.add(fillLight);

    // Cool rim light to highlight blue outfit contours
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-5, 6, -5);
    scene.add(rimLight);

    // Ground Podium - Terracotta Red Tiles matching the 3D world cafe floor
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const ctx = tileCanvas.getContext("2d");
    if (ctx) {
      // Base terracotta red floor
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(0, 0, 256, 256);

      // Grid tile squares
      const tileSize = 64;
      for (let x = 0; x < 256; x += tileSize) {
        for (let y = 0; y < 256; y += tileSize) {
          ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? "#b91c1c" : "#991b1b";
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        }
      }

      // Dark grout / seams
      ctx.strokeStyle = "#450a0a";
      ctx.lineWidth = 3;
      for (let x = 0; x <= 256; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
      for (let y = 0; y <= 256; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    }

    const tileTexture = new THREE.CanvasTexture(tileCanvas);
    tileTexture.wrapS = THREE.RepeatWrapping;
    tileTexture.wrapT = THREE.RepeatWrapping;
    tileTexture.repeat.set(3, 3);

    // Circular Red-Tile Podium: top surface at y = 0 (feet level)
    const podiumGeo = new THREE.CylinderGeometry(2.7, 2.8, 0.32, 48);
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const topMat = new THREE.MeshLambertMaterial({
      map: tileTexture,
    });
    const bottomMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const podium = new THREE.Mesh(podiumGeo, [sideMat, topMat, bottomMat]);
    podium.position.y = -0.16;
    podium.receiveShadow = true;
    scene.add(podium);

    // Golden accent border ring around podium top edge (at y = 0.005)
    const topRingGeo = new THREE.TorusGeometry(2.71, 0.035, 12, 48);
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xffb800 });
    const topRingMesh = new THREE.Mesh(topRingGeo, goldMat);
    topRingMesh.rotation.x = Math.PI / 2;
    topRingMesh.position.y = 0.005;
    scene.add(topRingMesh);

    // Base trim ring around bottom perimeter (at y = -0.315)
    const baseRingGeo = new THREE.TorusGeometry(2.81, 0.035, 12, 48);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: 0x27272a });
    const baseRingMesh = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRingMesh.rotation.x = Math.PI / 2;
    baseRingMesh.position.y = -0.315;
    scene.add(baseRingMesh);

    // Ambient ground shadow under entire stage (at y = -0.33)
    const groundShadowGeo = new THREE.CircleGeometry(3.3, 32);
    const groundShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const groundShadow = new THREE.Mesh(groundShadowGeo, groundShadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -0.33;
    scene.add(groundShadow);

    // 4. Procedural 3D Player Character
    const character: PlayerCharacter = createPlayerCharacter();
    scene.add(character.group);

    // Find limbs for custom wave animation
    const rightArmPivot = character.group.getObjectByName("rightArmPivot") as THREE.Group | undefined;
    const headGroup = character.group.getObjectByName("headGroup") as THREE.Group | undefined;

    // 5. Animation Loop
    let lastTime = performance.now();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;

      // Handle gentle auto-spin when idle
      const timeSinceInteract = Date.now() - state.lastInteractionTime;
      if (!state.isDragging && timeSinceInteract > 1600 && state.animMode !== "wave") {
        state.targetRotationY += delta * 0.38;
      }

      // Smooth interpolation to target rotation
      state.rotationY += (state.targetRotationY - state.rotationY) * Math.min(delta * 12, 1);
      character.group.rotation.y = state.rotationY;

      // Update character based on active animation mode
      if (state.animMode === "walk") {
        state.walkTime += delta;
        character.update(
          createPlayerState({
            position: { x: 0, y: 0, z: 0 },
            rotation: state.rotationY,
            isMoving: true,
            speed: 14.11,
          }),
          delta
        );
      } else if (state.animMode === "wave") {
        state.waveTime += delta;
        // Keep idle physics on character legs and torso
        character.update(
          createPlayerState({
            position: { x: 0, y: 0, z: 0 },
            rotation: state.rotationY,
            isMoving: false,
            speed: 0,
          }),
          delta
        );

        // Animate friendly right arm waving
        if (rightArmPivot) {
          // Raise arm up and wave back and forth
          rightArmPivot.rotation.z = Math.PI * 0.62 + Math.sin(state.waveTime * 9) * 0.28;
          rightArmPivot.rotation.x = Math.sin(state.waveTime * 9) * 0.35;
        }

        // Subtly tilt head cheerfully
        if (headGroup) {
          headGroup.rotation.z = -0.08 + Math.sin(state.waveTime * 4.5) * 0.05;
        }
      } else {
        // Natural resting idle stance with gentle breathing
        character.update(
          createPlayerState({
            position: { x: 0, y: 0, z: 0 },
            rotation: state.rotationY,
            isMoving: false,
            speed: 0,
          }),
          delta
        );

        // Breathing sway
        const breathe = Math.sin(now * 0.003) * 0.012;
        character.group.position.y = breathe;

        if (headGroup) {
          headGroup.rotation.z *= 0.9;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Responsive Resize Handling
    const handleResize = () => {
      updateCameraFraming();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      character.dispose();
      podiumGeo.dispose();
      sideMat.dispose();
      topMat.dispose();
      bottomMat.dispose();
      topRingGeo.dispose();
      goldMat.dispose();
      baseRingGeo.dispose();
      baseRingMat.dispose();
      groundShadowGeo.dispose();
      groundShadowMat.dispose();
      tileTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // Pointer Drag to Rotate
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    stateRef.current.isDragging = true;
    stateRef.current.dragStartX = clientX;
    stateRef.current.dragStartRotation = stateRef.current.targetRotationY;
    stateRef.current.lastInteractionTime = Date.now();
  };

  const handlePointerMove = (clientX: number) => {
    if (!stateRef.current.isDragging) return;
    const deltaX = clientX - stateRef.current.dragStartX;
    const newRot = stateRef.current.dragStartRotation + deltaX * 0.012;
    stateRef.current.targetRotationY = newRot;
    stateRef.current.lastInteractionTime = Date.now();
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    stateRef.current.isDragging = false;
    stateRef.current.lastInteractionTime = Date.now();
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={handlePointerUp}
      className={`relative w-full border-[3px] border-black bg-[#121316] shadow-[8px_8px_0px_#FF5722] flex flex-col select-none overflow-hidden ${
        mode === "compact" ? "h-64" : mode === "completion" ? "h-80" : "h-[390px] sm:h-[430px]"
      } ${className}`}
    >
      {/* Neo-brutalist Header Bar */}
      <div className="bg-[#1A1B20] text-white px-3.5 py-2 border-b-2 border-black flex items-center justify-between text-xs font-mono font-bold tracking-wider z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D084] animate-ping" />
          <span className="text-[#FFB800] uppercase">3D OPERATIVE</span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-white/80 hidden sm:inline">CENTRAL DISTRICT</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline bg-[#121316] text-[#FFB800] px-2 py-0.5 text-[10px] font-mono border border-white/20">
            BLUE ATTIRE
          </span>
          <div className="bg-[#FF5722] text-white px-2 py-0.5 text-[10px] uppercase font-black tracking-wider border border-black shadow-[1px_1px_0px_#000]">
            {selectedCountryFlag} {selectedCountryName}
          </div>
        </div>
      </div>

      {/* Floating Interactive Speech Bubble (compact comic balloon placed safely above head) */}
      {speechVisible ? (
        <div
          onClick={triggerWave}
          className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[290px] bg-white border-2 border-black shadow-[3px_3px_0px_#000] p-2 cursor-pointer hover:scale-[1.02] transition-transform animate-in fade-in slide-in-from-top-1 duration-150 group"
          title="Click to interact with avatar"
        >
          <div className="flex items-center justify-between gap-1 text-[11px] font-black text-black">
            <span className="truncate">{greeting.phrase}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSpeechVisible(false);
              }}
              className="w-4 h-4 rounded-none bg-neutral-100 hover:bg-neutral-200 border border-black text-[10px] flex items-center justify-center text-black/60 hover:text-black font-mono ml-1"
              title="Hide dialogue"
            >
              ×
            </button>
          </div>
          <div className="text-[10px] font-mono text-black/70 flex items-center justify-between gap-2 mt-0.5 pt-0.5 border-t border-black/10">
            <span className="italic truncate">&ldquo;{greeting.translation}&rdquo;</span>
            <span className="text-[#7C3AED] font-black text-[9px] uppercase tracking-wider whitespace-nowrap group-hover:underline">
              👋 WAVE
            </span>
          </div>
          {/* Speech Bubble Pointer Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-black rotate-45" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setSpeechVisible(true);
            triggerWave();
          }}
          className="absolute top-2.5 right-2.5 z-30 bg-white/95 hover:bg-white text-black border border-black shadow-[2px_2px_0px_#000] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>💬 Dialogue</span>
        </button>
      )}

      {/* Interactive 3D WebGL Canvas */}
      <div
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing touch-none bg-gradient-to-b from-[#1c1e24] via-[#121316] to-[#0c0d10]"
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
        }}
        onTouchEnd={handlePointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Drag Hint Overlay */}
        {!isDragging && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 bg-black/60 backdrop-blur-xs text-white/90 border border-white/20 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5 text-[#FFB800] animate-spin" />
            <span>DRAG 360°</span>
          </div>
        )}
      </div>

      {/* Interactive Controls & Animation Action Bar */}
      <div className="bg-[#18191E] border-t-2 border-black p-2.5 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5">
          {/* Idle Pose Button */}
          <button
            type="button"
            onClick={() => {
              setAnimMode("idle");
              try {
                retroAudio.playSelect();
              } catch {}
            }}
            className={`px-2.5 py-1.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000] ${
              animMode === "idle"
                ? "bg-[#FFB800] text-black -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_#000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            <span>Ready</span>
          </button>

          {/* Stride / Walk Button */}
          <button
            type="button"
            onClick={() => {
              setAnimMode("walk");
              try {
                retroAudio.playSelect();
              } catch {}
            }}
            className={`px-2.5 py-1.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000] ${
              animMode === "walk"
                ? "bg-[#00D084] text-black -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_#000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>

          {/* Wave / Greet Button */}
          <button
            type="button"
            onClick={triggerWave}
            className={`px-2.5 py-1.5 text-xs font-mono font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000] ${
              animMode === "wave"
                ? "bg-[#7C3AED] text-white -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_#000]"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Wave</span>
          </button>
        </div>

        {/* Reset / Front view button */}
        <button
          type="button"
          onClick={() => {
            stateRef.current.targetRotationY = 0.2;
            stateRef.current.lastInteractionTime = Date.now();
            try {
              retroAudio.playSelect();
            } catch {}
          }}
          className="px-2 py-1.5 bg-[#262830] text-white/80 hover:text-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono uppercase tracking-wider cursor-pointer hover:bg-[#323540] transition-colors flex items-center gap-1"
          title="Reset view to front"
        >
          <RotateCcw className="w-3 h-3 text-[#FFB800]" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}
