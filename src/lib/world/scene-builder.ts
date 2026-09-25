import * as THREE from "three";
import { Position3D } from "./types";
import {
  UNIFIED_PLAZA_HOTSPOTS,
  getSpawnPositionForZone,
} from "./unified-plaza";
import {
  EXPANDED_WORLD_BOUNDS,
  DAYLIGHT_CONFIG,
  ROAD_SYSTEM_CONFIG,
  CarSpec,
  computeCarPosition,
} from "./city-expansion";
import {
  CHASE_CAMERA_CONFIG,
  CENTRAL_PARK_CONFIG,
  TOWN_FACILITIES_CONFIG,
  DENSE_TRAFFIC_CONFIG,
  PEDESTRIAN_CONFIG,
  computePedestrianPosition,
  computeHumanAvatarKinematics,
  PedestrianSpec,
} from "./town-park-expansion";
import { CityScene } from "@/city/city-scene";

export interface CafeSceneHooks {
  onHotspotClick?: (hotspotId: string) => void;
  onPlayerMove?: (pos: Position3D, rotation: number) => void;
  onReady?: () => void;
}

export class Cafe3DScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public cityScene!: CityScene;
  private canvas: HTMLCanvasElement;
  public hooks?: CafeSceneHooks;

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
  private carMeshes: { mesh: THREE.Group; spec: CarSpec; wheels: THREE.Mesh[] }[] = [];
  private pedestrianMeshes: {
    mesh: THREE.Group;
    spec: PedestrianSpec;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
  }[] = [];
  private cameraTargetLookAt: THREE.Vector3 = new THREE.Vector3();
  private npcs: { mesh: THREE.Group; head: THREE.Mesh }[] = [];

  // Animation & Camera state
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private targetPlayerPos: Position3D = { x: 0, y: 0, z: 2 };
  private playerRotation: number = 0;
  private isPlayerWalking: boolean = false;
  private isMateoTalking: boolean = false;
  private isBaristaBrewing: boolean = false;
  private hasNotifiedReady: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    public placeType: string = "cafe",
    hooks?: CafeSceneHooks
  ) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.clock = new THREE.Clock();

    // 1. Scene - Bright Daylight Mediterranean Sky
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(DAYLIGHT_CONFIG.skyColorHex);
    this.scene.fog = new THREE.FogExp2(
      DAYLIGHT_CONFIG.fogColorHex,
      DAYLIGHT_CONFIG.fogDensity
    );

    // 2. Camera - Over-The-Shoulder Chase Camera Perspective
    const aspect = canvas.clientWidth / canvas.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(
      CHASE_CAMERA_CONFIG.fov,
      aspect,
      0.1,
      250
    );

    const initialSpawn = getSpawnPositionForZone(placeType);
    this.targetPlayerPos = { ...initialSpawn };
    this.camera.position.set(
      initialSpawn.x + CHASE_CAMERA_CONFIG.shoulderOffsetX,
      CHASE_CAMERA_CONFIG.height,
      initialSpawn.z - CHASE_CAMERA_CONFIG.followDistance
    );
    this.cameraTargetLookAt.set(
      initialSpawn.x,
      CHASE_CAMERA_CONFIG.lookAtTargetOffsetY,
      initialSpawn.z + CHASE_CAMERA_CONFIG.lookAtAheadDistance
    );
    this.camera.lookAt(this.cameraTargetLookAt);

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
    this.buildCentralPark();
    this.buildApartmentTowers();
    this.buildMultipleBusStops();
    this.buildRoadAndTrafficSystem();
    this.buildSidewalkPedestrians();
    this.buildCafeZone();
    this.buildBusStopZone();
    this.buildAirportZone();
    this.buildHotspotMarkers();
    this.cityScene = new CityScene();
    this.cityScene.init(this.scene);

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

    // Persistent NPC cache to eliminate per-frame allocations in animate()
    this.npcs = [
      { mesh: this.mateoMesh, head: this.mateoHead },
      { mesh: this.srinivasMesh, head: this.srinivasHead },
      { mesh: this.elenaMesh, head: this.elenaHead },
    ];

    // 6. Handle Resize
    window.addEventListener("resize", this.handleResize);

    // 7. Start Render Loop
    this.animate();
  }

  private setupPlazaLighting() {
    // 1. Ambient daylight
    const ambientLight = new THREE.AmbientLight(
      DAYLIGHT_CONFIG.ambientColorHex,
      DAYLIGHT_CONFIG.ambientIntensity
    );
    this.scene.add(ambientLight);

    // 2. Sky & ground reflection hemisphere light
    const hemiLight = new THREE.HemisphereLight(
      DAYLIGHT_CONFIG.skyColorHex,
      DAYLIGHT_CONFIG.groundHemiColorHex,
      0.65
    );
    this.scene.add(hemiLight);

    // 3. Sun Directional Light with re-budgeted wide shadow camera
    const sunLight = new THREE.DirectionalLight(
      DAYLIGHT_CONFIG.sunColorHex,
      DAYLIGHT_CONFIG.sunIntensity
    );
    sunLight.position.set(
      DAYLIGHT_CONFIG.sunPosition.x,
      DAYLIGHT_CONFIG.sunPosition.y,
      DAYLIGHT_CONFIG.sunPosition.z
    );
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Subtle warm zone accent fills
    const cafeLight = new THREE.PointLight(0xf59e0b, 1.2, 16);
    cafeLight.position.set(-14, 4.0, -2.5);
    this.scene.add(cafeLight);

    const airportLight = new THREE.PointLight(0x38bdf8, 1.2, 16);
    airportLight.position.set(14, 4.0, -2.5);
    this.scene.add(airportLight);
  }

  private buildUnifiedPlazaArchitecture() {
    const width = EXPANDED_WORLD_BOUNDS.maxX - EXPANDED_WORLD_BOUNDS.minX; // 100m
    const depth = EXPANDED_WORLD_BOUNDS.maxZ - EXPANDED_WORLD_BOUNDS.minZ; // 44m

    // 1. Master District Ground Surface (Vast Mediterranean city foundation)
    const masterFloorGeo = new THREE.PlaneGeometry(width + 24, depth + 16);
    const masterFloorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
    });
    const masterFloor = new THREE.Mesh(masterFloorGeo, masterFloorMat);
    masterFloor.rotation.x = -Math.PI / 2;
    masterFloor.position.set(0, -0.01, 4);
    masterFloor.receiveShadow = true;
    this.scene.add(masterFloor);

    // 2. Pedestrian Plaza Promenade Floor
    const plazaGeo = new THREE.PlaneGeometry(width, 24);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0, -4);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Zone Floors:
    // West: Café terracotta tiles (warm Madrid terrace)
    const cafeTileGeo = new THREE.PlaneGeometry(30, 20);
    const cafeTileMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.5,
    });
    const cafeFloor = new THREE.Mesh(cafeTileGeo, cafeTileMat);
    cafeFloor.rotation.x = -Math.PI / 2;
    cafeFloor.position.set(-20, 0.01, -4);
    cafeFloor.receiveShadow = true;
    this.scene.add(cafeFloor);

    // East: Airport terminal polished slate
    const airportSlateGeo = new THREE.PlaneGeometry(30, 20);
    const airportSlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.2,
    });
    const airportFloor = new THREE.Mesh(airportSlateGeo, airportSlateMat);
    airportFloor.rotation.x = -Math.PI / 2;
    airportFloor.position.set(20, 0.01, -4);
    airportFloor.receiveShadow = true;
    this.scene.add(airportFloor);

    // Center: Central Bus Stop cobblestone concourse
    const busConcourseGeo = new THREE.PlaneGeometry(16, 20);
    const busConcourseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.7,
    });
    const busConcourse = new THREE.Mesh(busConcourseGeo, busConcourseMat);
    busConcourse.rotation.x = -Math.PI / 2;
    busConcourse.position.set(0, 0.012, -4);
    busConcourse.receiveShadow = true;
    this.scene.add(busConcourse);

    // 3. Perimeter Back Architecture Wall
    const backWallGeo = new THREE.BoxGeometry(width + 10, 6.0, 0.6);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 3.0, EXPANDED_WORLD_BOUNDS.minZ);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Back wall modern architectural crown trim
    const trimGeo = new THREE.BoxGeometry(width + 10, 0.35, 0.9);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 6.0, EXPANDED_WORLD_BOUNDS.minZ);
    this.scene.add(trim);
  }

  private buildRoadAndTrafficSystem() {
    const roadGroup = new THREE.Group();

    // 1. Multi-Lane Asphalt Roadway
    const roadGeo = new THREE.PlaneGeometry(
      ROAD_SYSTEM_CONFIG.roadLength,
      ROAD_SYSTEM_CONFIG.roadWidth
    );
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.92,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, ROAD_SYSTEM_CONFIG.roadCenterZ);
    road.receiveShadow = true;
    roadGroup.add(road);

    // 2. Center Lane Divider Dashed Line (White)
    const stripeCount = Math.floor(ROAD_SYSTEM_CONFIG.roadLength / 4.0);
    const stripeGeo = new THREE.PlaneGeometry(2.4, 0.22);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
    });
    for (let i = 0; i < stripeCount; i++) {
      const stripeX = -ROAD_SYSTEM_CONFIG.roadLength / 2 + 2 + i * 4.0;
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(stripeX, 0.025, ROAD_SYSTEM_CONFIG.roadCenterZ);
      stripe.receiveShadow = true;
      roadGroup.add(stripe);
    }

    // Outer lane solid border lines
    const lineGeo = new THREE.PlaneGeometry(ROAD_SYSTEM_CONFIG.roadLength, 0.16);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });

    const northLine = new THREE.Mesh(lineGeo, lineMat);
    northLine.rotation.x = -Math.PI / 2;
    northLine.position.set(0, 0.025, ROAD_SYSTEM_CONFIG.roadCenterZ - 4.3);
    roadGroup.add(northLine);

    const southLine = new THREE.Mesh(lineGeo, lineMat);
    southLine.rotation.x = -Math.PI / 2;
    southLine.position.set(0, 0.025, ROAD_SYSTEM_CONFIG.roadCenterZ + 4.3);
    roadGroup.add(southLine);

    // 3. Zebra Crosswalks at Pedestrian Crossing Points
    const crosswalkLocations = [-8.0, 0.0, 8.0];
    const zebraGeo = new THREE.PlaneGeometry(0.65, 8.5);
    const zebraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    crosswalkLocations.forEach((cx) => {
      for (let s = -2; s <= 2; s++) {
        const zebra = new THREE.Mesh(zebraGeo, zebraMat);
        zebra.rotation.x = -Math.PI / 2;
        zebra.position.set(cx + s * 1.15, 0.026, ROAD_SYSTEM_CONFIG.roadCenterZ);
        zebra.receiveShadow = true;
        roadGroup.add(zebra);
      }
    });

    // 4. Concrete Sidewalks and Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });

    // North curb (between plaza & road at z ~ 4.6)
    const curbNorthGeo = new THREE.BoxGeometry(ROAD_SYSTEM_CONFIG.roadLength, 0.18, 0.35);
    const curbNorth = new THREE.Mesh(curbNorthGeo, curbMat);
    curbNorth.position.set(0, 0.09, ROAD_SYSTEM_CONFIG.curbNorthZ);
    curbNorth.receiveShadow = true;
    roadGroup.add(curbNorth);

    // South curb (south side of road at z ~ 14.4)
    const curbSouthGeo = new THREE.BoxGeometry(ROAD_SYSTEM_CONFIG.roadLength, 0.18, 0.35);
    const curbSouth = new THREE.Mesh(curbSouthGeo, curbMat);
    curbSouth.position.set(0, 0.09, ROAD_SYSTEM_CONFIG.curbSouthZ);
    curbSouth.receiveShadow = true;
    roadGroup.add(curbSouth);

    // South Sidewalk Promenade
    const southWalkGeo = new THREE.PlaneGeometry(ROAD_SYSTEM_CONFIG.roadLength, 9.0);
    const southWalkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const southWalk = new THREE.Mesh(southWalkGeo, southWalkMat);
    southWalk.rotation.x = -Math.PI / 2;
    southWalk.position.set(0, 0.015, ROAD_SYSTEM_CONFIG.curbSouthZ + 4.5);
    southWalk.receiveShadow = true;
    roadGroup.add(southWalk);

    // 5. Street Lamps (Lining both sides of the roadway)
    ROAD_SYSTEM_CONFIG.streetLamps.forEach((lampSpec) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lampSpec.position.x, 0, lampSpec.position.z);

      // Base pedestal
      const baseGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.4, 8);
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(baseGeo, metalMat);
      base.position.y = 0.2;
      lampGroup.add(base);

      // Vertical Pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, lampSpec.height, 8);
      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = lampSpec.height / 2;
      lampGroup.add(pole);

      // Curved Gooseneck Arm pointing toward the road
      const armDirection = lampSpec.position.z < ROAD_SYSTEM_CONFIG.roadCenterZ ? 1 : -1;
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.rotation.x = (Math.PI / 2.8) * armDirection;
      arm.position.set(0, lampSpec.height - 0.2, armDirection * 0.55);
      lampGroup.add(arm);

      // Lantern Hood
      const hoodGeo = new THREE.ConeGeometry(0.36, 0.2, 8);
      const hood = new THREE.Mesh(hoodGeo, metalMat);
      hood.position.set(0, lampSpec.height + 0.15, armDirection * 1.1);
      lampGroup.add(hood);

      // Emissive Glowing Lantern Bulb (Hardware-safe emissive mesh without pointlight)
      const bulbGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: lampSpec.lanternColorHex,
        emissive: lampSpec.lanternColorHex,
        emissiveIntensity: 0.95,
        roughness: 0.1,
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, lampSpec.height, armDirection * 1.1);
      lampGroup.add(bulb);

      roadGroup.add(lampGroup);
    });

    // 6. Traffic Lights (at crosswalks)
    ROAD_SYSTEM_CONFIG.trafficLights.forEach((tlSpec) => {
      const tlGroup = new THREE.Group();
      tlGroup.position.set(tlSpec.position.x, 0, tlSpec.position.z);

      // Pole
      const tlPoleGeo = new THREE.CylinderGeometry(0.09, 0.11, tlSpec.poleHeight, 8);
      const tlPoleMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.7,
        roughness: 0.4,
      });
      const tlPole = new THREE.Mesh(tlPoleGeo, tlPoleMat);
      tlPole.position.y = tlSpec.poleHeight / 2;
      tlGroup.add(tlPole);

      // Signal Housing Box
      const boxGeo = new THREE.BoxGeometry(0.45, 1.35, 0.4);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.5 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(0, tlSpec.poleHeight - 0.4, 0);
      tlGroup.add(box);

      // 3 Lenses: Red, Yellow, Green
      const lensGeo = new THREE.SphereGeometry(0.12, 12, 12);

      // Red lens
      const redMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: tlSpec.initialState === "red" ? 0xef4444 : 0x450a0a,
        emissiveIntensity: tlSpec.initialState === "red" ? 0.95 : 0.2,
      });
      const redLens = new THREE.Mesh(lensGeo, redMat);
      redLens.position.set(0, tlSpec.poleHeight - 0.05, 0.2);
      tlGroup.add(redLens);

      // Yellow lens
      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: tlSpec.initialState === "yellow" ? 0xf59e0b : 0x451a03,
        emissiveIntensity: tlSpec.initialState === "yellow" ? 0.95 : 0.2,
      });
      const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
      yellowLens.position.set(0, tlSpec.poleHeight - 0.4, 0.2);
      tlGroup.add(yellowLens);

      // Green lens
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: tlSpec.initialState === "green" ? 0x22c55e : 0x052e16,
        emissiveIntensity: tlSpec.initialState === "green" ? 0.95 : 0.2,
      });
      const greenLens = new THREE.Mesh(lensGeo, greenMat);
      greenLens.position.set(0, tlSpec.poleHeight - 0.75, 0.2);
      tlGroup.add(greenLens);

      roadGroup.add(tlGroup);
    });

    // 7. Moving 3D Cars (Dense multi-vehicle fleet)
    this.carMeshes = [];
    DENSE_TRAFFIC_CONFIG.cars.forEach((carSpec) => {
      const carGroup = new THREE.Group();
      const wheels: THREE.Mesh[] = [];

      // Car Body / Chassis
      const bodyGeo = new THREE.BoxGeometry(
        carSpec.length,
        carSpec.height * 0.55,
        carSpec.width
      );
      const bodyMat = new THREE.MeshStandardMaterial({
        color: carSpec.colorHex,
        roughness: 0.2,
        metalness: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = carSpec.height * 0.45;
      body.castShadow = true;
      body.receiveShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      const cabinLength =
        carSpec.carType === "bus" ? carSpec.length * 0.88 : carSpec.length * 0.55;
      const cabinGeo = new THREE.BoxGeometry(
        cabinLength,
        carSpec.height * 0.48,
        carSpec.width * 0.88
      );
      const cabinMat = new THREE.MeshStandardMaterial({
        color: carSpec.carType === "bus" ? carSpec.colorHex : 0x0f172a,
        roughness: 0.3,
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(
        carSpec.carType === "bus" ? 0 : -carSpec.length * 0.08,
        carSpec.height * 0.82,
        0
      );
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Windows (front, rear, sides)
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.8,
      });
      const frontWinGeo = new THREE.PlaneGeometry(
        carSpec.width * 0.75,
        carSpec.height * 0.35
      );
      const frontWin = new THREE.Mesh(frontWinGeo, windowMat);
      frontWin.rotation.y = Math.PI / 2;
      frontWin.position.set(
        cabin.position.x + cabinLength / 2 + 0.01,
        cabin.position.y,
        0
      );
      carGroup.add(frontWin);

      // Taxi roof sign if taxi
      if (carSpec.carType === "taxi") {
        const signGeo = new THREE.BoxGeometry(0.65, 0.2, 0.32);
        const signMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfef08a,
          emissiveIntensity: 0.85,
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(cabin.position.x, cabin.position.y + carSpec.height * 0.35, 0);
        carGroup.add(sign);
      }

      // Headlights (White glow facing front)
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.95,
      });
      const headGeo = new THREE.BoxGeometry(0.1, 0.18, 0.25);
      const headLeft = new THREE.Mesh(headGeo, headMat);
      headLeft.position.set(
        carSpec.length / 2 + 0.01,
        carSpec.height * 0.4,
        carSpec.width * 0.35
      );
      carGroup.add(headLeft);

      const headRight = new THREE.Mesh(headGeo, headMat);
      headRight.position.set(
        carSpec.length / 2 + 0.01,
        carSpec.height * 0.4,
        -carSpec.width * 0.35
      );
      carGroup.add(headRight);

      // Taillights (Red glow facing rear)
      const tailMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.95,
      });
      const tailGeo = new THREE.BoxGeometry(0.1, 0.18, 0.25);
      const tailLeft = new THREE.Mesh(tailGeo, tailMat);
      tailLeft.position.set(
        -carSpec.length / 2 - 0.01,
        carSpec.height * 0.4,
        carSpec.width * 0.35
      );
      carGroup.add(tailLeft);

      const tailRight = new THREE.Mesh(tailGeo, tailMat);
      tailRight.position.set(
        -carSpec.length / 2 - 0.01,
        carSpec.height * 0.4,
        -carSpec.width * 0.35
      );
      carGroup.add(tailRight);

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 14);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
      const wheelOffsets = [
        { x: carSpec.length * 0.3, z: carSpec.width * 0.52 },
        { x: carSpec.length * 0.3, z: -carSpec.width * 0.52 },
        { x: -carSpec.length * 0.3, z: carSpec.width * 0.52 },
        { x: -carSpec.length * 0.3, z: -carSpec.width * 0.52 },
      ];

      wheelOffsets.forEach((wo) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wo.x, 0.32, wo.z);
        wheel.castShadow = true;
        carGroup.add(wheel);
        wheels.push(wheel);
      });

      // Orient car in direction of travel
      if (carSpec.direction < 0) {
        carGroup.rotation.y = Math.PI; // Face west
      }

      carGroup.position.set(carSpec.initialX, 0, carSpec.laneZ);
      roadGroup.add(carGroup);
      this.carMeshes.push({ mesh: carGroup, spec: carSpec, wheels });
    });

    this.scene.add(roadGroup);
  }

  private buildCentralPark() {
    const parkGroup = new THREE.Group();
    const bounds = CENTRAL_PARK_CONFIG.bounds;
    const parkWidth = bounds.maxX - bounds.minX; // 26m
    const parkDepth = bounds.maxZ - bounds.minZ; // 14m
    const centerX = (bounds.minX + bounds.maxX) / 2; // 0m
    const centerZ = (bounds.minZ + bounds.maxZ) / 2; // -2m

    // 1. Lush Green Park Lawn
    const lawnGeo = new THREE.PlaneGeometry(parkWidth, parkDepth);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vibrant grass green
      roughness: 0.85,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(centerX, 0.015, centerZ);
    lawn.receiveShadow = true;
    parkGroup.add(lawn);

    // 2. 4 Paved Crosswalk / Entrance Walkways to universal blocks
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Slate cobblestone paver
      roughness: 0.75,
    });

    // North Entrance Path (to Cedar Court Apartments)
    const northPathGeo = new THREE.PlaneGeometry(3.0, parkDepth / 2 - 1.0);
    const northPath = new THREE.Mesh(northPathGeo, pathMat);
    northPath.rotation.x = -Math.PI / 2;
    northPath.position.set(centerX, 0.018, centerZ - parkDepth / 4 - 0.5);
    northPath.receiveShadow = true;
    parkGroup.add(northPath);

    // South Entrance Path (to Transit Boulevard Crosswalk)
    const southPathGeo = new THREE.PlaneGeometry(3.0, parkDepth / 2 - 1.0);
    const southPath = new THREE.Mesh(southPathGeo, pathMat);
    southPath.rotation.x = -Math.PI / 2;
    southPath.position.set(centerX, 0.018, centerZ + parkDepth / 4 + 0.5);
    southPath.receiveShadow = true;
    parkGroup.add(southPath);

    // West Entrance Path (to High Street & Café)
    const westPathGeo = new THREE.PlaneGeometry(parkWidth / 2 - 1.5, 3.0);
    const westPath = new THREE.Mesh(westPathGeo, pathMat);
    westPath.rotation.x = -Math.PI / 2;
    westPath.position.set(centerX - parkWidth / 4 - 0.75, 0.018, centerZ);
    westPath.receiveShadow = true;
    parkGroup.add(westPath);

    // East Entrance Path (to Airport Terminal & Gates)
    const eastPathGeo = new THREE.PlaneGeometry(parkWidth / 2 - 1.5, 3.0);
    const eastPath = new THREE.Mesh(eastPathGeo, pathMat);
    eastPath.rotation.x = -Math.PI / 2;
    eastPath.position.set(centerX + parkWidth / 4 + 0.75, 0.018, centerZ);
    eastPath.receiveShadow = true;
    parkGroup.add(eastPath);

    // 3. Central Pond
    const pondSpec = CENTRAL_PARK_CONFIG.pond;
    const pondGeo = new THREE.CircleGeometry(pondSpec.radius, 32);
    const pondMat = new THREE.MeshStandardMaterial({
      color: pondSpec.colorHex,
      roughness: 0.1,
      metalness: 0.25,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(pondSpec.x, 0.022, pondSpec.z);
    pond.receiveShadow = true;
    parkGroup.add(pond);

    // Stone Rim around Pond
    const rimGeo = new THREE.RingGeometry(pondSpec.radius, pondSpec.radius + 0.35, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(pondSpec.x, 0.023, pondSpec.z);
    rim.receiveShadow = true;
    parkGroup.add(rim);

    // Decorative water fountain nozzle in pond center
    const nozzleGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.45, 8);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(pondSpec.x, 0.22, pondSpec.z);
    parkGroup.add(nozzle);

    // 4. Park Trees
    CENTRAL_PARK_CONFIG.trees.forEach((tree) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tree.x, 0, tree.z);

      // Trunk
      const trunkHeight = tree.height * 0.45;
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, trunkHeight, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Tier 1 Foliage
      const fol1Height = tree.height * 0.55;
      const fol1Geo = new THREE.ConeGeometry(tree.radius, fol1Height, 8);
      const fol1Mat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
      const fol1 = new THREE.Mesh(fol1Geo, fol1Mat);
      fol1.position.y = trunkHeight + fol1Height * 0.4;
      fol1.castShadow = true;
      treeGroup.add(fol1);

      // Tier 2 Foliage
      const fol2Height = tree.height * 0.45;
      const fol2Geo = new THREE.ConeGeometry(tree.radius * 0.72, fol2Height, 8);
      const fol2Mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
      const fol2 = new THREE.Mesh(fol2Geo, fol2Mat);
      fol2.position.y = trunkHeight + fol1Height * 0.75;
      fol2.castShadow = true;
      treeGroup.add(fol2);

      parkGroup.add(treeGroup);
    });

    // 5. Playground Structures (Swings & Slide)
    const playSpec = CENTRAL_PARK_CONFIG.playground;
    const playGroup = new THREE.Group();
    playGroup.position.set(playSpec.x, 0, playSpec.z);

    const swingMetalMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    // A-frame side posts
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
    const postL1 = new THREE.Mesh(postGeo, swingMetalMat);
    postL1.position.set(-1.4, 1.2, 0.4);
    postL1.rotation.z = -0.15;
    playGroup.add(postL1);

    const postL2 = new THREE.Mesh(postGeo, swingMetalMat);
    postL2.position.set(-1.4, 1.2, -0.4);
    postL2.rotation.z = -0.15;
    playGroup.add(postL2);

    const postR1 = new THREE.Mesh(postGeo, swingMetalMat);
    postR1.position.set(1.4, 1.2, 0.4);
    postR1.rotation.z = 0.15;
    playGroup.add(postR1);

    const postR2 = new THREE.Mesh(postGeo, swingMetalMat);
    postR2.position.set(1.4, 1.2, -0.4);
    postR2.rotation.z = 0.15;
    playGroup.add(postR2);

    // Crossbar
    const crossbarGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
    const crossbar = new THREE.Mesh(crossbarGeo, swingMetalMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.4, 0);
    playGroup.add(crossbar);

    // Two hanging seats
    [-0.6, 0.6].forEach((sx) => {
      const seatRopeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8 });
      const ropeL = new THREE.Mesh(seatRopeGeo, ropeMat);
      ropeL.position.set(sx - 0.15, 1.5, 0);
      playGroup.add(ropeL);

      const ropeR = new THREE.Mesh(seatRopeGeo, ropeMat);
      ropeR.position.set(sx + 0.15, 1.5, 0);
      playGroup.add(ropeR);

      const seatGeo = new THREE.BoxGeometry(0.4, 0.05, 0.2);
      const seat = new THREE.Mesh(seatGeo, woodMat);
      seat.position.set(sx, 0.68, 0);
      playGroup.add(seat);
    });

    // Playground Slide
    const slideGroup = new THREE.Group();
    slideGroup.position.set(3.2, 0, 0);

    const platGeo = new THREE.BoxGeometry(1.0, 0.1, 1.0);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, 1.5, 0);
    slideGroup.add(platform);

    [-0.45, 0.45].forEach((lx) => {
      [-0.45, 0.45].forEach((lz) => {
        const legPGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
        const legP = new THREE.Mesh(legPGeo, swingMetalMat);
        legP.position.set(lx, 0.75, lz);
        slideGroup.add(legP);
      });
    });

    const chuteGeo = new THREE.BoxGeometry(0.65, 0.06, 2.4);
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red Madrid slide
      roughness: 0.2,
      metalness: 0.3,
    });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.rotation.x = Math.PI / 4.8;
    chute.position.set(0, 0.75, 1.2);
    slideGroup.add(chute);

    const ladderGeo = new THREE.BoxGeometry(0.5, 1.6, 0.08);
    const ladder = new THREE.Mesh(ladderGeo, woodMat);
    ladder.rotation.x = -Math.PI / 8;
    ladder.position.set(0, 0.75, -0.7);
    slideGroup.add(ladder);

    playGroup.add(slideGroup);
    parkGroup.add(playGroup);

    // 6. Park Benches
    CENTRAL_PARK_CONFIG.benches.forEach((benchSpec) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(benchSpec.x, 0, benchSpec.z);
      benchGroup.rotation.y = benchSpec.rotationY;

      const benchSeatGeo = new THREE.BoxGeometry(1.6, 0.08, 0.45);
      const benchSeat = new THREE.Mesh(benchSeatGeo, woodMat);
      benchSeat.position.set(0, 0.45, 0);
      benchSeat.castShadow = true;
      benchGroup.add(benchSeat);

      const backGeo = new THREE.BoxGeometry(1.6, 0.35, 0.06);
      const back = new THREE.Mesh(backGeo, woodMat);
      back.position.set(0, 0.72, -0.2);
      back.castShadow = true;
      benchGroup.add(back);

      [-0.7, 0.7].forEach((bx) => {
        const blegGeo = new THREE.BoxGeometry(0.06, 0.45, 0.4);
        const bleg = new THREE.Mesh(blegGeo, swingMetalMat);
        bleg.position.set(bx, 0.22, 0);
        benchGroup.add(bleg);
      });

      parkGroup.add(benchGroup);
    });

    this.scene.add(parkGroup);
  }

  private buildApartmentTowers() {
    const towersGroup = new THREE.Group();

    TOWN_FACILITIES_CONFIG.apartmentTowers.forEach((towerSpec) => {
      const tower = new THREE.Group();
      tower.position.set(towerSpec.x, 0, towerSpec.z);

      // 1. Tower Body
      const bodyGeo = new THREE.BoxGeometry(
        towerSpec.width,
        towerSpec.height,
        towerSpec.depth
      );
      const bodyMat = new THREE.MeshStandardMaterial({
        color: towerSpec.facadeColorHex,
        roughness: 0.7,
        metalness: 0.2,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = towerSpec.height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      tower.add(body);

      // 2. Architectural Floor Belts / Slabs
      const slabMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
      for (let f = 1; f < towerSpec.floors; f++) {
        const floorY = (f * towerSpec.height) / towerSpec.floors;
        const slabGeo = new THREE.BoxGeometry(
          towerSpec.width + 0.4,
          0.25,
          towerSpec.depth + 0.4
        );
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.y = floorY;
        slab.castShadow = true;
        tower.add(slab);
      }

      // 3. Window Grid across Front Facade
      const winGeo = new THREE.PlaneGeometry(1.1, 1.2);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0xfef08a,
        emissiveIntensity: 0.45,
        roughness: 0.1,
      });

      for (let row = 1; row <= towerSpec.windowGridRows; row++) {
        const rowY = ((row - 0.5) * towerSpec.height) / towerSpec.floors;
        for (let col = 0; col < towerSpec.windowGridCols; col++) {
          const colX =
            -towerSpec.width / 2 +
            (towerSpec.width / (towerSpec.windowGridCols + 1)) * (col + 1);

          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(colX, rowY, towerSpec.depth / 2 + 0.02);
          tower.add(win);
        }
      }

      // 4. Balconies with Railings
      const balconyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      for (let f = 2; f < towerSpec.floors; f += 2) {
        const balcY = (f * towerSpec.height) / towerSpec.floors;
        const balcGeo = new THREE.BoxGeometry(towerSpec.width * 0.65, 0.15, 1.2);
        const balc = new THREE.Mesh(balcGeo, slabMat);
        balc.position.set(0, balcY, towerSpec.depth / 2 + 0.6);
        tower.add(balc);

        const railGeo = new THREE.BoxGeometry(towerSpec.width * 0.65, 0.65, 0.05);
        const rail = new THREE.Mesh(railGeo, balconyMat);
        rail.position.set(0, balcY + 0.35, towerSpec.depth / 2 + 1.2);
        tower.add(rail);
      }

      // 5. Grand Ground-Floor Lobby Entrance
      const lobbyCanopyGeo = new THREE.BoxGeometry(4.2, 0.2, 2.0);
      const canopy = new THREE.Mesh(lobbyCanopyGeo, balconyMat);
      canopy.position.set(0, 3.2, towerSpec.depth / 2 + 1.0);
      tower.add(canopy);

      const doorGeo = new THREE.PlaneGeometry(2.4, 2.8);
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.5,
      });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 1.4, towerSpec.depth / 2 + 0.03);
      tower.add(door);

      // Lobby Entrance Warm Light
      const lobbyLightGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const lobbyLightMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 0.95,
      });
      const lobbyLight = new THREE.Mesh(lobbyLightGeo, lobbyLightMat);
      lobbyLight.position.set(0, 3.0, towerSpec.depth / 2 + 0.9);
      tower.add(lobbyLight);

      // 6. Rooftop Parapet and Architectural Trim
      const roofParapetGeo = new THREE.BoxGeometry(
        towerSpec.width + 0.2,
        0.8,
        towerSpec.depth + 0.2
      );
      const roofParapet = new THREE.Mesh(roofParapetGeo, slabMat);
      roofParapet.position.y = towerSpec.height + 0.4;
      tower.add(roofParapet);

      // Rooftop Utility / Elevator Penthouse
      const penthouseGeo = new THREE.BoxGeometry(4.0, 2.2, 3.5);
      const penthouse = new THREE.Mesh(penthouseGeo, bodyMat);
      penthouse.position.set(0, towerSpec.height + 1.1, 0);
      tower.add(penthouse);

      // Roof Antenna Mast
      const antennaGeo = new THREE.CylinderGeometry(0.04, 0.08, 4.5, 6);
      const antenna = new THREE.Mesh(antennaGeo, balconyMat);
      antenna.position.set(1.2, towerSpec.height + 3.2, 0);
      tower.add(antenna);

      towersGroup.add(tower);
    });

    this.scene.add(towersGroup);
  }

  private buildMultipleBusStops() {
    const busStopsGroup = new THREE.Group();

    TOWN_FACILITIES_CONFIG.busStops.forEach((stopSpec) => {
      if (stopSpec.x === 0) return; // avoid duplicating central shelter

      const stop = new THREE.Group();
      stop.position.set(stopSpec.x, 0, stopSpec.z);

      const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
      });
      const canopyMat = new THREE.MeshStandardMaterial({
        color: stopSpec.shelterColorHex,
        roughness: 0.4,
      });

      // 2 Pillars
      [-1.8, 1.8].forEach((px) => {
        const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
        const pillar = new THREE.Mesh(pillarGeo, steelMat);
        pillar.position.set(px, 1.4, -0.9);
        pillar.castShadow = true;
        stop.add(pillar);
      });

      // Glass Back Panel
      const backGlassGeo = new THREE.BoxGeometry(3.6, 2.2, 0.05);
      const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
      backGlass.position.set(0, 1.3, -0.9);
      stop.add(backGlass);

      // Curved Canopy
      const roofGeo = new THREE.BoxGeometry(4.2, 0.12, 2.2);
      const roof = new THREE.Mesh(roofGeo, canopyMat);
      roof.position.set(0, 2.8, 0);
      roof.castShadow = true;
      stop.add(roof);

      // Waiting Bench
      const benchGeo = new THREE.BoxGeometry(2.8, 0.08, 0.5);
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(0, 0.45, -0.5);
      bench.castShadow = true;
      stop.add(bench);

      // Totem Signpost with Route badge
      const totemGeo = new THREE.BoxGeometry(0.3, 2.6, 0.08);
      const totem = new THREE.Mesh(totemGeo, steelMat);
      totem.position.set(2.4, 1.3, -0.2);
      stop.add(totem);

      const signGeo = new THREE.BoxGeometry(0.8, 0.5, 0.1);
      const signMat = new THREE.MeshStandardMaterial({
        color: stopSpec.shelterColorHex,
        emissive: stopSpec.shelterColorHex,
        emissiveIntensity: 0.25,
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(2.4, 2.3, -0.2);
      stop.add(sign);

      busStopsGroup.add(stop);
    });

    this.scene.add(busStopsGroup);
  }

  private buildSidewalkPedestrians() {
    const pedGroup = new THREE.Group();

    PEDESTRIAN_CONFIG.pedestrians.forEach((pedSpec) => {
      const ped = new THREE.Group();

      const shirtMat = new THREE.MeshStandardMaterial({
        color: pedSpec.shirtColorHex,
        roughness: 0.6,
      });
      const pantsMat = new THREE.MeshStandardMaterial({
        color: pedSpec.pantsColorHex,
        roughness: 0.8,
      });
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xfcd34d,
        roughness: 0.5,
      });
      const shoeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.9,
      });

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.65, 12);
      const torso = new THREE.Mesh(torsoGeo, shirtMat);
      torso.position.y = 0.92;
      torso.castShadow = true;
      ped.add(torso);

      // Head
      const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const head = new THREE.Mesh(headGeo, skinMat);
      head.position.y = 1.45;
      head.castShadow = true;
      ped.add(head);

      // Hair / Hat
      const hairGeo = new THREE.SphereGeometry(0.19, 12, 12);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 1.5, -0.02);
      ped.add(hair);

      // Left Leg Pivot
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.12, 0.6, 0);
      const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.y = -0.27;
      leftLeg.castShadow = true;
      leftLegPivot.add(leftLeg);

      const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.2);
      const leftFoot = new THREE.Mesh(footGeo, shoeMat);
      leftFoot.position.set(0, -0.52, 0.05);
      leftLegPivot.add(leftFoot);
      ped.add(leftLegPivot);

      // Right Leg Pivot
      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.12, 0.6, 0);
      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.y = -0.27;
      rightLeg.castShadow = true;
      rightLegPivot.add(rightLeg);

      const rightFoot = new THREE.Mesh(footGeo, shoeMat);
      rightFoot.position.set(0, -0.52, 0.05);
      rightLegPivot.add(rightFoot);
      ped.add(rightLegPivot);

      // Left Arm Pivot
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.3, 1.15, 0);
      const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8);
      const leftArm = new THREE.Mesh(armGeo, shirtMat);
      leftArm.position.y = -0.22;
      leftArmPivot.add(leftArm);
      ped.add(leftArmPivot);

      // Right Arm Pivot
      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.3, 1.15, 0);
      const rightArm = new THREE.Mesh(armGeo, shirtMat);
      rightArm.position.y = -0.22;
      rightArmPivot.add(rightArm);
      ped.add(rightArmPivot);

      ped.position.set(pedSpec.startX, 0, pedSpec.z);
      pedGroup.add(ped);

      this.pedestrianMeshes.push({
        mesh: ped,
        spec: pedSpec,
        leftLeg: leftLegPivot,
        rightLeg: rightLegPivot,
        leftArm: leftArmPivot,
        rightArm: rightArmPivot,
      });
    });

    this.scene.add(pedGroup);
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

    if (this.hooks?.onPlayerMove) {
      this.hooks.onPlayerMove(pos, this.playerRotation);
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
    const elapsed = performance.now() / 1000;
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (!this.hasNotifiedReady) {
      this.hasNotifiedReady = true;
      this.hooks?.onReady?.();
    }

    // CityScene composite update (Roads, Park, Buildings, Traffic, Pedestrians)
    this.cityScene?.update(delta, elapsed);

    // 0. Update Moving Traffic Kinematics on Boulevard
    this.carMeshes.forEach(({ mesh, spec, wheels }) => {
      const updatedPos = computeCarPosition(spec, elapsed);
      mesh.position.x = updatedPos.x;
      mesh.position.z = updatedPos.z;

      // Framerate-independent wheel spin in travel direction
      wheels.forEach((w) => {
        w.rotation.x += spec.direction * spec.speed * delta * 2.5;
      });
    });

    // 1. Update Sidewalk Footpath Pedestrians
    this.pedestrianMeshes.forEach(({ mesh, spec, leftLeg, rightLeg, leftArm, rightArm }) => {
      const pPos = computePedestrianPosition(spec, elapsed);
      mesh.position.x = pPos.x;
      mesh.position.z = pPos.z;
      mesh.rotation.y = pPos.rotationY;

      // Reciprocal walking limb swings
      const walkCycle = elapsed * spec.speed * 4.5;
      const legSwing = Math.sin(walkCycle) * 0.45;
      leftLeg.rotation.x = legSwing;
      rightLeg.rotation.x = -legSwing;
      leftArm.rotation.x = -legSwing * 0.7;
      rightArm.rotation.x = legSwing * 0.7;
      mesh.position.y = Math.abs(Math.sin(walkCycle)) * 0.03;
    });

    // 2. Smoothly interpolate player mesh to target position
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

    // Smooth shortest-arc rotation
    let rotDiff = this.playerRotation - this.playerMesh.rotation.y;
    rotDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
    this.playerMesh.rotation.y += rotDiff * 0.2;

    // 3. Natural Human Avatar Kinematics (stride bounce, lateral weight-transfer sway, breathing bob)
    const kin = computeHumanAvatarKinematics(this.isPlayerWalking, 1.0, elapsed);
    if (this.leftLegPivot) this.leftLegPivot.rotation.x = kin.leftLegRotX;
    if (this.rightLegPivot) this.rightLegPivot.rotation.x = kin.rightLegRotX;
    if (this.leftArmPivot) this.leftArmPivot.rotation.x = kin.leftArmRotX;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = kin.rightArmRotX;
    this.playerMesh.rotation.z = THREE.MathUtils.lerp(
      this.playerMesh.rotation.z,
      kin.torsoRollSway,
      0.2
    );
    this.playerMesh.position.y = kin.strideBounceY + kin.breathingY;

    // 4. Dynamic Over-The-Shoulder Chase Camera Tracking Behind Avatar (10° to 15° Downward Pitch)
    const rotY = this.playerMesh.rotation.y;
    const fwdX = Math.sin(rotY);
    const fwdZ = Math.cos(rotY);
    const rightX = Math.cos(rotY);
    const rightZ = -Math.sin(rotY);

    const targetCamX =
      this.playerMesh.position.x -
      fwdX * CHASE_CAMERA_CONFIG.followDistance +
      rightX * CHASE_CAMERA_CONFIG.shoulderOffsetX;
    const targetCamY = CHASE_CAMERA_CONFIG.height;
    const targetCamZ =
      this.playerMesh.position.z -
      fwdZ * CHASE_CAMERA_CONFIG.followDistance +
      rightZ * CHASE_CAMERA_CONFIG.shoulderOffsetX;

    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      targetCamX,
      CHASE_CAMERA_CONFIG.smoothFollowLerp
    );
    this.camera.position.y = THREE.MathUtils.lerp(
      this.camera.position.y,
      targetCamY,
      0.08
    );
    this.camera.position.z = THREE.MathUtils.lerp(
      this.camera.position.z,
      targetCamZ,
      CHASE_CAMERA_CONFIG.smoothFollowLerp
    );

    const targetLookX =
      this.playerMesh.position.x +
      fwdX * CHASE_CAMERA_CONFIG.lookAtAheadDistance;
    const targetLookY = CHASE_CAMERA_CONFIG.lookAtTargetOffsetY;
    const targetLookZ =
      this.playerMesh.position.z +
      fwdZ * CHASE_CAMERA_CONFIG.lookAtAheadDistance;

    this.cameraTargetLookAt.x = THREE.MathUtils.lerp(
      this.cameraTargetLookAt.x,
      targetLookX,
      CHASE_CAMERA_CONFIG.smoothLookAtLerp
    );
    this.cameraTargetLookAt.y = THREE.MathUtils.lerp(
      this.cameraTargetLookAt.y,
      targetLookY,
      0.08
    );
    this.cameraTargetLookAt.z = THREE.MathUtils.lerp(
      this.cameraTargetLookAt.z,
      targetLookZ,
      CHASE_CAMERA_CONFIG.smoothLookAtLerp
    );

    this.camera.lookAt(this.cameraTargetLookAt);

    // 4. NPC Look-At Behaviors (zero GC overhead using cached this.npcs)
    this.npcs.forEach(({ mesh, head }) => {
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

    if (!this.hasNotifiedReady) {
      this.hasNotifiedReady = true;
      this.hooks?.onReady?.();
    }
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
    this.cityScene?.dispose();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener("resize", this.handleResize);

    this.scene.traverse((obj) => {
      if ("geometry" in obj && obj.geometry && typeof (obj.geometry as THREE.BufferGeometry).dispose === "function") {
        (obj.geometry as THREE.BufferGeometry).dispose();
      }
      if ("material" in obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m?.dispose?.());
        } else if (typeof (obj.material as THREE.Material).dispose === "function") {
          (obj.material as THREE.Material).dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
