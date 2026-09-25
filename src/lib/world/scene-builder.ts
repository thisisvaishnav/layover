import * as THREE from "three";
import { Position3D } from "./types";
import { computeAvatarKinematics } from "./avatar-kinematics";
import {
  UNIFIED_PLAZA_BOUNDS,
  UNIFIED_PLAZA_HOTSPOTS,
  getSpawnPositionForZone,
} from "./unified-plaza";

export interface CafeSceneHooks {
  onHotspotClick?: (hotspotId: string) => void;
}

export class Cafe3DScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  // Key entities
  public playerMesh: THREE.Group;
  public mateoMesh!: THREE.Group;
  private mateoHead!: THREE.Mesh;
  public srinivasMesh!: THREE.Group;
  private srinivasHead!: THREE.Mesh;
  public elenaMesh!: THREE.Group;
  private elenaHead!: THREE.Mesh;

  // Articulated limbs for player
  private leftLegPivot!: THREE.Group;
  private rightLegPivot!: THREE.Group;
  private leftArmPivot!: THREE.Group;
  private rightArmPivot!: THREE.Group;

  private hotspotMarkers: Map<string, THREE.Group> = new Map();
  private steamParticles: THREE.Points | null = null;

  // Animation & Camera state
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private targetPlayerPos: Position3D = { x: 0, y: 0, z: 2 };
  private playerRotation: number = 0;
  private isPlayerWalking: boolean = false;
  private isMateoTalking: boolean = false;
  private isBaristaBrewing: boolean = false;

  constructor(canvas: HTMLCanvasElement, public placeType: string = "cafe") {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111827); // Dark twilight plaza sky
    this.scene.fog = new THREE.FogExp2(0x111827, 0.02);

    // 2. Camera (Third-person isometric angle across wide plaza)
    const aspect = canvas.clientWidth / canvas.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 120);

    const initialSpawn = getSpawnPositionForZone(placeType);
    this.targetPlayerPos = { ...initialSpawn };
    this.camera.position.set(initialSpawn.x * 0.75, 8.2, initialSpawn.z * 0.5 + 9.5);
    this.camera.lookAt(initialSpawn.x * 0.65, 1.2, initialSpawn.z * 0.3);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Build Environment
    this.setupPlazaLighting();
    this.buildUnifiedPlazaArchitecture();
    this.buildCafeZone();
    this.buildBusStopZone();
    this.buildAirportZone();
    this.buildHotspotMarkers();

    // 5. Build Characters
    this.mateoMesh = this.buildMateoCharacter();
    this.mateoMesh.position.set(-14.0, 0, -3.2);
    this.scene.add(this.mateoMesh);

    this.srinivasMesh = this.buildSrinivasCharacter();
    this.srinivasMesh.position.set(0.0, 0, -3.2);
    this.scene.add(this.srinivasMesh);

    this.elenaMesh = this.buildElenaCharacter();
    this.elenaMesh.position.set(14.0, 0, -3.2);
    this.scene.add(this.elenaMesh);

    this.playerMesh = this.buildPlayerAvatar();
    this.playerMesh.position.set(initialSpawn.x, 0, initialSpawn.z);
    this.scene.add(this.playerMesh);

    // 6. Handle Resize
    window.addEventListener("resize", this.handleResize);

    // 7. Start Render Loop
    this.animate();
  }

  private setupPlazaLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    this.scene.add(ambientLight);

    // Sun / Moonlight angle
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(10, 16, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -28;
    sunLight.shadow.camera.right = 28;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    this.scene.add(sunLight);

    // Zone 1: Café warm amber lantern
    const cafeLight = new THREE.PointLight(0xf59e0b, 1.8, 14);
    cafeLight.position.set(-14, 4.0, -2.5);
    this.scene.add(cafeLight);

    // Zone 2: Bus Stop streetlamp
    const streetLight = new THREE.PointLight(0xfef08a, 1.6, 12);
    streetLight.position.set(0, 4.5, -2.0);
    this.scene.add(streetLight);

    // Zone 3: Airport Gate neon blue spotlight
    const airportLight = new THREE.PointLight(0x38bdf8, 1.9, 14);
    airportLight.position.set(14, 4.0, -2.5);
    this.scene.add(airportLight);
  }

  private buildUnifiedPlazaArchitecture() {
    const width = UNIFIED_PLAZA_BOUNDS.maxX - UNIFIED_PLAZA_BOUNDS.minX; // 48
    const depth = UNIFIED_PLAZA_BOUNDS.maxZ - UNIFIED_PLAZA_BOUNDS.minZ; // 24

    // 1. Master Plaza Floor
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Zone Floors
    // West: Café terracotta tiles
    const cafeTileGeo = new THREE.PlaneGeometry(16, depth - 2);
    const cafeTileMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.5,
    });
    const cafeFloor = new THREE.Mesh(cafeTileGeo, cafeTileMat);
    cafeFloor.rotation.x = -Math.PI / 2;
    cafeFloor.position.set(-15, 0.01, 0);
    cafeFloor.receiveShadow = true;
    this.scene.add(cafeFloor);

    // East: Airport terminal polished slate
    const airportSlateGeo = new THREE.PlaneGeometry(16, depth - 2);
    const airportSlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.2,
    });
    const airportFloor = new THREE.Mesh(airportSlateGeo, airportSlateMat);
    airportFloor.rotation.x = -Math.PI / 2;
    airportFloor.position.set(15, 0.01, 0);
    airportFloor.receiveShadow = true;
    this.scene.add(airportFloor);

    // Center: Sidewalk pavement & road marking for Bus Stop
    const streetGeo = new THREE.PlaneGeometry(14, 6);
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.015, 5);
    street.receiveShadow = true;
    this.scene.add(street);

    // Yellow curb line
    const curbGeo = new THREE.BoxGeometry(14, 0.1, 0.25);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.05, 1.9);
    this.scene.add(curb);

    // 3. Perimeter Back Wall
    const backWallGeo = new THREE.BoxGeometry(width, 5.0, 0.4);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 2.5, UNIFIED_PLAZA_BOUNDS.minZ);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Back wall trims
    const trimGeo = new THREE.BoxGeometry(width, 0.2, 0.5);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 5.0, UNIFIED_PLAZA_BOUNDS.minZ);
    this.scene.add(trim);
  }

  private buildCafeZone() {
    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(-14, 0, 0);

    // Barista Counter Base
    const counterGeo = new THREE.BoxGeometry(5.4, 1.1, 1.4);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.55, -2.75);
    counter.castShadow = true;
    counter.receiveShadow = true;
    cafeGroup.add(counter);

    // Marble Top
    const topGeo = new THREE.BoxGeometry(5.6, 0.1, 1.55);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.15, -2.75);
    top.castShadow = true;
    cafeGroup.add(top);

    // Espresso Machine
    const machineGeo = new THREE.BoxGeometry(1.4, 0.8, 0.7);
    const machineMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
    const machine = new THREE.Mesh(machineGeo, machineMat);
    machine.position.set(-1.0, 1.6, -2.75);
    machine.castShadow = true;
    cafeGroup.add(machine);

    // Pastry Glass Case
    const caseGeo = new THREE.BoxGeometry(1.6, 0.65, 0.9);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    });
    const pastryCase = new THREE.Mesh(caseGeo, caseMat);
    pastryCase.position.set(1.4, 1.52, -2.75);
    cafeGroup.add(pastryCase);

    // Croissants inside
    for (let i = -1; i <= 1; i++) {
      const cGeo = new THREE.TorusGeometry(0.1, 0.04, 8, 12, Math.PI);
      const cMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const croissant = new THREE.Mesh(cGeo, cMat);
      croissant.rotation.x = Math.PI / 2;
      croissant.position.set(1.4 + i * 0.35, 1.25, -2.75);
      cafeGroup.add(croissant);
    }

    // Bistro Tables
    [-3.5, 3.2].forEach((tx) => {
      const tableGroup = new THREE.Group();
      tableGroup.position.set(tx, 0, 1.5);

      const tableTopGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.06, 24);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
      const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
      tableTop.position.y = 0.85;
      tableTop.castShadow = true;
      tableGroup.add(tableTop);

      const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 0.42;
      tableGroup.add(leg);

      cafeGroup.add(tableGroup);
    });

    // Signboard
    const signGeo = new THREE.BoxGeometry(3.5, 0.8, 0.1);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.6, -4.5);
    cafeGroup.add(sign);

    this.scene.add(cafeGroup);
  }

  private buildBusStopZone() {
    const busGroup = new THREE.Group();
    busGroup.position.set(0, 0, 0);

    // Bus Shelter Frame (Steel Pillars)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    [
      [-2.4, -4.0],
      [2.4, -4.0],
      [-2.4, -2.2],
      [2.4, -2.2],
    ].forEach(([px, pz]) => {
      const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.0, 12);
      const pillar = new THREE.Mesh(pillarGeo, steelMat);
      pillar.position.set(px, 1.5, pz);
      pillar.castShadow = true;
      busGroup.add(pillar);
    });

    // Glass Back Panel
    const glassGeo = new THREE.BoxGeometry(4.8, 2.6, 0.06);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.4, -4.0);
    busGroup.add(glass);

    // Yellow Canopy Roof
    const roofGeo = new THREE.BoxGeometry(5.4, 0.15, 2.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.0, -3.1);
    roof.castShadow = true;
    busGroup.add(roof);

    // Wooden Waiting Bench
    const benchGeo = new THREE.BoxGeometry(3.6, 0.08, 0.6);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.48, -3.5);
    bench.castShadow = true;
    busGroup.add(bench);

    // Bus Route Totem Signboard ("BUS 42")
    const signPostGeo = new THREE.BoxGeometry(0.4, 2.8, 0.1);
    const signPostMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const signPost = new THREE.Mesh(signPostGeo, signPostMat);
    signPost.position.set(3.4, 1.4, -2.8);
    signPost.castShadow = true;
    busGroup.add(signPost);

    const signBoardGeo = new THREE.BoxGeometry(0.9, 0.7, 0.12);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signBoard.position.set(3.4, 2.5, -2.8);
    busGroup.add(signBoard);

    this.scene.add(busGroup);
  }

  private buildAirportZone() {
    const airportGroup = new THREE.Group();
    airportGroup.position.set(14, 0, 0);

    // Check-in Gate Podium Desk
    const deskGeo = new THREE.BoxGeometry(5.2, 1.1, 1.4);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.55, -2.75);
    desk.castShadow = true;
    desk.receiveShadow = true;
    airportGroup.add(desk);

    // Brushed Aluminum Counter Top
    const topGeo = new THREE.BoxGeometry(5.4, 0.1, 1.55);
    const topMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 1.15, -2.75);
    airportGroup.add(top);

    // Flight Departures LED Board
    const ledBoardGeo = new THREE.BoxGeometry(4.2, 1.6, 0.2);
    const ledBoardMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const ledBoard = new THREE.Mesh(ledBoardGeo, ledBoardMat);
    ledBoard.position.set(0, 3.5, -4.5);
    airportGroup.add(ledBoard);

    // Baggage Weigh Scale
    const scaleGeo = new THREE.BoxGeometry(2.0, 0.2, 1.2);
    const scaleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const scale = new THREE.Mesh(scaleGeo, scaleMat);
    scale.position.set(-2.8, 0.1, -2.75);
    scale.receiveShadow = true;
    airportGroup.add(scale);

    // Suitcases on scale
    const suitGeo1 = new THREE.BoxGeometry(0.8, 0.55, 0.35);
    const suitMat1 = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const suit1 = new THREE.Mesh(suitGeo1, suitMat1);
    suit1.position.set(-2.8, 0.45, -2.75);
    suit1.castShadow = true;
    airportGroup.add(suit1);

    // Terminal Waiting Seats
    [-1.5, 2.0].forEach((sx) => {
      const chairGeo = new THREE.BoxGeometry(1.2, 0.5, 0.6);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
      const chair = new THREE.Mesh(chairGeo, chairMat);
      chair.position.set(sx, 0.4, 1.8);
      chair.castShadow = true;
      airportGroup.add(chair);
    });

    this.scene.add(airportGroup);
  }

  private buildMateoCharacter(): THREE.Group {
    const npc = new THREE.Group();

    // Torso (Green Barista apron)
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.75, 16);
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.7 });
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    npc.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
    this.mateoHead = new THREE.Mesh(headGeo, skinMat);
    this.mateoHead.position.y = 1.95;
    this.mateoHead.castShadow = true;
    npc.add(this.mateoHead);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.98;
    npc.add(hair);

    return npc;
  }

  private buildSrinivasCharacter(): THREE.Group {
    const npc = new THREE.Group();

    // Torso (Blue Transit Conductor shirt)
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.75, 16);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    npc.add(torso);

    // Badge
    const badgeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.12, 1.35, 0.3);
    npc.add(badge);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    this.srinivasHead = new THREE.Mesh(headGeo, skinMat);
    this.srinivasHead.position.y = 1.95;
    this.srinivasHead.castShadow = true;
    npc.add(this.srinivasHead);

    // Conductor Cap
    const capGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.15, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.12;
    npc.add(cap);

    return npc;
  }

  private buildElenaCharacter(): THREE.Group {
    const npc = new THREE.Group();

    // Torso (Navy Airline Blazer)
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.75, 16);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    npc.add(torso);

    // Scarf / Lanyard
    const scarfGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 1.5, 0.1);
    npc.add(scarf);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
    this.elenaHead = new THREE.Mesh(headGeo, skinMat);
    this.elenaHead.position.y = 1.95;
    this.elenaHead.castShadow = true;
    npc.add(this.elenaHead);

    // Hair Bun
    const hairGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 2.05, -0.08);
    npc.add(hair);

    return npc;
  }

  private buildPlayerAvatar(): THREE.Group {
    const player = new THREE.Group();
    player.position.set(0, 0, 2.0);

    // Materials
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.6 });

    // Torso (Navy traveler jacket)
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.75, 16);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    player.add(torso);

    // Backpack (Amber leather)
    const packGeo = new THREE.BoxGeometry(0.35, 0.45, 0.22);
    const packMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 1.0, 0.24);
    pack.castShadow = true;
    player.add(pack);

    // --- ARTICULATED LEGS & FEET ---
    // Left Leg (hip pivot at y = 0.6)
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.6, 0);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.55, 12);
    const leftLegMesh = new THREE.Mesh(legGeo, jeansMat);
    leftLegMesh.position.y = -0.25;
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    const shoeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.24);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.5, 0.04);
    leftShoe.castShadow = true;
    this.leftLegPivot.add(leftShoe);
    player.add(this.leftLegPivot);

    // Right Leg (hip pivot at y = 0.6)
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.6, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, jeansMat);
    rightLegMesh.position.y = -0.25;
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.5, 0.04);
    rightShoe.castShadow = true;
    this.rightLegPivot.add(rightShoe);
    player.add(this.rightLegPivot);

    // --- ARTICULATED ARMS & HANDS ---
    // Left Arm (shoulder pivot at y = 1.25)
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 1.25, 0);
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
    const leftArmMesh = new THREE.Mesh(armGeo, sleeveMat);
    leftArmMesh.position.y = -0.2;
    leftArmMesh.castShadow = true;
    this.leftArmPivot.add(leftArmMesh);

    const handGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.42;
    leftHand.castShadow = true;
    this.leftArmPivot.add(leftHand);
    player.add(this.leftArmPivot);

    // Right Arm (shoulder pivot at y = 1.25)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 1.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, sleeveMat);
    rightArmMesh.position.y = -0.2;
    rightArmMesh.castShadow = true;
    this.rightArmPivot.add(rightArmMesh);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.42;
    rightHand.castShadow = true;
    this.rightArmPivot.add(rightHand);
    player.add(this.rightArmPivot);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    player.add(head);

    // Cap / Beanie
    const capGeo = new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.62;
    player.add(cap);

    return player;
  }

  private buildHotspotMarkers() {
    UNIFIED_PLAZA_HOTSPOTS.forEach((spot) => {
      const group = new THREE.Group();
      group.position.set(spot.position.x, 0.05, spot.position.z);

      const isMainNpc =
        spot.id.includes("mateo") ||
        spot.id.includes("conductor") ||
        spot.id.includes("agent");

      // Glowing Ground Ring
      const ringGeo = new THREE.RingGeometry(
        spot.interactionRadius - 0.1,
        spot.interactionRadius,
        32
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: isMainNpc ? 0xf59e0b : 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // Floating diamond icon marker
      const diamondGeo = new THREE.OctahedronGeometry(0.18);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: isMainNpc ? 0xf59e0b : 0x34d399,
        emissive: isMainNpc ? 0xb45309 : 0x059669,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 1.8;
      group.add(diamond);

      this.scene.add(group);
      this.hotspotMarkers.set(spot.id, group);
    });
  }

  public updatePlayerPosition(pos: Position3D, isWalking: boolean, dx: number, dz: number) {
    this.targetPlayerPos = pos;
    this.isPlayerWalking = isWalking;

    if (dx !== 0 || dz !== 0) {
      this.playerRotation = Math.atan2(dx, dz);
    }
  }

  public setMateoTalking(talking: boolean) {
    this.isMateoTalking = talking;
  }

  public setBaristaBrewing(brewing: boolean) {
    this.isBaristaBrewing = brewing;
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();

    // 1. Smoothly interpolate player mesh to target position
    this.playerMesh.position.x = THREE.MathUtils.lerp(
      this.playerMesh.position.x,
      this.targetPlayerPos.x,
      0.25
    );
    this.playerMesh.position.z = THREE.MathUtils.lerp(
      this.playerMesh.position.z,
      this.targetPlayerPos.z,
      0.25
    );

    // Smooth rotation
    this.playerMesh.rotation.y = THREE.MathUtils.lerp(
      this.playerMesh.rotation.y,
      this.playerRotation,
      0.2
    );

    // 2. Kinematic limb animations (swings legs & arms in opposition + stride bob)
    const kin = computeAvatarKinematics(this.isPlayerWalking, elapsed, 4.0);
    if (this.leftLegPivot) this.leftLegPivot.rotation.x = kin.leftLegRotX;
    if (this.rightLegPivot) this.rightLegPivot.rotation.x = kin.rightLegRotX;
    if (this.leftArmPivot) this.leftArmPivot.rotation.x = kin.leftArmRotX;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = kin.rightArmRotX;
    this.playerMesh.position.y = kin.bounceY;

    // 3. Smooth Dynamic Camera Follow across whole 48m plaza
    const targetCamX = this.playerMesh.position.x * 0.75;
    const targetCamZ = this.playerMesh.position.z * 0.5 + 9.5;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.05);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 0.05);
    this.camera.lookAt(
      this.playerMesh.position.x * 0.65,
      1.2,
      this.playerMesh.position.z * 0.3
    );

    // 4. NPC Look-At Behaviors
    const npcs = [
      { mesh: this.mateoMesh, head: this.mateoHead },
      { mesh: this.srinivasMesh, head: this.srinivasHead },
      { mesh: this.elenaMesh, head: this.elenaHead },
    ];

    npcs.forEach(({ mesh, head }) => {
      if (!mesh || !head) return;
      const dist = mesh.position.distanceTo(this.playerMesh.position);
      if (dist < 7.0) {
        const angle = Math.atan2(
          this.playerMesh.position.x - mesh.position.x,
          this.playerMesh.position.z - mesh.position.z
        );
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, angle, 0.05);
      }
      head.position.y = 1.95 + Math.sin(elapsed * 2.5) * 0.015;
    });

    // 5. Hotspot diamond rotation & pulse
    this.hotspotMarkers.forEach((marker) => {
      const diamond = marker.children[1];
      if (diamond) {
        diamond.rotation.y = elapsed * 1.5;
        diamond.position.y = 1.8 + Math.sin(elapsed * 3) * 0.08;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = () => {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener("resize", this.handleResize);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
