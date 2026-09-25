"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { generateMap, type GeneratedMap } from "../../map/map-generator";
import { buildMapMeshes, type MapMeshSystem } from "../../map/map-mesh-builder";
import {
  createPlayerState,
  setPlayerDestination,
  updatePlayerMovement,
  updatePlayerKeyboard,
  updatePlayerMouseAim,
  type PlayerState,
  type KeyboardInput,
  type Vector2D,
} from "../../player/movement-controller";
import { createPlayerCharacter, type PlayerCharacter } from "../../player/player-character";
import { createCameraController, type CameraController } from "../../camera/camera-controller";
import {
  createRaycastHandler,
  createDestinationIndicator,
  createCursorAimIndicator,
  type DestinationIndicator,
  type CursorAimIndicator,
  type RaycastHandler,
} from "../../interaction/raycast-handler";
import MinimapHUD from "./MinimapHUD";

interface WorldCanvasProps {
  onBackToOnboarding?: () => void;
}

export default function WorldCanvas({ onBackToOnboarding }: WorldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Data-Driven Map Generation (4x4 = 16 large plots, 1.5x larger plot size: 72x72)
  const mapData: GeneratedMap = useMemo(
    () =>
      generateMap({
        gridSize: 4,
        plotSize: 72,
        roadWidth: 20,
        hasPerimeterRoads: true,
      }),
    []
  );

  const parkPlot = useMemo(() => mapData.plots.find((p) => p.type === "park"), [mapData]);
  const initX = parkPlot ? parkPlot.x : 0;
  const initZ = parkPlot ? parkPlot.z - 38 : 0;

  const playerStateRef = useRef<{ position: Vector2D; rotation: number }>({
    position: { x: initX, z: initZ },
    rotation: 0,
  });

  const [hudState, setHudState] = useState<{
    x: number;
    z: number;
    isMoving: boolean;
    movementState: string;
    plotsCount: number;
  }>({
    x: Math.round(initX * 10) / 10,
    z: Math.round(initZ * 10) / 10,
    isMoving: false,
    movementState: "IDLE",
    plotsCount: 16,
  });

  const cameraControllerRef = useRef<CameraController | null>(null);

  const handleZoom = useCallback((deltaDist: number) => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.zoomBy(deltaDist);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetOrbit();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 2. Setup Three.js Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdde3ea); // Crisp modern atmosphere
    scene.fog = new THREE.FogExp2(0xdde3ea, 0.0014); // Balanced horizon fog for 388-unit city

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting System (scaled to cover 388-unit expanded world)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffdf5, 1.3);
    dirLight.position.set(120, 180, 90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 550;
    const d = 215;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d99ae, 0.35);
    scene.add(hemiLight);

    // 4. Build Map 3D Meshes
    const mapMeshes: MapMeshSystem = buildMapMeshes(mapData);
    scene.add(mapMeshes.group);

    // 5. Build Procedural 3D Human Player
    const playerChar: PlayerCharacter = createPlayerCharacter();
    scene.add(playerChar.group);

    // Initial player state facing straight ahead into Central Park
    let playerState: PlayerState = createPlayerState({
      x: initX,
      z: initZ,
      rotation: 0,
    });
    playerChar.update(playerState, 0);

    playerStateRef.current = {
      position: { x: initX, z: initZ },
      rotation: 0,
    };

    // 6. Camera Controller (Stable elevated third-person/isometric camera)
    const cameraController: CameraController = createCameraController(
      width,
      height,
      playerState.position
    );
    cameraControllerRef.current = cameraController;

    // 7. Destination Feedback Marker, Cursor Direction Indicator & Raycaster
    const destinationIndicator: DestinationIndicator = createDestinationIndicator();
    scene.add(destinationIndicator.mesh);
    const cursorAimIndicator: CursorAimIndicator = createCursorAimIndicator();
    scene.add(cursorAimIndicator.mesh);
    const raycastHandler: RaycastHandler = createRaycastHandler();

    // 8. Input State (Keyboard + Pointer)
    const keyboardInput: KeyboardInput = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;
    let hasPointer = false;
    let isRightDrag = false;

    const handlePointerDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest("button")) return;

      startPointerX = event.clientX;
      startPointerY = event.clientY;
      currentPointerX = event.clientX;
      currentPointerY = event.clientY;
      hasPointer = true;
      isDragging = false;

      // Right-click or middle-click or Shift+Click triggers camera orbit
      if (event.button === 2 || event.button === 1 || event.shiftKey) {
        isRightDrag = true;
      } else {
        isRightDrag = false;
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      currentPointerX = event.clientX;
      currentPointerY = event.clientY;
      hasPointer = true;

      const dx = event.clientX - startPointerX;
      const dy = event.clientY - startPointerY;
      if (Math.hypot(dx, dy) > 6) {
        isDragging = true;
      }

      if (isRightDrag || (isDragging && (event.buttons === 2 || event.buttons === 4))) {
        cameraController.rotateOrbit(-event.movementX * 0.005, -event.movementY * 0.004);
      }
    };

    const handlePointerUp = (event: MouseEvent) => {
      const isCanvas = event.target === renderer.domElement;
      if (!isCanvas || (event.target as HTMLElement).closest("button")) {
        isDragging = false;
        isRightDrag = false;
        return;
      }

      const hasKeyboardActive =
        keyboardInput.forward ||
        keyboardInput.backward ||
        keyboardInput.left ||
        keyboardInput.right;

      // Left click without significant dragging sets movement target (ignored if actively driving with keys)
      if (event.button === 0 && !isDragging && !isRightDrag && !hasKeyboardActive) {
        const rect = renderer.domElement.getBoundingClientRect();
        const hitPoint = raycastHandler.getPointedWorldCoordinates(
          event.clientX,
          event.clientY,
          rect,
          cameraController.camera,
          mapMeshes.clickableObjects
        );

        if (hitPoint) {
          // Clamp maximum click distance to 160 units
          const deltaX = hitPoint.x - playerState.position.x;
          const deltaZ = hitPoint.z - playerState.position.z;
          const dist = Math.hypot(deltaX, deltaZ);
          let target = hitPoint;
          if (dist > 160) {
            target = {
              x: playerState.position.x + (deltaX / dist) * 160,
              z: playerState.position.z + (deltaZ / dist) * 160,
            };
          }

          playerState = setPlayerDestination(playerState, target, mapData.bounds);
          if (playerState.target) {
            destinationIndicator.show(playerState.target);
          }
        }
      }

      isDragging = false;
      isRightDrag = false;
    };

    // Manual Mouse Wheel Zoom: Wheel UP -> Zoom IN, Wheel DOWN -> Zoom OUT
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      // event.deltaY < 0 is wheel up -> zoom IN (decrease distance)
      // event.deltaY > 0 is wheel down -> zoom OUT (increase distance)
      const zoomStep = (event.deltaY > 0 ? 1 : -1) * 2.5;
      cameraController.zoomBy(zoomStep);
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Enable smooth right-click camera drag without browser menu
    };

    // Keyboard Controller (Arrow keys & WASD)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      let handled = false;
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          keyboardInput.forward = true;
          handled = true;
          break;
        case "ArrowDown":
        case "KeyS":
          keyboardInput.backward = true;
          handled = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          keyboardInput.left = true;
          handled = true;
          break;
        case "ArrowRight":
        case "KeyD":
          keyboardInput.right = true;
          handled = true;
          break;
      }

      if (handled) {
        if (event.code.startsWith("Arrow")) {
          event.preventDefault(); // Prevent browser scrolling
        }
        destinationIndicator.hide();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          keyboardInput.forward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          keyboardInput.backward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          keyboardInput.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          keyboardInput.right = false;
          break;
      }
    };

    const handleBlur = () => {
      keyboardInput.forward = false;
      keyboardInput.backward = false;
      keyboardInput.left = false;
      keyboardInput.right = false;
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
    renderer.domElement.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        cameraController.handleResize(newWidth, newHeight);
        renderer.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Animation Loop with RAF cleanup
    let animationFrameId: number;
    let lastTime = performance.now();
    let hudThrottleCounter = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const deltaSeconds = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const hasKeyboardActive =
        keyboardInput.forward ||
        keyboardInput.backward ||
        keyboardInput.left ||
        keyboardInput.right;

      // Project mouse screen position onto ground plane for aiming & direction
      let cursorGroundPos: Vector2D | null = null;
      if (hasPointer && renderer.domElement) {
        const canvasRect = renderer.domElement.getBoundingClientRect();
        cursorGroundPos = raycastHandler.getGroundIntersection(
          currentPointerX,
          currentPointerY,
          canvasRect,
          cameraController.camera,
          mapData.bounds
        );
      }

      // Update subtle ground direction indicator
      if (cursorGroundPos) {
        cursorAimIndicator.show(cursorGroundPos);
      } else {
        cursorAimIndicator.hide();
      }
      cursorAimIndicator.update(deltaSeconds);

      // Update movement: keyboard controller takes highest priority and uses mouse-direction
      if (hasKeyboardActive) {
        playerState = updatePlayerKeyboard(
          playerState,
          keyboardInput,
          deltaSeconds,
          mapData.bounds,
          0.8,
          cursorGroundPos
        );
        destinationIndicator.hide();
      } else if (playerState.isMoving && playerState.target) {
        playerState = updatePlayerMovement(playerState, deltaSeconds, mapData.bounds);
        if (!playerState.isMoving) {
          destinationIndicator.hide();
        }
      } else {
        // When not moving via keyboard or click, mouse continuously controls player facing direction
        if (cursorGroundPos) {
          playerState = updatePlayerMouseAim(playerState, cursorGroundPos, deltaSeconds);
        }
        if (playerState.isMoving && !playerState.target) {
          playerState = { ...playerState, movementState: "IDLE", isMoving: false };
        }
      }

      // Sync position to ref for silky-smooth 60fps minimap rendering
      if (playerStateRef.current) {
        playerStateRef.current.position.x = playerState.position.x;
        playerStateRef.current.position.z = playerState.position.z;
        playerStateRef.current.rotation = playerState.rotation;
      }

      // Update 3D player mesh animation
      playerChar.update(playerState, deltaSeconds);

      // Update destination indicator animation
      destinationIndicator.update(deltaSeconds);

      // Update stable camera with obstacle collision check
      cameraController.update(
        playerState.position,
        deltaSeconds,
        playerState.rotation,
        mapMeshes.obstacleObjects
      );

      // Render frame
      renderer.render(scene, cameraController.camera);

      // Update React HUD state at ~10Hz
      hudThrottleCounter++;
      if (hudThrottleCounter % 6 === 0) {
        const roundedX = Math.round(playerState.position.x * 10) / 10;
        const roundedZ = Math.round(playerState.position.z * 10) / 10;
        const moving = playerState.isMoving;
        const mState = playerState.movementState;

        setHudState((prev) => {
          if (
            prev.x === roundedX &&
            prev.z === roundedZ &&
            prev.isMoving === moving &&
            prev.movementState === mState
          ) {
            return prev;
          }
          return {
            x: roundedX,
            z: roundedZ,
            isMoving: moving,
            movementState: mState,
            plotsCount: mapData.plots.length,
          };
        });
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    const handlePointerLeave = () => {
      hasPointer = false;
      cursorAimIndicator.hide();
    };

    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);

      mapMeshes.dispose();
      playerChar.dispose();
      destinationIndicator.dispose();
      cursorAimIndicator.dispose();

      scene.clear();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      cameraControllerRef.current = null;
    };
  }, [mapData, initX, initZ]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-slate-900 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top Header Overlay */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur border border-black/20 shadow-sm px-4 py-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase tracking-wider text-black">
              Interactive 3D World
            </span>
            <span className="text-[11px] font-mono text-black/60">
              GTA V Controls & Minimap · {hudState.plotsCount} Large Plots
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Camera Zoom Control Buttons */}
          <div className="flex items-center bg-white/90 backdrop-blur border border-black/20 shadow-sm px-1 py-1 gap-1">
            <button
              onClick={() => handleZoom(-3)}
              title="Zoom Camera In (Mouse Wheel Up)"
              aria-label="Zoom Camera In"
              className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-white hover:bg-black hover:text-white border border-black/15 transition-colors cursor-pointer"
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Camera Zoom"
              aria-label="Reset Camera Zoom"
              className="px-2 h-7 flex items-center justify-center font-mono text-[10px] bg-slate-100 hover:bg-black hover:text-white border border-black/15 transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => handleZoom(3)}
              title="Zoom Camera Out (Mouse Wheel Down)"
              aria-label="Zoom Camera Out"
              className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-white hover:bg-black hover:text-white border border-black/15 transition-colors cursor-pointer"
            >
              −
            </button>
          </div>

          {onBackToOnboarding && (
            <button
              onClick={onBackToOnboarding}
              className="px-3 py-2 bg-white/90 hover:bg-black hover:text-white backdrop-blur border border-black/20 text-black text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              ← Onboarding
            </button>
          )}
        </div>
      </header>

      {/* Floating Instructions & Coordinates HUD (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 pointer-events-none z-20 flex flex-col gap-2">
        <div className="pointer-events-auto bg-white/95 backdrop-blur border border-black/20 px-4 py-3 shadow-md max-w-md flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-black border-b border-black/10 pb-1.5">
            <span>Mouse-Direction Controls</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                hudState.movementState === "MOVING"
                  ? "bg-blue-100 text-blue-800 font-bold"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {hudState.movementState === "MOVING" ? "Moving" : "Idle"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-black/80 font-mono">
            <div><strong className="text-black font-bold">▲ / W</strong> Toward Cursor</div>
            <div><strong className="text-black font-bold">▼ / S</strong> Away From Cursor</div>
            <div><strong className="text-black font-bold">◄ / A</strong> Strafe Left</div>
            <div><strong className="text-black font-bold">► / D</strong> Strafe Right</div>
            <div className="col-span-2 pt-1 border-t border-black/10 text-[11px] text-black/70 font-sans">
              <strong className="font-semibold text-black">Mouse:</strong> Aim / Face Direction · <strong className="font-semibold text-black">Click:</strong> Walk To Point · <strong className="font-semibold text-black">Wheel:</strong> Zoom
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-black/60 pt-1 border-t border-black/10">
            <span>Pos X: <strong className="text-black font-semibold">{hudState.x}</strong></span>
            <span>Pos Z: <strong className="text-black font-semibold">{hudState.z}</strong></span>
            <span>State: <strong className="text-black font-semibold">{hudState.movementState}</strong></span>
          </div>
        </div>
      </div>

      {/* GTA V Style Circular Minimap HUD (Bottom-Right) */}
      <MinimapHUD
        mapData={mapData}
        playerStateRef={playerStateRef}
        initialScale={1.0}
      />
    </div>
  );
}
