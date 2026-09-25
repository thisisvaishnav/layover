import * as THREE from "three";
import { CitySubsystem } from "@/city/types";
import { roadGraph, Lane, RoadWaypoint } from "@/roads/road-graph";
import cityConfig from "@/city-config.json";

export type VehicleType = "car" | "taxi" | "van" | "bus" | "motorbike";

export interface ActiveVehicle {
  id: string;
  type: VehicleType;
  lane: Lane;
  progress: number; // 0 to 1 along lane
  currentDist: number; // distance along lane in meters
  speed: number; // target speed in m/s
  actualSpeed: number; // current speed in m/s
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  busStopTimer: number; // for buses dwelling at stops (8-12s)
  busRoute?: string;
  colorHex: number;
}

export class Traffic implements CitySubsystem {
  public readonly name = "Traffic";
  private rootGroup: THREE.Group = new THREE.Group();
  public vehicles: ActiveVehicle[] = [];
  private trafficLightPhase: "green" | "yellow" | "red" = "green";
  private trafficLightTimer = 0;
  private laneVehiclesMap: Map<string, ActiveVehicle[]> = new Map();
  private tempPos: THREE.Vector3 = new THREE.Vector3();

  public init(scene: THREE.Scene): void {
    this.rootGroup.name = "CityTraffic";
    scene.add(this.rootGroup);

    this.spawnTargetFleet();
  }

  /**
   * Spawns exactly targetDensity (150) vehicles with the exact mix from city-config.json:
   * 55% car, 15% taxi, 12% van, 10% bus, 8% motorbike.
   */
  private spawnTargetFleet(): void {
    const { targetDensity, mix, speedKmh } = cityConfig.traffic;

    const taxiCount = Math.round(targetDensity * mix.taxi); // 23
    const vanCount = Math.round(targetDensity * mix.van); // 18
    const busCount = Math.round(targetDensity * mix.bus); // 15
    const motoCount = Math.round(targetDensity * mix.motorbike); // 12
    const carCount = targetDensity - (taxiCount + vanCount + busCount + motoCount); // 82

    const counts: Record<VehicleType, number> = {
      car: carCount,
      taxi: taxiCount,
      van: vanCount,
      bus: busCount,
      motorbike: motoCount,
    };

    const types: VehicleType[] = [];
    (Object.keys(counts) as VehicleType[]).forEach((t) => {
      for (let i = 0; i < counts[t]; i++) types.push(t);
    });

    // Distribute vehicles evenly across all available lanes in roadGraph
    const lanes = roadGraph.lanes;
    types.forEach((type, idx) => {
      const lane = lanes[idx % lanes.length];
      const initialProgress = (idx / types.length) * 0.95;

      const vehicle = this.createVehicle(type, lane, initialProgress, idx);
      this.vehicles.push(vehicle);
      this.rootGroup.add(vehicle.mesh);
    });
  }

  private createVehicle(
    type: VehicleType,
    lane: Lane,
    initialProgress: number,
    idx: number
  ): ActiveVehicle {
    const isRadial = lane.roadType === "radial";
    const speeds = cityConfig.traffic.speedKmh;

    // Speeds converted to m/s
    let baseSpeedKmh = isRadial
      ? speeds.radial[0] + Math.random() * (speeds.radial[1] - speeds.radial[0])
      : speeds.ring[0] + Math.random() * (speeds.ring[1] - speeds.ring[0]);

    if (type === "motorbike") {
      baseSpeedKmh += 10.0;
    } else if (type === "bus") {
      baseSpeedKmh = Math.min(baseSpeedKmh, speeds.bus);
    }
    const speedMs = baseSpeedKmh * (1000 / 3600);

    // Visual geometry and colors
    const mesh = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    let colorHex = 0x3b82f6;

    if (type === "car") {
      const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0x64748b, 0xf8fafc, 0x18181b];
      colorHex = carColors[idx % carColors.length];
      this.buildCarMesh(mesh, wheels, colorHex, 4.2, 1.8, 1.3);
    } else if (type === "taxi") {
      colorHex = 0xfacc15; // Madrid taxi yellow
      this.buildCarMesh(mesh, wheels, colorHex, 4.2, 1.8, 1.3, true);
    } else if (type === "van") {
      colorHex = 0xf1f5f9; // Delivery white van
      this.buildVanMesh(mesh, wheels, colorHex, 5.2, 2.0, 2.1);
    } else if (type === "bus") {
      colorHex = 0xdc2626; // City red bus
      this.buildBusMesh(mesh, wheels, colorHex, 10.5, 2.6, 3.2);
    } else if (type === "motorbike") {
      colorHex = 0x8b5cf6;
      this.buildMotorbikeMesh(mesh, wheels, colorHex);
    }

    const currentDist = initialProgress * lane.length;

    // Bus Route assignment
    let busRoute: string | undefined;
    if (type === "bus") {
      if (lane.roadType === "ring") {
        busRoute =
          lane.ringIndex === 0
            ? "innerRingLoop"
            : lane.ringIndex === 1
            ? "middleRingLoop"
            : "outerRingLoop";
      } else {
        busRoute = "radialExpress";
      }
    }

    return {
      id: `veh_${type}_${idx}`,
      type,
      lane,
      progress: initialProgress,
      currentDist,
      speed: speedMs,
      actualSpeed: speedMs,
      mesh,
      wheels,
      busStopTimer: 0,
      busRoute,
      colorHex,
    };
  }

  private buildCarMesh(
    group: THREE.Group,
    wheels: THREE.Mesh[],
    color: number,
    len: number,
    width: number,
    height: number,
    isTaxi = false
  ) {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

    // Chassis body
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.5, len), bodyMat);
    body.position.y = height * 0.4;
    group.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, height * 0.55, len * 0.55), cabinMat);
    cabin.position.set(0, height * 0.75, -len * 0.05);
    group.add(cabin);

    // Taxi sign
    if (isTaxi) {
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      taxiSign.position.set(0, height * 1.1, -len * 0.05);
      group.add(taxiSign);
    }

    // 4 Wheels
    const wR = height * 0.28;
    const wGeo = new THREE.CylinderGeometry(wR, wR, 0.28, 12);
    wGeo.rotateZ(Math.PI / 2);

    const positions = [
      [-width / 2, wR, len * 0.3],
      [width / 2, wR, len * 0.3],
      [-width / 2, wR, -len * 0.3],
      [width / 2, wR, -len * 0.3],
    ];

    positions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheels.push(wheel);
      group.add(wheel);
    });
  }

  private buildVanMesh(group: THREE.Group, wheels: THREE.Mesh[], color: number, len: number, width: number, height: number) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const vanBody = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.8, len), mat);
    vanBody.position.y = height * 0.5;
    group.add(vanBody);

    const wGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12).rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    [-len * 0.32, len * 0.32].forEach((wz) => {
      [-width / 2, width / 2].forEach((wx) => {
        const w = new THREE.Mesh(wGeo, wMat);
        w.position.set(wx, 0.45, wz);
        wheels.push(w);
        group.add(w);
      });
    });
  }

  private buildBusMesh(group: THREE.Group, wheels: THREE.Mesh[], color: number, len: number, width: number, height: number) {
    const busMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });

    const busBody = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.85, len), busMat);
    busBody.position.y = height * 0.55;
    group.add(busBody);

    const winStrip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.9, len * 0.88), glassMat);
    winStrip.position.y = height * 0.72;
    group.add(winStrip);

    const wGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 12).rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    [-len * 0.35, 0, len * 0.35].forEach((wz) => {
      [-width / 2, width / 2].forEach((wx) => {
        const w = new THREE.Mesh(wGeo, wMat);
        w.position.set(wx, 0.55, wz);
        wheels.push(w);
        group.add(w);
      });
    });
  }

  private buildMotorbikeMesh(group: THREE.Group, wheels: THREE.Mesh[], color: number) {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.8), bodyMat);
    frame.position.y = 0.55;
    group.add(frame);

    const wGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12).rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    const fWheel = new THREE.Mesh(wGeo, wMat);
    fWheel.position.set(0, 0.3, 0.75);
    wheels.push(fWheel);
    group.add(fWheel);

    const rWheel = new THREE.Mesh(wGeo, wMat);
    rWheel.position.set(0, 0.3, -0.75);
    wheels.push(rWheel);
    group.add(rWheel);
  }

  public update(delta: number, elapsed: number): void {
    // Traffic light cycling (12s cycle)
    this.trafficLightTimer += delta;
    const cycle = this.trafficLightTimer % 12;
    this.trafficLightPhase = cycle < 6 ? "green" : cycle < 8 ? "yellow" : "red";

    const followGapSec = cityConfig.traffic.followGapSeconds; // 2 seconds

    // Partition vehicles by lane for O(N * N/L) collision checks instead of O(N^2)
    this.laneVehiclesMap.clear();
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      let list = this.laneVehiclesMap.get(v.lane.id);
      if (!list) {
        list = [];
        this.laneVehiclesMap.set(v.lane.id, list);
      }
      list.push(v);
    }

    // Update each vehicle along its lane spline
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      // 1. Bus stop dwelling behavior (Section 6: buses stop for 8-12 seconds at stops)
      if (v.type === "bus") {
        if (v.busStopTimer > 0) {
          v.busStopTimer -= delta;
          v.actualSpeed = 0;
          continue; // stopped at bus shelter
        } else {
          // Check proximity to bus stops on this lane
          const stopOffset = v.currentDist % cityConfig.busStop.spacing;
          if (stopOffset >= 0 && stopOffset < 2.5 && Math.random() < 0.08) {
            v.busStopTimer = 8.0 + Math.random() * 4.0; // 8-12s
            v.actualSpeed = 0;
            continue;
          }
        }
      }

      // 2. 2-Second Following Gap rule against leading vehicle on the SAME lane only
      let targetSpeed = v.speed;
      const minDistance = 4.0 + v.speed * followGapSec;
      const sameLaneVehicles = this.laneVehiclesMap.get(v.lane.id);

      if (sameLaneVehicles) {
        for (let j = 0; j < sameLaneVehicles.length; j++) {
          const leader = sameLaneVehicles[j];
          if (leader.id === v.id) continue;

          let distAhead = leader.currentDist - v.currentDist;
          if (v.lane.roadType === "ring") {
            // Circular wrap for ring lanes only
            if (distAhead < 0) distAhead += v.lane.length;
          }

          if (distAhead > 0 && distAhead < minDistance) {
            targetSpeed = Math.min(targetSpeed, leader.actualSpeed * 0.85);
          }
        }
      }

      // 3. Right-of-Way & Intersection rules (Section 6: radials have priority over rings)
      if (v.lane.roadType === "ring") {
        // Slow down slightly approaching radial intersections to yield
        const distFromRadial = v.currentDist % (v.lane.length / cityConfig.radialCount);
        if (distFromRadial < 15.0) {
          targetSpeed = Math.min(targetSpeed, v.speed * 0.65);
        }
      }

      // 4. Traffic Light rule near inner ring intersections
      if (v.lane.roadType === "ring" && v.lane.ringIndex === 0) {
        if (this.trafficLightPhase === "red") {
          targetSpeed = 0;
        }
      }

      // Smooth acceleration / deceleration
      v.actualSpeed = THREE.MathUtils.lerp(v.actualSpeed, targetSpeed, 0.1);

      // Advance distance
      v.currentDist = (v.currentDist + v.actualSpeed * delta) % v.lane.length;
      v.progress = v.currentDist / v.lane.length;

      // Zero-allocation sampling directly into mesh position
      const heading = this.sampleLaneDirect(v.lane, v.progress, v.mesh.position);
      v.mesh.rotation.y = heading;

      // Rotate wheels
      const spinSpeed = (v.actualSpeed / 0.4) * delta;
      v.wheels.forEach((w) => {
        w.rotation.x += spinSpeed;
      });
    }
  }

  private sampleLaneDirect(lane: Lane, progress: number, outPos: THREE.Vector3): number {
    const pts = lane.waypoints;
    const count = pts.length;
    if (count === 0) return 0;

    const idxFloat = progress * (count - 1);
    const i = Math.floor(idxFloat);
    const frac = idxFloat - i;
    const nextI = Math.min(i + 1, count - 1);

    const p0 = pts[i];
    const p1 = pts[nextI];

    outPos.x = p0.x + (p1.x - p0.x) * frac;
    outPos.z = p0.z + (p1.z - p0.z) * frac;
    return p0.heading;
  }

  public dispose(): void {
    this.rootGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m?.dispose?.());
        } else {
          mesh.material?.dispose?.();
        }
      }
    });
    if (this.rootGroup.parent) {
      this.rootGroup.parent.remove(this.rootGroup);
    }
  }
}
