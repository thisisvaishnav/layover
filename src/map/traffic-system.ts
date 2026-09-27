import * as THREE from "three";
import type { GeneratedMap, MapBounds, RoadData } from "./map-generator";
import { buildRoadCarModel } from "./car-builder";

export type VehicleType = "bus" | "car";

export interface TrafficVehicle {
  id: string;
  group: THREE.Group;
  type: VehicleType;
  color: number;
  road: RoadData;
  direction: 1 | -1;
  speed: number;
  wheels: THREE.Mesh[];
  update(deltaSeconds: number, bounds: MapBounds): void;
}

export interface TrafficSystem {
  group: THREE.Group;
  vehicles: TrafficVehicle[];
  update(deltaSeconds: number): void;
  dispose(): void;
}

/**
 * Creates selective, smooth-moving dynamic traffic on city roads.
 * Features a selective, sparse fleet of cars with varied styling and zero buses.
 */
export function createTrafficSystem(mapData: GeneratedMap): TrafficSystem {
  const group = new THREE.Group();
  group.name = "TrafficSystem";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  function regGeo<T extends THREE.BufferGeometry>(g: T): T {
    geometries.push(g);
    return g;
  }

  function regMat<T extends THREE.Material>(m: T): T {
    materials.push(m);
    return m;
  }

  // Builder: Selective Car (Scaled 2x size via shared car builder)
  function buildCar(
    color: number,
    isTaxi = false
  ): { group: THREE.Group; wheels: THREE.Mesh[] } {
    return buildRoadCarModel({
      color,
      isTaxi,
      scale: 2.0,
      regGeo,
      regMat,
    });
  }

  // ----------------------------------------------------
  // Selective Fleet Configuration (Sparse, Natural Traffic)
  // ----------------------------------------------------
  const horizontalRoads = mapData.roads.filter((r) => r.type === "horizontal");
  const verticalRoads = mapData.roads.filter((r) => r.type === "vertical");

  // Pick prominent roads framing the central park and transit plaza
  const hRoadNorth = horizontalRoads[1] || horizontalRoads[0];
  const hRoadSouth = horizontalRoads[2] || horizontalRoads[horizontalRoads.length - 1];
  const vRoadEast = verticalRoads[2] || verticalRoads[1]; // Road in front of Bus Stop
  const vRoadWest = verticalRoads[1] || verticalRoads[0];

  const vehicles: TrafficVehicle[] = [];

  // Vehicle 1: Selective Car - Amber Orange Compact (North Avenue, Eastbound +X)
  if (hRoadNorth) {
    const { group: cGroup, wheels } = buildCar(0xf59e0b, false);
    cGroup.name = "traffic-car-amber";
    const initX = mapData.bounds.minX + 30;
    const laneZ = hRoadNorth.z + 5.0; // Eastbound lane
    cGroup.position.set(initX, 0, laneZ);
    cGroup.rotation.y = Math.PI / 2; // Face +X
    group.add(cGroup);

    vehicles.push({
      id: "car-amber",
      group: cGroup,
      type: "car",
      color: 0xf59e0b,
      road: hRoadNorth,
      direction: 1,
      speed: 16.5,
      wheels,
      update(deltaSeconds: number, bounds: MapBounds) {
        this.group.position.x += this.speed * deltaSeconds * this.direction;
        if (this.group.position.x > bounds.maxX + 22) {
          this.group.position.x = bounds.minX - 22;
        }
        const spin = (this.speed / (0.42 * 2.0)) * deltaSeconds;
        this.wheels.forEach((w) => {
          w.rotation.x += spin;
        });
      },
    });
  }

  // Vehicle 2: Selective Car - Emerald Green Sedan (Boulevard past Bus Stop & Transit Plaza, Northbound +Z)
  if (vRoadEast) {
    const { group: cGroup, wheels } = buildCar(0x059669, false);
    cGroup.name = "traffic-car-green";
    const laneX = vRoadEast.x - 5.0; // Northbound lane
    const initZ = mapData.bounds.minZ + 20;
    cGroup.position.set(laneX, 0, initZ);
    cGroup.rotation.y = 0; // Face +Z
    group.add(cGroup);

    vehicles.push({
      id: "car-green",
      group: cGroup,
      type: "car",
      color: 0x059669,
      road: vRoadEast,
      direction: 1,
      speed: 15.2,
      wheels,
      update(deltaSeconds: number, bounds: MapBounds) {
        this.group.position.z += this.speed * deltaSeconds * this.direction;
        if (this.group.position.z > bounds.maxZ + 22) {
          this.group.position.z = bounds.minZ - 22;
        }
        const spin = (this.speed / (0.42 * 2.0)) * deltaSeconds;
        this.wheels.forEach((w) => {
          w.rotation.x += spin;
        });
      },
    });
  }

  // Vehicle 3: Selective Car - Classic Yellow Taxi (South Avenue, Westbound -X)
  if (hRoadSouth) {
    const { group: cGroup, wheels } = buildCar(0xfacc15, true);
    cGroup.name = "traffic-car-taxi";
    const initX = mapData.bounds.maxX - 40;
    const laneZ = hRoadSouth.z - 5.0; // Westbound lane
    cGroup.position.set(initX, 0, laneZ);
    cGroup.rotation.y = -Math.PI / 2; // Face -X
    group.add(cGroup);

    vehicles.push({
      id: "car-taxi",
      group: cGroup,
      type: "car",
      color: 0xfacc15,
      road: hRoadSouth,
      direction: -1,
      speed: 17.5,
      wheels,
      update(deltaSeconds: number, bounds: MapBounds) {
        this.group.position.x += this.speed * deltaSeconds * this.direction;
        if (this.group.position.x < bounds.minX - 22) {
          this.group.position.x = bounds.maxX + 22;
        }
        const spin = (this.speed / (0.42 * 2.0)) * deltaSeconds;
        this.wheels.forEach((w) => {
          w.rotation.x += spin;
        });
      },
    });
  }

  // Vehicle 4: Selective Car - Crisp White Sedan (West Boulevard, Southbound -Z)
  if (vRoadWest) {
    const { group: cGroup, wheels } = buildCar(0xf8fafc, false);
    cGroup.name = "traffic-car-white";
    const laneX = vRoadWest.x + 5.0; // Southbound lane
    const initZ = mapData.bounds.maxZ - 30;
    cGroup.position.set(laneX, 0, initZ);
    cGroup.rotation.y = Math.PI; // Face -Z
    group.add(cGroup);

    vehicles.push({
      id: "car-white",
      group: cGroup,
      type: "car",
      color: 0xf8fafc,
      road: vRoadWest,
      direction: -1,
      speed: 16.8,
      wheels,
      update(deltaSeconds: number, bounds: MapBounds) {
        this.group.position.z += this.speed * deltaSeconds * this.direction;
        if (this.group.position.z < bounds.minZ - 22) {
          this.group.position.z = bounds.maxZ + 22;
        }
        const spin = (this.speed / (0.42 * 2.0)) * deltaSeconds;
        this.wheels.forEach((w) => {
          w.rotation.x += spin;
        });
      },
    });
  }

  // Vehicle 5: Selective Car - Royal Blue Compact (North Avenue, Westbound -X)
  if (hRoadNorth) {
    const { group: cGroup, wheels } = buildCar(0x2563eb, false);
    cGroup.name = "traffic-car-blue";
    const initX = mapData.bounds.maxX - 60;
    const laneZ = hRoadNorth.z - 5.0; // Westbound lane
    cGroup.position.set(initX, 0, laneZ);
    cGroup.rotation.y = -Math.PI / 2; // Face -X
    group.add(cGroup);

    vehicles.push({
      id: "car-blue",
      group: cGroup,
      type: "car",
      color: 0x2563eb,
      road: hRoadNorth,
      direction: -1,
      speed: 18.2,
      wheels,
      update(deltaSeconds: number, bounds: MapBounds) {
        this.group.position.x += this.speed * deltaSeconds * this.direction;
        if (this.group.position.x < bounds.minX - 22) {
          this.group.position.x = bounds.maxX + 22;
        }
        const spin = (this.speed / (0.42 * 2.0)) * deltaSeconds;
        this.wheels.forEach((w) => {
          w.rotation.x += spin;
        });
      },
    });
  }

  function update(deltaSeconds: number): void {
    const clampedDelta = Math.max(0, Math.min(deltaSeconds, 0.5));
    for (const v of vehicles) {
      v.update(clampedDelta, mapData.bounds);
    }
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
  }

  return {
    group,
    vehicles,
    update,
    dispose,
  };
}
