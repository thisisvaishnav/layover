import { AABB } from "./types";
import { CarSpec } from "./city-expansion";

/**
 * Dynamic Over-The-Shoulder Chase Camera Configuration
 *
 * Geometric Pitch Calculation:
 * - followDistance: 5.8m
 * - height: 2.8m (elevated above shoulder)
 * - lookAtTargetOffsetY: 1.35m (chest/head height)
 * - dy = 2.8 - 1.35 = 1.45m
 * - dz = 5.8m
 * - pitch = arctan(1.45 / 5.8) ≈ 14.04° (strictly in [10°, 15°])
 * - lookAtAheadDistance: 2.5m (projects forward along facing vector, keeping character in lower-middle screen)
 */
export const CHASE_CAMERA_CONFIG = {
  followDistance: 5.8,
  height: 2.85,
  lookAtTargetOffsetY: 1.35,
  pitchDegrees: 14.5,
  lookAtAheadDistance: 2.2,
  shoulderOffsetX: 0.35,
  fov: 56,
  smoothFollowLerp: 0.09,
  smoothLookAtLerp: 0.12,
};

/**
 * Central Park & Playground Universal Access Configuration
 * Positioned in the middle of town (X centered near 0, Z centered near -2)
 * Accessible from all surrounding blocks via 4 cardinal pathways:
 * - West: High Street & Café
 * - East: Airport Terminal & Flight Gates
 * - North: Cedar Court Apartment Towers
 * - South: Transit Boulevard & Bus Depot
 */
export const CENTRAL_PARK_CONFIG = {
  bounds: {
    minX: -13.0,
    maxX: 13.0,
    minZ: -9.0,
    maxZ: 5.0,
  } as AABB,
  pond: {
    x: 0.0,
    z: -2.0,
    radius: 3.2,
    colorHex: 0x38bdf8,
  },
  playground: {
    hasSwings: true,
    hasSlide: true,
    x: 5.5,
    z: -3.5,
  },
  entrances: {
    west: { x: -13.0, z: -2.0, label: "High Street & Café Gateway" },
    east: { x: 13.0, z: -2.0, label: "Airport Terminal Gateway" },
    north: { x: 0.0, z: -9.0, label: "Cedar Court Promenade" },
    south: { x: 0.0, z: 5.0, label: "Transit Boulevard Crosswalk" },
  },
  trees: [
    { x: -9.5, z: -6.5, radius: 1.2, height: 3.8 },
    { x: -5.0, z: -6.0, radius: 1.1, height: 3.6 },
    { x: 4.0, z: -6.5, radius: 1.3, height: 4.1 },
    { x: 9.0, z: -6.0, radius: 1.2, height: 3.9 },
    { x: -8.5, z: 2.5, radius: 1.1, height: 3.5 },
    { x: -4.0, z: 2.8, radius: 1.3, height: 4.0 },
    { x: 4.5, z: 2.6, radius: 1.2, height: 3.7 },
    { x: 9.0, z: 2.5, radius: 1.1, height: 3.6 },
    { x: -3.5, z: -2.0, radius: 0.9, height: 3.2 },
    { x: 3.5, z: -1.0, radius: 0.9, height: 3.3 },
  ],
  benches: [
    { x: -2.5, z: 0.5, rotationY: 0 },
    { x: 2.5, z: 0.5, rotationY: 0 },
    { x: -2.5, z: -4.5, rotationY: Math.PI },
    { x: 2.5, z: -4.5, rotationY: Math.PI },
  ],
};

export interface BusStopFacility {
  id: string;
  name: string;
  x: number;
  z: number;
  zone: "cafe" | "bus_stop" | "airport";
  shelterColorHex: number;
}

export interface ApartmentTowerFacility {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  floors: number;
  windowGridCols: number;
  windowGridRows: number;
  facadeColorHex: number;
}

/**
 * Town Facilities: Multiple Bus Stops and Big Multi-Story Apartment Towers
 */
export const TOWN_FACILITIES_CONFIG = {
  busStops: [
    {
      id: "bus-stop-central",
      name: "Maple Central Station Bay",
      x: 0.0,
      z: 4.8,
      zone: "bus_stop",
      shelterColorHex: 0x0284c7,
    },
    {
      id: "bus-stop-west",
      name: "High Street & Café Stop",
      x: -18.0,
      z: 4.8,
      zone: "cafe",
      shelterColorHex: 0xd97706,
    },
    {
      id: "bus-stop-east",
      name: "Airport Concourse Terminal Stop",
      x: 18.0,
      z: 4.8,
      zone: "airport",
      shelterColorHex: 0x0ea5e9,
    },
  ] as BusStopFacility[],

  apartmentTowers: [
    {
      id: "tower-cedar-west",
      name: "Cedar Court West Tower",
      x: -6.5,
      z: -14.5,
      width: 10.0,
      depth: 7.5,
      height: 22.0,
      floors: 7,
      windowGridCols: 4,
      windowGridRows: 7,
      facadeColorHex: 0x334155,
    },
    {
      id: "tower-cedar-east",
      name: "Cedar Court East Tower",
      x: 6.5,
      z: -14.5,
      width: 10.0,
      depth: 7.5,
      height: 18.5,
      floors: 6,
      windowGridCols: 4,
      windowGridRows: 6,
      facadeColorHex: 0x475569,
    },
  ] as ApartmentTowerFacility[],
};

/**
 * Dense Vehicular Traffic: 9 active cars, buses, and vans across two lanes
 */
export const DENSE_TRAFFIC_CONFIG = {
  cars: [
    {
      id: "dense_bus_1",
      initialX: -45.0,
      laneZ: 11.8,
      direction: 1,
      speed: 8.5,
      colorHex: 0xeab308,
      colorCss: "#eab308",
      carType: "bus",
      length: 5.6,
      width: 1.8,
      height: 1.9,
    },
    {
      id: "dense_taxi_1",
      initialX: -26.0,
      laneZ: 11.8,
      direction: 1,
      speed: 12.0,
      colorHex: 0xfacc15,
      colorCss: "#facc15",
      carType: "taxi",
      length: 3.2,
      width: 1.5,
      height: 1.1,
    },
    {
      id: "dense_sedan_blue",
      initialX: -6.0,
      laneZ: 11.8,
      direction: 1,
      speed: 13.5,
      colorHex: 0x3b82f6,
      colorCss: "#3b82f6",
      carType: "sedan",
      length: 3.4,
      width: 1.55,
      height: 1.15,
    },
    {
      id: "dense_coupe_red",
      initialX: 18.0,
      laneZ: 11.8,
      direction: 1,
      speed: 15.0,
      colorHex: 0xef4444,
      colorCss: "#ef4444",
      carType: "sports",
      length: 3.0,
      width: 1.45,
      height: 0.95,
    },
    {
      id: "dense_van_white",
      initialX: 42.0,
      laneZ: 7.2,
      direction: -1,
      speed: 9.0,
      colorHex: 0xf8fafc,
      colorCss: "#f8fafc",
      carType: "van",
      length: 4.2,
      width: 1.7,
      height: 1.5,
    },
    {
      id: "dense_hybrid_green",
      initialX: 20.0,
      laneZ: 7.2,
      direction: -1,
      speed: 11.5,
      colorHex: 0x10b981,
      colorCss: "#10b981",
      carType: "sedan",
      length: 3.2,
      width: 1.5,
      height: 1.1,
    },
    {
      id: "dense_airport_bus",
      initialX: -2.0,
      laneZ: 7.2,
      direction: -1,
      speed: 8.0,
      colorHex: 0x6366f1,
      colorCss: "#6366f1",
      carType: "bus",
      length: 5.8,
      width: 1.85,
      height: 1.95,
    },
    {
      id: "dense_exec_sedan",
      initialX: -24.0,
      laneZ: 7.2,
      direction: -1,
      speed: 13.0,
      colorHex: 0x1e293b,
      colorCss: "#1e293b",
      carType: "sedan",
      length: 3.5,
      width: 1.55,
      height: 1.1,
    },
    {
      id: "dense_hatchback_orange",
      initialX: 34.0,
      laneZ: 11.8,
      direction: 1,
      speed: 11.0,
      colorHex: 0xf97316,
      colorCss: "#f97316",
      carType: "sports",
      length: 3.0,
      width: 1.45,
      height: 1.05,
    },
  ] as CarSpec[],
};

export interface PedestrianSpec {
  id: string;
  name: string;
  startX: number;
  endX: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  shirtColorHex: number;
  pantsColorHex: number;
  colorCss: string;
}

/**
 * Footpath Pedestrians: Citizens walking along north and south sidewalks
 */
export const PEDESTRIAN_CONFIG = {
  pedestrians: [
    {
      id: "ped_commuter_maya",
      name: "Commuter Maya",
      startX: -22.0,
      endX: 22.0,
      z: 4.8,
      speed: 1.4,
      direction: 1,
      shirtColorHex: 0x3b82f6,
      pantsColorHex: 0x1e293b,
      colorCss: "#3b82f6",
    },
    {
      id: "ped_jogger_alex",
      name: "Jogger Alex",
      startX: 22.0,
      endX: -22.0,
      z: 4.8,
      speed: 2.2,
      direction: -1,
      shirtColorHex: 0xef4444,
      pantsColorHex: 0x0f172a,
      colorCss: "#ef4444",
    },
    {
      id: "ped_student_leo",
      name: "Student Leo",
      startX: -18.0,
      endX: 18.0,
      z: 14.4,
      speed: 1.2,
      direction: 1,
      shirtColorHex: 0x10b981,
      pantsColorHex: 0x334155,
      colorCss: "#10b981",
    },
    {
      id: "ped_tourist_sofia",
      name: "Tourist Sofia",
      startX: 18.0,
      endX: -18.0,
      z: 14.4,
      speed: 1.1,
      direction: -1,
      shirtColorHex: 0xa855f7,
      pantsColorHex: 0x475569,
      colorCss: "#a855f7",
    },
    {
      id: "ped_local_david",
      name: "Local David",
      startX: -15.0,
      endX: 15.0,
      z: 4.8,
      speed: 1.3,
      direction: 1,
      shirtColorHex: 0xf59e0b,
      pantsColorHex: 0x1e293b,
      colorCss: "#f59e0b",
    },
  ] as PedestrianSpec[],
};

/**
 * Computes deterministic looping position for walking pedestrians on sidewalks
 */
export function computePedestrianPosition(
  ped: PedestrianSpec,
  elapsedSeconds: number
): { x: number; y: number; z: number; rotationY: number } {
  const span = Math.abs(ped.endX - ped.startX);
  if (span === 0) {
    return { x: ped.startX, y: 0, z: ped.z, rotationY: 0 };
  }
  const minX = Math.min(ped.startX, ped.endX);
  const maxX = Math.max(ped.startX, ped.endX);

  if (ped.direction > 0) {
    const raw = ped.startX + ped.speed * elapsedSeconds;
    const wrapped = ((((raw - minX) % span) + span) % span) + minX;
    return {
      x: wrapped,
      y: 0,
      z: ped.z,
      rotationY: Math.PI / 2,
    };
  } else {
    const raw = ped.startX - ped.speed * elapsedSeconds;
    const wrapped = maxX - ((((maxX - raw) % span) + span) % span);
    return {
      x: wrapped,
      y: 0,
      z: ped.z,
      rotationY: -Math.PI / 2,
    };
  }
}

export interface HumanKinematics {
  breathingY: number;
  leftArmRelaxAngle: number;
  leftLegRotX: number;
  rightLegRotX: number;
  leftArmRotX: number;
  rightArmRotX: number;
  torsoRollSway: number;
  strideBounceY: number;
}

/**
 * Natural Human Avatar Kinematics
 * Models:
 * - Idle breathing expansion and relaxed forward arm posture
 * - Walking leg swing opposition
 * - Natural reciprocal arm swing
 * - Lateral weight transfer (torso roll sway)
 * - Ground push-off stride bounce
 */
export function computeHumanAvatarKinematics(
  isMoving: boolean,
  speed: number,
  elapsedTime: number
): HumanKinematics {
  const naturalArmRelax = 0.09;

  if (!isMoving) {
    // Subtle natural human breathing (chest & head rise/fall)
    const breathingY = Math.cos(elapsedTime * 2.5) * 0.012 + 0.008;

    return {
      breathingY,
      leftArmRelaxAngle: naturalArmRelax,
      leftLegRotX: 0,
      rightLegRotX: 0,
      leftArmRotX: naturalArmRelax,
      rightArmRotX: naturalArmRelax,
      torsoRollSway: 0,
      strideBounceY: 0,
    };
  }

  // Dynamic human walking cadence factored by speed
  const cadence = 7.0 * Math.max(0.2, speed);
  const stridePhase = elapsedTime * cadence;
  const legSwingAmp = 0.65;
  const armSwingAmp = 0.45;

  const leftLegRotX = Math.sin(stridePhase) * legSwingAmp;
  const rightLegRotX = -Math.sin(stridePhase) * legSwingAmp;

  // Reciprocal arm swing opposite to legs with resting angle bias
  const leftArmRotX = -Math.sin(stridePhase) * armSwingAmp + naturalArmRelax;
  const rightArmRotX = Math.sin(stridePhase) * armSwingAmp + naturalArmRelax;

  // Lateral weight-transfer sway as hips/shoulders shift over the planted foot
  const torsoRollSway = Math.sin(stridePhase) * 0.035;

  // Stride bounce (pushes up twice per full leg cycle)
  const strideBounceY = Math.sin(stridePhase) * Math.sin(stridePhase) * 0.045;

  return {
    breathingY: 0,
    leftArmRelaxAngle: naturalArmRelax,
    leftLegRotX,
    rightLegRotX,
    leftArmRotX,
    rightArmRotX,
    torsoRollSway,
    strideBounceY,
  };
}

export interface DistrictBlockSpec {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  icon: string;
  bounds: AABB;
}

/**
 * Town District Blocks matching the Maple Hollow reference layout:
 * - Central Elm Park & Pond in middle
 * - High Street Shops on West
 * - Multi-story Cedar Court Apartments on North
 * - Central Station & Transit on South
 * - Airport Terminal on East
 * - Residential Suburban Quarters & Civic Center
 */
export const MAPLE_HOLLOW_DISTRICT_BLOCKS: DistrictBlockSpec[] = [
  {
    id: "district-green-space",
    name: "GREEN SPACE",
    subtitle: "Elm Park, Playground & Pond",
    color: "#10b981",
    icon: "🌳",
    bounds: { minX: -13.0, maxX: 13.0, minZ: -9.0, maxZ: 5.0 },
  },
  {
    id: "district-high-street",
    name: "HIGH STREET",
    subtitle: "Boutiques, Bakery & Madrid Café",
    color: "#f59e0b",
    icon: "☕",
    bounds: { minX: -50.0, maxX: -13.0, minZ: -9.0, maxZ: 5.0 },
  },
  {
    id: "district-apartments",
    name: "APARTMENTS",
    subtitle: "Cedar Court Living Towers",
    color: "#8b5cf6",
    icon: "🏢",
    bounds: { minX: -14.0, maxX: 14.0, minZ: -18.0, maxZ: -9.0 },
  },
  {
    id: "district-transit",
    name: "TRANSIT",
    subtitle: "Central Depot & Bus Hub",
    color: "#06b6d4",
    icon: "🚏",
    bounds: { minX: -50.0, maxX: 50.0, minZ: 5.0, maxZ: 14.5 },
  },
  {
    id: "district-airport",
    name: "AIRPORT",
    subtitle: "Terminal Gates & Helipad",
    color: "#38bdf8",
    icon: "✈️",
    bounds: { minX: 13.0, maxX: 50.0, minZ: -9.0, maxZ: 5.0 },
  },
  {
    id: "district-residential",
    name: "RESIDENTIAL",
    subtitle: "Suburban Neighborhood",
    color: "#ec4899",
    icon: "🏡",
    bounds: { minX: -50.0, maxX: -14.0, minZ: -18.0, maxZ: -9.0 },
  },
  {
    id: "district-civic",
    name: "CIVIC",
    subtitle: "Town Hall & Plaza",
    color: "#6366f1",
    icon: "🏛️",
    bounds: { minX: 14.0, maxX: 50.0, minZ: -18.0, maxZ: -9.0 },
  },
];
