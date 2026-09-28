"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { generateMap, getParkSpawnPoint, type GeneratedMap } from "../../map/map-generator";
import { buildMapMeshes, type MapMeshSystem } from "../../map/map-mesh-builder";
import { createTrafficSystem, type TrafficSystem } from "../../map/traffic-system";
import { createSunlightSystem, type SunlightSystem } from "../../map/sunlight-system";
import {
  createPlayerState,
  setPlayerDestination,
  updatePlayerMovement,
  updatePlayerMovementState,
  selectMovementUpdate,
  DEFAULT_MOVEMENT_CONFIG,
  type PlayerState,
  type KeyboardInput,
  type Vector2D,
} from "../../player/movement-controller";
import { PlayerCollisionWorld } from "../../player/world-collision";
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
import { MapPlacesDirectory } from "./MapPlacesDirectory";
import { createCoffeeShop, isWithinInteractionRange, type CoffeeShopSystem } from "../../interaction/coffee-shop";
import { createBusStop, isWithinBusStopRange, type BusStopSystem } from "../../interaction/bus-stop";
import { createTaxiStand, isWithinTaxiStandRange, type TaxiStandSystem } from "../../interaction/taxi-stand";
import { createBarberShop, isWithinBarberShopRange, type BarberShopSystem } from "../../interaction/barber-shop";
import { useConversationStore } from "../../lib/conversation/store";
import { COFFEE_SHOP_WORLD_POSITION, COFFEE_SHOP_ROTATION } from "../../scenarios/coffee-shop-scenario";
import { BUS_STOP_WORLD_POSITION } from "../../scenarios/bus-stop-scenario";
import { TAXI_STAND_WORLD_POSITION, TAXI_STAND_ROTATION } from "../../scenarios/taxi-stand-scenario";
import { BARBER_SHOP_WORLD_POSITION } from "../../scenarios/barber-shop-scenario";
import {
  getMultilingualScenario,
  type MultilingualScenarioConfig,
  SUPPORTED_LEARNER_LANGUAGES,
} from "../../scenarios/multilingual";
import { ONBOARDING_COUNTRIES } from "../../scenarios/catalog";
import { InteractionPrompt } from "../conversation/InteractionPrompt";

interface WorldCanvasProps {
  onBackToOnboarding?: () => void;
  targetLang?: string;
  nativeLang?: string;
}

export default function WorldCanvas({ onBackToOnboarding, targetLang, nativeLang }: WorldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic language configuration from onboarding or URL/localStorage
  const resolvedTargetLang = useMemo(() => {
    if (targetLang) return targetLang;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTarget = urlParams.get("target");
      if (urlTarget) return urlTarget;
      const stored = localStorage.getItem("layover_target_lang");
      if (stored) return stored;
    }
    return "ja";
  }, [targetLang]);

  const resolvedNativeLang = useMemo(() => {
    if (nativeLang) return nativeLang;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlNative = urlParams.get("native");
      if (urlNative) return urlNative;
      const stored = localStorage.getItem("layover_native_lang");
      if (stored) return stored;
    }
    return "ja";
  }, [nativeLang]);

  const targetCountry = useMemo(
    () => ONBOARDING_COUNTRIES.find((c) => c.code === resolvedTargetLang) || ONBOARDING_COUNTRIES[0],
    [resolvedTargetLang]
  );

  const learnerLang = useMemo(
    () =>
      SUPPORTED_LEARNER_LANGUAGES.find((l) => l.code === resolvedNativeLang) ||
      SUPPORTED_LEARNER_LANGUAGES[0],
    [resolvedNativeLang]
  );

  const targetLangRef = useRef(resolvedTargetLang);
  const nativeLangRef = useRef(resolvedNativeLang);

  useEffect(() => {
    targetLangRef.current = resolvedTargetLang;
    nativeLangRef.current = resolvedNativeLang;
  }, [resolvedTargetLang, resolvedNativeLang]);

  // 1. Data-Driven Map Generation (4x4 = 16 large plots, 1.5x larger plot size: 72x72)
  const mapData: GeneratedMap = useMemo(
    () =>
      generateMap({
        gridSize: 4,
        plotSize: 72,
        roadWidth: 20,
        hasPerimeterRoads: true,
        parkSizeMultiplier: 2,
      }),
    []
  );

  // Spawn on the park lawn (south of the memorial), never on the perimeter footpath
  const spawnPoint = useMemo(() => getParkSpawnPoint(mapData), [mapData]);
  const initX = spawnPoint.x;
  const initZ = spawnPoint.z;

  const playerStateRef = useRef<{ position: Vector2D; rotation: number }>({
    position: { x: initX, z: initZ },
    rotation: 0,
  });

  const [hudState, setHudState] = useState<{
    x: number;
    z: number;
    isMoving: boolean;
    movementState: string;
    movementMode: string;
    plotsCount: number;
  }>({
    x: Math.round(initX * 10) / 10,
    z: Math.round(initZ * 10) / 10,
    isMoving: false,
    movementState: "IDLE",
    movementMode: "FREE_ROAM",
    plotsCount: 16,
  });

  const cameraControllerRef = useRef<CameraController | null>(null);
  const coffeeShopRef = useRef<CoffeeShopSystem | null>(null);
  const busStopRef = useRef<BusStopSystem | null>(null);
  const taxiStandRef = useRef<TaxiStandSystem | null>(null);
  const barberShopRef = useRef<BarberShopSystem | null>(null);
  const [showControls, setShowControls] = useState(false);
  const navigateToTargetRef = useRef<Vector2D | null>(null);

  const handleNavigateToPlace = useCallback((position: Vector2D) => {
    navigateToTargetRef.current = position;
  }, []);

  // Active scenario tracking for dynamic interaction (Coffee Shop vs Bus Stop vs Taxi Stand vs Barber Shop)
  const [activeScenario, setActiveScenario] = useState<MultilingualScenarioConfig>(() =>
    getMultilingualScenario(resolvedTargetLang, resolvedNativeLang, "cafe")
  );

  const activeScenarioRef = useRef<MultilingualScenarioConfig>(
    getMultilingualScenario(resolvedTargetLang, resolvedNativeLang, "cafe")
  );

  useEffect(() => {
    const isBarber = activeScenarioRef.current.id.includes("barber");
    const isBus = activeScenarioRef.current.id.includes("bus");
    const isTaxi = activeScenarioRef.current.id.includes("taxi");
    const zone: "cafe" | "bus_stop" | "taxi" | "barber" = isBarber ? "barber" : isTaxi ? "taxi" : (isBus ? "bus_stop" : "cafe");
    const updated = getMultilingualScenario(
      resolvedTargetLang,
      resolvedNativeLang,
      zone
    );
    activeScenarioRef.current = updated;
    setActiveScenario(updated);
  }, [resolvedTargetLang, resolvedNativeLang]);

  // Conversation state: read from Zustand so JSX can react to changes
  const conversationInRange = useConversationStore((s) => s.isInRange);

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
    scene.background = new THREE.Color(0xf0f4f9); // Bright sunny sky atmosphere
    scene.fog = new THREE.FogExp2(0xf0f4f9, 0.0010); // Clear, soft luminous horizon fog for 388-unit city

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
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // 3. Lighting System (bright, warm daylight covering 388-unit world)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    // Primary direct warm sunlight aligned with celestial sun position
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.85);
    dirLight.position.set(180, 260, 140);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 650;
    const d = 230;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Secondary soft fill light from opposite angle to prevent dark shadowed faces
    const fillLight = new THREE.DirectionalLight(0xeef4fc, 0.40);
    fillLight.position.set(-120, 140, -100);
    scene.add(fillLight);

    // Dynamic sky-and-ground hemisphere bounce (warm sunlight from above, soft sky bounce)
    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0xc9d9e8, 0.75);
    scene.add(hemiLight);

    // 4. Build Map 3D Meshes (with country-specific memorial)
    const mapMeshes: MapMeshSystem = buildMapMeshes(mapData, {
      countryCode: targetCountry.code,
    });
    scene.add(mapMeshes.group);

    // 4b. Build Coffee Shop Stall (NPC interaction point on the Central Park lawn)
    const coffeeShop = createCoffeeShop(
      COFFEE_SHOP_WORLD_POSITION.x,
      COFFEE_SHOP_WORLD_POSITION.z,
      COFFEE_SHOP_ROTATION
    );
    scene.add(coffeeShop.group);
    coffeeShopRef.current = coffeeShop;

    // 4c. Build Bus Stop Shelter & Conductor (NPC interaction point in Transit Plaza)
    const busStop = createBusStop(
      BUS_STOP_WORLD_POSITION.x,
      BUS_STOP_WORLD_POSITION.z
    );
    scene.add(busStop.group);
    busStopRef.current = busStop;

    // 4c2. Build Taxi Stand, Bay Shelter & Local Stationed Taxis (NPC interaction point on West plot)
    const taxiStand = createTaxiStand(
      TAXI_STAND_WORLD_POSITION.x,
      TAXI_STAND_WORLD_POSITION.z,
      { countryCode: targetCountry.code, rotation: TAXI_STAND_ROTATION }
    );
    scene.add(taxiStand.group);
    taxiStandRef.current = taxiStand;

    // 4c3. Build Boutique Vintage Barber Shop Salon (NPC interaction point on East plot, plot-1-2)
    const barberShop = createBarberShop(
      BARBER_SHOP_WORLD_POSITION.x,
      BARBER_SHOP_WORLD_POSITION.z,
      {
        countryCode: targetCountry.code,
        rotation: -Math.PI / 2, // Facing West towards the road separating Central Park and plot-1-2
      }
    );
    scene.add(barberShop.group);
    barberShopRef.current = barberShop;

    // 4d. Build Dynamic City Traffic System (Red Transit Buses & Selective Cars)
    const trafficSystem: TrafficSystem = createTrafficSystem(mapData);
    scene.add(trafficSystem.group);

    // 4d2. Player collision world — solid shops, buildings, street lights + moving cars
    const collisionWorld = new PlayerCollisionWorld();
    collisionWorld.addStatic(mapMeshes.obstacleObjects);
    collisionWorld.addStatic([coffeeShop.group, busStop.group, taxiStand.group, barberShop.group]);
    collisionWorld.addDynamic(trafficSystem.vehicles.map((vehicle) => vehicle.group));

    // 4e. Cinematic Sunlight System (Sun core, radiant corona, volumetric god rays, airborne motes)
    const sunlightSystem: SunlightSystem = createSunlightSystem({
      sunPosition: dirLight.position,
    });
    scene.add(sunlightSystem.group);

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

      // Right-click triggers aiming mode and camera orbit
      if (event.button === 2) {
        isRightDrag = true;
        keyboardInput.aiming = true;
      } else if (event.button === 1 || event.shiftKey) {
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
      if (event.button === 2) {
        keyboardInput.aiming = false;
      }

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

        case "KeyE": {
          // The conversation overlay was removed — E is still the interact key,
          // so it only holds the player in place while the prompt is on screen.
          const convState = useConversationStore.getState();
          if (convState.isInRange && !convState.isOpen) {
            keyboardInput.forward = false;
            keyboardInput.backward = false;
            keyboardInput.left = false;
            keyboardInput.right = false;
            playerState = {
              ...playerState,
              movementState: "IDLE",
              isMoving: false,
              target: null,
              velocity: { x: 0, y: playerState.verticalVelocity, z: 0 },
            };
            destinationIndicator.hide();
          }
          handled = true;
          break;
        }
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
      keyboardInput.aiming = false;
      hasPointer = false;
      cursorAimIndicator.hide();
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
    const movementCamera = new THREE.PerspectiveCamera();
    let activeKeyCombo: string | null = null;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const deltaSeconds = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Freeze all player input and stop motion while conversation is open
      const isConvOpen = useConversationStore.getState().isOpen;
      if (isConvOpen) {
        keyboardInput.forward = false;
        keyboardInput.backward = false;
        keyboardInput.left = false;
        keyboardInput.right = false;
        keyboardInput.aiming = false;
        if (playerState.isMoving) {
          playerState = {
            ...playerState,
            movementState: "IDLE",
            isMoving: false,
            target: null,
            velocity: { x: 0, y: playerState.verticalVelocity, z: 0 },
          };
          destinationIndicator.hide();
        }
      }

      // Programmatic navigation triggered by Places Directory
      if (navigateToTargetRef.current && !isConvOpen) {
        const navTarget = navigateToTargetRef.current;
        navigateToTargetRef.current = null;
        playerState = setPlayerDestination(playerState, navTarget, mapData.bounds);
        if (playerState.target) {
          destinationIndicator.show(playerState.target);
        }
      }

      const hasKeyboardActive =

        keyboardInput.forward ||
        keyboardInput.backward ||
        keyboardInput.left ||
        keyboardInput.right;

      const inputX = (keyboardInput.right ? 1 : 0) - (keyboardInput.left ? 1 : 0);
      const inputY = (keyboardInput.forward ? 1 : 0) - (keyboardInput.backward ? 1 : 0);
      const keyCombo = `${inputX},${inputY}`;

      if (hasKeyboardActive && !keyboardInput.aiming) {
        if (activeKeyCombo !== keyCombo) {
          activeKeyCombo = keyCombo;
          movementCamera.copy(cameraController.camera);
          movementCamera.updateMatrixWorld();
        }
      } else {
        activeKeyCombo = null;
      }

      const camForMovement = (activeKeyCombo && !keyboardInput.aiming)
        ? movementCamera
        : cameraController.camera;

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

      // Aim reticle indicator: only displayed during AIMING mode
      if (keyboardInput.aiming && cursorGroundPos) {
        cursorAimIndicator.show(cursorGroundPos);
        cursorAimIndicator.update(deltaSeconds);
      } else {
        cursorAimIndicator.hide();
      }

      const horizontalSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);

      // Re-read moving car transforms so the player collides with their current position
      collisionWorld.refreshDynamic();
      const solidObstacles = collisionWorld.colliders;

      // Update movement: Camera-Relative Locomotion from player perspective & Aiming
      const movementUpdate = selectMovementUpdate(playerState, keyboardInput, horizontalSpeed);
      if (movementUpdate === "KEYBOARD") {
        playerState = updatePlayerMovementState(
          playerState,
          keyboardInput,
          camForMovement,
          deltaSeconds,
          mapData.bounds,
          0.8,
          DEFAULT_MOVEMENT_CONFIG,
          solidObstacles
        );
        destinationIndicator.hide();
      } else if (playerState.isMoving && playerState.target) {
        playerState = updatePlayerMovement(
          playerState,
          deltaSeconds,
          mapData.bounds,
          0.8,
          solidObstacles
        );
        if (!playerState.isMoving) {
          destinationIndicator.hide();
        }
      } else {
        if (playerState.isMoving && !playerState.target) {
          playerState = {
            ...playerState,
            movementState: "IDLE",
            isMoving: false,
            velocity: { x: 0, y: playerState.verticalVelocity, z: 0 },
          };
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

      // Update coffee shop, bus stop, taxi stand, and barber shop NPC animations
      const isCoffeeConv = isConvOpen && activeScenarioRef.current.id.includes("cafe");
      const isBusConv = isConvOpen && activeScenarioRef.current.id.includes("bus");
      const isTaxiConv = isConvOpen && activeScenarioRef.current.id.includes("taxi");
      const isBarberConv = isConvOpen && activeScenarioRef.current.id.includes("barber");
      coffeeShop.update(deltaSeconds, isCoffeeConv);
      busStop.update(deltaSeconds, isBusConv);
      taxiStand.update(deltaSeconds, isTaxiConv);
      barberShop.update(deltaSeconds, isBarberConv);

      // Update dynamic city traffic (buses and selective cars)
      trafficSystem.update(deltaSeconds);

      // Update cinematic sunlight effect (god rays breathing, dust motes drifting, camera glare)
      sunlightSystem.update(deltaSeconds, cameraController.camera);

      // NPC proximity check — determine if player is near Coffee Shop, Bus Stop, Taxi Stand, or Barber Shop
      const coffeePos = coffeeShop.npcWorldPosition;
      const inCoffeeRange = isWithinInteractionRange(
        playerState.position.x,
        playerState.position.z,
        coffeePos.x,
        coffeePos.z,
        12
      );

      const busPos = busStop.conductorWorldPosition;
      const inBusRange = isWithinBusStopRange(
        playerState.position.x,
        playerState.position.z,
        busPos.x,
        busPos.z,
        12
      );

      const taxiPos = taxiStand.driverWorldPosition;
      const inTaxiRange = isWithinTaxiStandRange(
        playerState.position.x,
        playerState.position.z,
        taxiPos.x,
        taxiPos.z,
        12
      );

      const barberPos = barberShop.npcWorldPosition;
      const inBarberRange = isWithinBarberShopRange(
        playerState.position.x,
        playerState.position.z,
        barberPos.x,
        barberPos.z,
        12
      );

      const isNearAnyNpc = inCoffeeRange || inBusRange || inTaxiRange || inBarberRange;
      if (inCoffeeRange) {
        const cafeScenario = getMultilingualScenario(targetLangRef.current, nativeLangRef.current, "cafe");
        if (activeScenarioRef.current.id !== cafeScenario.id) {
          activeScenarioRef.current = cafeScenario;
          setActiveScenario(cafeScenario);
        }
      } else if (inBusRange) {
        const busScenario = getMultilingualScenario(targetLangRef.current, nativeLangRef.current, "bus_stop");
        if (activeScenarioRef.current.id !== busScenario.id) {
          activeScenarioRef.current = busScenario;
          setActiveScenario(busScenario);
        }
      } else if (inTaxiRange) {
        const taxiScenario = getMultilingualScenario(targetLangRef.current, nativeLangRef.current, "taxi");
        if (activeScenarioRef.current.id !== taxiScenario.id) {
          activeScenarioRef.current = taxiScenario;
          setActiveScenario(taxiScenario);
        }
      } else if (inBarberRange) {
        const barberScenario = getMultilingualScenario(targetLangRef.current, nativeLangRef.current, "barber");
        if (activeScenarioRef.current.id !== barberScenario.id) {
          activeScenarioRef.current = barberScenario;
          setActiveScenario(barberScenario);
        }
      }

      const prevInRange = useConversationStore.getState().isInRange;
      if (isNearAnyNpc !== prevInRange) {
        useConversationStore.getState().setInRange(isNearAnyNpc);
      }

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
        const mMode = playerState.movementMode ?? (keyboardInput.aiming ? "AIMING" : "FREE_ROAM");

        setHudState((prev) => {
          if (
            prev.x === roundedX &&
            prev.z === roundedZ &&
            prev.isMoving === moving &&
            prev.movementState === mState &&
            prev.movementMode === mMode
          ) {
            return prev;
          }
          return {
            x: roundedX,
            z: roundedZ,
            isMoving: moving,
            movementState: mState,
            movementMode: mMode,
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
      coffeeShop.dispose();
      coffeeShopRef.current = null;
      busStop.dispose();
      busStopRef.current = null;
      taxiStand.dispose();
      taxiStandRef.current = null;
      barberShop.dispose();
      barberShopRef.current = null;
      destinationIndicator.dispose();
      cursorAimIndicator.dispose();
      trafficSystem.dispose();
      sunlightSystem.dispose();

      scene.clear();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      cameraControllerRef.current = null;
    };
  }, [mapData, initX, initZ, targetCountry.code]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-slate-900 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* District Places Directory — Left Side */}
      <MapPlacesDirectory
        playerPosition={{ x: hudState.x, z: hudState.z }}
        onNavigateToPlace={handleNavigateToPlace}
      />

      {/* NPC Interaction Prompt — appears when player is in range */}
      <InteractionPrompt
        isVisible={conversationInRange}
        npcName={activeScenario.npcName}
        interactKey="E"
      />

      {/* Top Header Overlay */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#FAF9F5] border-[3px] border-black shadow-[4px_4px_0px_#000] px-3.5 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00D084] border border-black animate-pulse" />
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-tight text-black flex items-center gap-1.5">
              <span>{targetCountry.flag}</span>
              <span>{targetCountry.country} ({targetCountry.language})</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-black/60 uppercase">
              Scaffolding: {learnerLang.name} · {hudState.plotsCount} Plots
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Camera Zoom Control Buttons */}
          <div className="flex items-center bg-[#FAF9F5] border-[3px] border-black shadow-[4px_4px_0px_#000] p-1 gap-1">
            <button
              onClick={() => handleZoom(-3)}
              title="Zoom Camera In (Mouse Wheel Up)"
              aria-label="Zoom Camera In"
              className="w-7 h-7 flex items-center justify-center font-black text-xs bg-[#FFB800] hover:bg-[#ffc633] text-black border border-black transition-colors cursor-pointer shadow-[1px_1px_0px_#000]"
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Camera Zoom"
              aria-label="Reset Camera Zoom"
              className="px-2 h-7 flex items-center justify-center font-mono font-black text-[10px] bg-white hover:bg-black hover:text-white border border-black transition-colors cursor-pointer shadow-[1px_1px_0px_#000]"
            >
              RESET
            </button>
            <button
              onClick={() => handleZoom(3)}
              title="Zoom Camera Out (Mouse Wheel Down)"
              aria-label="Zoom Camera Out"
              className="w-7 h-7 flex items-center justify-center font-black text-xs bg-[#FFB800] hover:bg-[#ffc633] text-black border border-black transition-colors cursor-pointer shadow-[1px_1px_0px_#000]"
            >
              −
            </button>
          </div>

          {onBackToOnboarding && (
            <button
              onClick={onBackToOnboarding}
              className="px-3 py-2 bg-white hover:bg-black hover:text-white border-[3px] border-black text-black text-xs font-mono font-black uppercase tracking-wider transition-colors cursor-pointer shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              ← Onboarding
            </button>
          )}
        </div>
      </header>

      {/* Floating Instructions & Coordinates HUD (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-20 flex flex-col gap-1.5 max-w-[280px] sm:max-w-xs select-none">
        <div className="pointer-events-auto bg-[#FAF9F5] border-[3px] border-black shadow-[4px_4px_0px_#000] p-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase bg-[#FFB800] border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                {hudState.movementMode}
              </span>
              <span className="text-[10px] font-mono font-bold text-black/70">
                ({hudState.x}, {hudState.z})
              </span>
            </div>
            <button
              onClick={() => setShowControls(!showControls)}
              className="px-2 py-0.5 bg-white hover:bg-black hover:text-white border border-black text-[9px] font-mono font-black uppercase transition-colors cursor-pointer shadow-[1px_1px_0px_#000]"
            >
              {showControls ? "HIDE KEYS" : "SHOW KEYS"}
            </button>
          </div>

          {showControls && (
            <div className="pt-1.5 border-t-2 border-black/10 flex flex-col gap-1 text-[11px] font-mono text-black/80">
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div><strong className="text-black font-black">W / ▲:</strong> Forward</div>
                <div><strong className="text-black font-black">S / ▼:</strong> Backward</div>
                <div><strong className="text-black font-black">A / ◄:</strong> Left</div>
                <div><strong className="text-black font-black">D / ►:</strong> Right</div>
              </div>
              <div className="text-[10px] text-black/70 font-sans pt-1 border-t border-black/10">
                <strong className="font-bold text-black">Right Mouse:</strong> Aim & Orbit · <strong className="font-bold text-black">Click:</strong> Walk
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GTA V Style Circular Minimap HUD (Bottom-Right) */}
      <MinimapHUD
        mapData={mapData}
        playerStateRef={playerStateRef}
        initialScale={1.0}
        countryCode={targetCountry.code}
      />
    </div>

  );
}
