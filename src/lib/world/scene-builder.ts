import * as THREE from "three";
import { Position3D } from "./types";
import { CAFE_BOUNDS, MADRID_CAFE_HOTSPOTS } from "./hotspots";

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
  public mateoMesh: THREE.Group;
  private mateoHead!: THREE.Mesh;
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1c1917); // stone-900 warm dark
    this.scene.fog = new THREE.FogExp2(0x1c1917, 0.035);

    // 2. Camera (Third-person isometric angle)
    const aspect = canvas.clientWidth / canvas.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 7.5, 9.5);
    this.camera.lookAt(0, 1.2, 0);

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
    this.setupLighting();
    this.buildCafeArchitecture();
    this.buildBaristaCounter();
    this.buildPastryCase();
    this.buildTablesAndFurniture();
    this.buildBlackboardMenu();
    this.buildHotspotMarkers();

    // 5. Build Characters
    this.mateoMesh = this.buildMateoCharacter();
    this.scene.add(this.mateoMesh);

    this.playerMesh = this.buildPlayerAvatar();
    this.scene.add(this.playerMesh);

    // 6. Handle Resize
    window.addEventListener("resize", this.handleResize);

    // 7. Start Render Loop
    this.animate();
  }

  private setupLighting() {
    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xfef3c7, 0.85);
    this.scene.add(ambientLight);

    // Warm main sunlight from the front window
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    sunLight.position.set(5, 9, 7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    sunLight.shadow.bias = -0.001;
    this.scene.add(sunLight);

    // Warm pendant lights above the counter
    const counterPendant = new THREE.PointLight(0xfbbf24, 1.5, 7);
    counterPendant.position.set(0, 3.2, -2.5);
    this.scene.add(counterPendant);

    // Spotlight on the pastry vitrine
    const pastrySpot = new THREE.SpotLight(0xfde68a, 2.0, 6, Math.PI / 4, 0.3);
    pastrySpot.position.set(3.6, 3.5, -1.5);
    pastrySpot.target.position.set(3.6, 0.8, -2.2);
    this.scene.add(pastrySpot);
    this.scene.add(pastrySpot.target);
  }

  private buildCafeArchitecture() {
    // Floor: Terracotta checkered pattern canvas
    const floorGeo = new THREE.PlaneGeometry(
      CAFE_BOUNDS.maxX - CAFE_BOUNDS.minX,
      CAFE_BOUNDS.maxZ - CAFE_BOUNDS.minZ
    );

    // Generate procedural terracotta tile texture
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const ctx = tileCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#9a3412"; // Terracotta rust
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#c2410c";
      ctx.fillRect(4, 4, 120, 120);
      ctx.fillRect(132, 132, 120, 120);
      ctx.fillStyle = "#7c2d12"; // Grout lines
      ctx.fillRect(0, 124, 256, 8);
      ctx.fillRect(124, 0, 8, 256);
    }
    const floorTexture = new THREE.CanvasTexture(tileCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 5);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.6,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Back Wall
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfaf5ef,
      roughness: 0.9,
    });
    const woodTrimMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.5,
    });

    const backWallGeo = new THREE.BoxGeometry(12, 4.5, 0.3);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 2.25, CAFE_BOUNDS.minZ);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Wood Wainscoting on back wall
    const wainscotGeo = new THREE.BoxGeometry(12, 1.4, 0.35);
    const wainscot = new THREE.Mesh(wainscotGeo, woodTrimMat);
    wainscot.position.set(0, 0.7, CAFE_BOUNDS.minZ);
    wainscot.receiveShadow = true;
    this.scene.add(wainscot);

    // Left Wall with Arch
    const sideWallGeo = new THREE.BoxGeometry(0.3, 4.5, 10);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(CAFE_BOUNDS.minX, 2.25, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right Wall (Storefront Window)
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(CAFE_BOUNDS.maxX, 2.25, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
  }

  private buildBaristaCounter() {
    const counterGroup = new THREE.Group();

    // Dark oak wood counter base
    const baseGeo = new THREE.BoxGeometry(5.6, 1.1, 1.4);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.4,
      metalness: 0.1,
    });
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.set(0, 0.55, -2.75);
    base.castShadow = true;
    base.receiveShadow = true;
    counterGroup.add(base);

    // Polished marble counter-top
    const topGeo = new THREE.BoxGeometry(5.9, 0.12, 1.6);
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf5ebe0,
      roughness: 0.2,
      metalness: 0.15,
    });
    const top = new THREE.Mesh(topGeo, marbleMat);
    top.position.set(0, 1.15, -2.75);
    top.castShadow = true;
    top.receiveShadow = true;
    counterGroup.add(top);

    // Brass Footrail
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.6, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
    });
    const rail = new THREE.Mesh(railGeo, brassMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0.2, -1.9);
    counterGroup.add(rail);

    // Espresso Machine (La Marzocco Style)
    const machineGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.7, 0.65);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
    });
    const machineBody = new THREE.Mesh(bodyGeo, chromeMat);
    machineBody.position.set(-0.8, 1.55, -2.8);
    machineBody.castShadow = true;
    machineGroup.add(machineBody);

    // Red accent panel on back of espresso machine
    const panelGeo = new THREE.BoxGeometry(1.1, 0.4, 0.05);
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.3,
    });
    const panel = new THREE.Mesh(panelGeo, redMat);
    panel.position.set(-0.8, 1.55, -2.48);
    machineGroup.add(panel);

    // Stack of ceramic coffee cups on top
    for (let i = 0; i < 6; i++) {
      const cupGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.08, 12);
      const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(-1.2 + (i % 3) * 0.18, 1.95, -2.9 + Math.floor(i / 3) * 0.18);
      machineGroup.add(cup);
    }
    counterGroup.add(machineGroup);

    // Cash Register & Card Terminal
    const registerGroup = new THREE.Group();
    const regGeo = new THREE.BoxGeometry(0.5, 0.35, 0.45);
    const regMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
    });
    const reg = new THREE.Mesh(regGeo, regMat);
    reg.position.set(-2.0, 1.35, -2.6);
    reg.castShadow = true;
    registerGroup.add(reg);

    // POS Screen
    const screenGeo = new THREE.BoxGeometry(0.3, 0.22, 0.03);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-2.0, 1.55, -2.45);
    screen.rotation.x = -Math.PI / 8;
    registerGroup.add(screen);
    counterGroup.add(registerGroup);

    this.scene.add(counterGroup);
  }

  private buildPastryCase() {
    const pastryGroup = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(2.0, 1.1, 1.3);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.set(3.8, 0.55, -2.8);
    base.castShadow = true;
    pastryGroup.add(base);

    // Glass case
    const glassGeo = new THREE.BoxGeometry(1.9, 0.7, 1.2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      ior: 1.5,
    });
    const glassCase = new THREE.Mesh(glassGeo, glassMat);
    glassCase.position.set(3.8, 1.5, -2.8);
    pastryGroup.add(glassCase);

    // Pastries inside: Croissants & Napolitanas
    const pastryMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Golden pastry brown
      roughness: 0.7,
    });

    for (let i = 0; i < 3; i++) {
      // Croissants (torus or curved box)
      const croissantGeo = new THREE.TorusGeometry(0.1, 0.04, 8, 12, Math.PI);
      const croissant = new THREE.Mesh(croissantGeo, pastryMat);
      croissant.rotation.x = Math.PI / 2;
      croissant.position.set(3.2 + i * 0.35, 1.25, -2.8);
      pastryGroup.add(croissant);

      // Napolitanas (cuboids with chocolate stripe)
      const napolitanaGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15);
      const napolitana = new THREE.Mesh(napolitanaGeo, pastryMat);
      napolitana.position.set(3.2 + i * 0.35, 1.25, -2.5);
      pastryGroup.add(napolitana);
    }

    this.scene.add(pastryGroup);
  }

  private buildTablesAndFurniture() {
    const furnitureGroup = new THREE.Group();

    // Table 1 (near left window) & Table 2 (center right)
    const tablePositions = [
      { x: -3.8, z: 1.2 },
      { x: 3.6, z: 1.8 },
    ];

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const woodChairMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

    tablePositions.forEach((pos) => {
      // Round Table top
      const tableGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.06, 24);
      const table = new THREE.Mesh(tableGeo, marbleMat);
      table.position.set(pos.x, 0.9, pos.z);
      table.castShadow = true;
      table.receiveShadow = true;
      furnitureGroup.add(table);

      // Table leg & base
      const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12);
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(pos.x, 0.45, pos.z);
      leg.castShadow = true;
      furnitureGroup.add(leg);

      const tableBaseGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16);
      const tableBase = new THREE.Mesh(tableBaseGeo, metalMat);
      tableBase.position.set(pos.x, 0.02, pos.z);
      furnitureGroup.add(tableBase);

      // Napkin holder / Sugar dispenser on table
      const sugarGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12);
      const sugar = new THREE.Mesh(sugarGeo, metalMat);
      sugar.position.set(pos.x + 0.15, 0.98, pos.z);
      furnitureGroup.add(sugar);

      // 2 Bistro Chairs per table
      const chairAngles = [0, Math.PI];
      chairAngles.forEach((angle) => {
        const chairX = pos.x + Math.sin(angle) * 1.0;
        const chairZ = pos.z + Math.cos(angle) * 1.0;

        const seatGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16);
        const seat = new THREE.Mesh(seatGeo, woodChairMat);
        seat.position.set(chairX, 0.52, chairZ);
        furnitureGroup.add(seat);

        // Chair legs
        const chairLegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8);
        const chairLeg = new THREE.Mesh(chairLegGeo, metalMat);
        chairLeg.position.set(chairX, 0.26, chairZ);
        furnitureGroup.add(chairLeg);

        // Chair Backrest
        const backrestGeo = new THREE.BoxGeometry(0.4, 0.35, 0.04);
        const backrest = new THREE.Mesh(backrestGeo, woodChairMat);
        backrest.position.set(chairX + Math.sin(angle) * 0.18, 0.85, chairZ + Math.cos(angle) * 0.18);
        furnitureGroup.add(backrest);
      });
    });

    this.scene.add(furnitureGroup);
  }

  private buildBlackboardMenu() {
    const boardGroup = new THREE.Group();

    // Wooden Frame
    const frameGeo = new THREE.BoxGeometry(1.8, 1.4, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-3.8, 2.5, CAFE_BOUNDS.minZ + 0.2);
    boardGroup.add(frame);

    // Chalkboard surface
    const slateGeo = new THREE.PlaneGeometry(1.6, 1.2);
    const slateCanvas = document.createElement("canvas");
    slateCanvas.width = 512;
    slateCanvas.height = 384;
    const ctx = slateCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b"; // Slate black
      ctx.fillRect(0, 0, 512, 384);

      ctx.fillStyle = "#fef08a"; // Chalk yellow
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("☕ CAFÉ DE LA LUNA", 256, 45);

      ctx.fillStyle = "#ffffff"; // Chalk white
      ctx.font = "20px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Café Solo ........ 1.40 €", 60, 110);
      ctx.fillText("Café Cortado .... 1.50 €", 60, 160);
      ctx.fillText("Café con Leche .. 1.60 €", 60, 210);
      ctx.fillText("Manchado ........ 1.60 €", 60, 260);
      ctx.fillText("Churros (4 uds) . 2.20 €", 60, 310);
    }

    const slateTexture = new THREE.CanvasTexture(slateCanvas);
    const slateMat = new THREE.MeshStandardMaterial({ map: slateTexture, roughness: 0.9 });
    const slate = new THREE.Mesh(slateGeo, slateMat);
    slate.position.set(-3.8, 2.5, CAFE_BOUNDS.minZ + 0.25);
    boardGroup.add(slate);

    this.scene.add(boardGroup);
  }

  private buildMateoCharacter(): THREE.Group {
    const mateo = new THREE.Group();
    mateo.position.set(0, 0, -3.4); // Behind counter

    // Torso (White shirt)
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.8, 16);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    mateo.add(torso);

    // Green Barista Apron
    const apronGeo = new THREE.CylinderGeometry(0.33, 0.3, 0.65, 16);
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.7 });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.y = 1.25;
    mateo.add(apron);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
    this.mateoHead = new THREE.Mesh(headGeo, skinMat);
    this.mateoHead.position.y = 1.95;
    this.mateoHead.castShadow = true;
    mateo.add(this.mateoHead);

    // Mateo's Hair (Dark brown)
    const hairGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.98;
    mateo.add(hair);

    return mateo;
  }

  private buildPlayerAvatar(): THREE.Group {
    const player = new THREE.Group();
    player.position.set(0, 0, 2.0);

    // Torso (Navy traveler jacket)
    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.75, 16);
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
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

    // Legs (Jeans)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 12);
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const leftLeg = new THREE.Mesh(legGeo, jeansMat);
    leftLeg.position.set(-0.15, 0.3, 0);
    player.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, jeansMat);
    rightLeg.position.set(0.15, 0.3, 0);
    player.add(rightLeg);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    player.add(head);

    return player;
  }

  private buildHotspotMarkers() {
    MADRID_CAFE_HOTSPOTS.forEach((spot) => {
      const group = new THREE.Group();
      group.position.set(spot.position.x, 0.05, spot.position.z);

      // Glowing Ground Ring
      const ringGeo = new THREE.RingGeometry(spot.interactionRadius - 0.1, spot.interactionRadius, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.id === "barista_mateo" ? 0xf59e0b : 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // Floating diamond icon marker
      const diamondGeo = new THREE.OctahedronGeometry(0.18);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: spot.id === "barista_mateo" ? 0xf59e0b : 0x34d399,
        emissive: spot.id === "barista_mateo" ? 0xb45309 : 0x059669,
        emissiveIntensity: 0.6,
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
      // Calculate rotation angle in radians
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

    // 1. Smoothly interpolate player mesh to position
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

    // Smoothly rotate player toward movement direction
    this.playerMesh.rotation.y = THREE.MathUtils.lerp(
      this.playerMesh.rotation.y,
      this.playerRotation,
      0.2
    );

    // Walking bounce animation
    if (this.isPlayerWalking) {
      this.playerMesh.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.08;
    } else {
      this.playerMesh.position.y = 0;
    }

    // 2. Camera Smooth Follow (Isometric overhead view)
    const targetCamX = this.playerMesh.position.x * 0.4;
    const targetCamZ = this.playerMesh.position.z * 0.5 + 8.5;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.05);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 0.05);
    this.camera.lookAt(this.playerMesh.position.x * 0.3, 1.2, this.playerMesh.position.z * 0.3);

    // 3. Mateo Animations
    if (this.mateoMesh && this.mateoHead) {
      // Look towards player
      const angleToPlayer = Math.atan2(
        this.playerMesh.position.x - this.mateoMesh.position.x,
        this.playerMesh.position.z - this.mateoMesh.position.z
      );
      this.mateoMesh.rotation.y = THREE.MathUtils.lerp(
        this.mateoMesh.rotation.y,
        angleToPlayer,
        0.05
      );

      // Speaking or brewing animation
      if (this.isMateoTalking) {
        this.mateoHead.position.y = 1.95 + Math.sin(elapsed * 10) * 0.04;
      } else if (this.isBaristaBrewing) {
        this.mateoMesh.rotation.y = -Math.PI / 2 + Math.sin(elapsed * 4) * 0.2; // turn to machine
        this.mateoHead.position.y = 1.95 + Math.sin(elapsed * 6) * 0.02;
      } else {
        // Idle breathing
        this.mateoHead.position.y = 1.95 + Math.sin(elapsed * 2) * 0.01;
      }
    }

    // 4. Hotspot visual animations (pulse and rotate)
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

    // Dispose geometries, materials and textures
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
