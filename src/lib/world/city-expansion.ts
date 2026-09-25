import { AABB, Position3D } from "./types";

/**
 * Expanded World Bounds:
 * A grand 100m x 44m international urban transit district:
 * - West District (x: -50 to -14): Grand Café de la Luna & Terracotta Plaza
 * - Central District (x: -14 to +14): Multi-lane Transit Boulevard, Bus Hub & Metro
 * - East District (x: +14 to +50): International Airport Terminal & Flight Promenade
 * - North Plaza: Pedestrian shops, outdoor seating, kiosks
 * - South Boulevard (z: 4.5 to 14): Multi-lane active roadway with moving cars, streetlamps, traffic signals
 */
export const EXPANDED_WORLD_BOUNDS: AABB = {
  minX: -50.0,
  maxX: 50.0,
  minZ: -18.0,
  maxZ: 26.0,
};

/**
 * Daylight & Bright Sky Atmosphere Settings
 */
export const DAYLIGHT_CONFIG = {
  isDaytime: true,
  skyColorHex: 0x60a5fa, // Bright Mediterranean sky blue
  fogColorHex: 0xbae6fd, // Soft atmospheric azure horizon fog
  fogDensity: 0.008,
  sunColorHex: 0xfffdf0, // Crisp warm solar sunlight
  sunIntensity: 1.8,
  sunPosition: { x: 28, y: 38, z: 24 },
  ambientColorHex: 0xe0f2fe, // Sky blue ambient bounce
  ambientIntensity: 0.95,
  groundHemiColorHex: 0xd4d4d8, // Ground light reflection
};

/**
 * Wide-Angle Panoramic Camera Configuration
 */
export const CAMERA_VIEW_CONFIG = {
  fov: 55, // Wide Field of View
  height: 15.0, // Elevated for full vista
  zOffset: 17.5, // Pulled back backwards to show entire district
  lookAtOffsetY: 1.2,
  smoothLerp: 0.06,
};

export interface CarSpec {
  id: string;
  initialX: number;
  laneZ: number;
  direction: 1 | -1; // 1 = Eastbound, -1 = Westbound
  speed: number;
  colorHex: number;
  colorCss: string;
  carType: "sedan" | "taxi" | "sports" | "bus" | "van";
  length: number;
  width: number;
  height: number;
}

export interface StreetLampSpec {
  id: string;
  position: Position3D;
  height: number;
  lanternColorHex: number;
}

export interface TrafficLightSpec {
  id: string;
  position: Position3D;
  initialState: "red" | "yellow" | "green";
  poleHeight: number;
}

/**
 * Road System, Street Furniture & Moving Traffic Configuration
 */
export const ROAD_SYSTEM_CONFIG = {
  roadWidth: 9.6, // Two generous lanes
  roadLength: 104.0, // Spans from -52 to +52
  roadCenterZ: 9.5, // Center of roadway
  curbNorthZ: 4.6, // Northern sidewalk curb adjacent to plaza
  curbSouthZ: 14.4, // Southern sidewalk curb
  minCarX: -54.0,
  maxCarX: 54.0,

  // Moving cars with varied types, colors and speeds
  cars: [
    {
      id: "car_taxi_east_1",
      initialX: -42.0,
      laneZ: 11.8, // Eastbound lane
      direction: 1,
      speed: 11.0,
      colorHex: 0xfacc15, // Madrid Yellow Taxi
      colorCss: "#facc15",
      carType: "taxi",
      length: 3.2,
      width: 1.5,
      height: 1.1,
    },
    {
      id: "car_sedan_east_2",
      initialX: -10.0,
      laneZ: 11.8,
      direction: 1,
      speed: 13.5,
      colorHex: 0x38bdf8, // Sky Blue Sedan
      colorCss: "#38bdf8",
      carType: "sedan",
      length: 3.4,
      width: 1.55,
      height: 1.15,
    },
    {
      id: "car_bus_west_1",
      initialX: 38.0,
      laneZ: 7.2, // Westbound lane
      direction: -1,
      speed: 8.5,
      colorHex: 0xef4444, // Red Madrid EMT City Transit Bus
      colorCss: "#ef4444",
      carType: "bus",
      length: 6.2,
      width: 1.8,
      height: 1.6,
    },
    {
      id: "car_sports_west_2",
      initialX: 6.0,
      laneZ: 7.2,
      direction: -1,
      speed: 15.0,
      colorHex: 0x10b981, // Emerald Sports Coupe
      colorCss: "#10b981",
      carType: "sports",
      length: 3.1,
      width: 1.5,
      height: 0.95,
    },
    {
      id: "car_van_east_3",
      initialX: 20.0,
      laneZ: 11.8,
      direction: 1,
      speed: 9.5,
      colorHex: 0xffffff, // White Airport Shuttle Van
      colorCss: "#ffffff",
      carType: "van",
      length: 3.8,
      width: 1.65,
      height: 1.4,
    },
  ] as CarSpec[],

  // Streetlamps lining North and South curbs
  streetLamps: [
    { id: "lamp_n_1", position: { x: -40, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_n_2", position: { x: -24, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_n_3", position: { x: -8, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_n_4", position: { x: 8, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_n_5", position: { x: 24, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_n_6", position: { x: 40, y: 0, z: 4.2 }, height: 4.8, lanternColorHex: 0xfef08a },
    // Southern sidewalk lamps
    { id: "lamp_s_1", position: { x: -30, y: 0, z: 14.8 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_s_2", position: { x: 0, y: 0, z: 14.8 }, height: 4.8, lanternColorHex: 0xfef08a },
    { id: "lamp_s_3", position: { x: 30, y: 0, z: 14.8 }, height: 4.8, lanternColorHex: 0xfef08a },
  ] as StreetLampSpec[],

  // Traffic signal stations at crosswalks
  trafficLights: [
    { id: "traffic_light_west", position: { x: -7.5, y: 0, z: 4.2 }, initialState: "green", poleHeight: 4.2 },
    { id: "traffic_light_east", position: { x: 7.5, y: 0, z: 4.2 }, initialState: "red", poleHeight: 4.2 },
    { id: "traffic_light_south", position: { x: 0.0, y: 0, z: 14.8 }, initialState: "green", poleHeight: 4.2 },
  ] as TrafficLightSpec[],
};

/**
 * Computes deterministic, smooth looping car kinematics across the road span
 */
export function computeCarPosition(car: CarSpec, time: number): Position3D {
  const minX = ROAD_SYSTEM_CONFIG.minCarX;
  const maxX = ROAD_SYSTEM_CONFIG.maxCarX;
  const span = maxX - minX;

  // Linear progression based on direction and speed
  const rawX = car.initialX + car.direction * car.speed * time;

  // True modulo arithmetic to cleanly loop within [minX, maxX]
  const wrappedX = ((((rawX - minX) % span) + span) % span) + minX;

  return {
    x: wrappedX,
    y: 0,
    z: car.laneZ,
  };
}

/**
 * Transforms 3D world coordinates (x, z) to 2D Minimap Canvas/SVG pixel coordinates (u, v)
 */
export function worldToMinimapCoords(
  worldPos: Position3D,
  worldBounds: AABB,
  mapWidth: number,
  mapHeight: number,
  padding: number = 8
): { u: number; v: number } {
  const usableWidth = Math.max(1, mapWidth - 2 * padding);
  const usableHeight = Math.max(1, mapHeight - 2 * padding);

  const spanX = Math.max(0.1, worldBounds.maxX - worldBounds.minX);
  const spanZ = Math.max(0.1, worldBounds.maxZ - worldBounds.minZ);

  // Normalize world coords to [0, 1]
  const normX = (worldPos.x - worldBounds.minX) / spanX;
  const normZ = (worldPos.z - worldBounds.minZ) / spanZ;

  // Calculate pixel position
  const rawU = padding + normX * usableWidth;
  const rawV = padding + normZ * usableHeight;

  // Clamp within map bounds
  const clampedU = Math.max(0, Math.min(mapWidth, rawU));
  const clampedV = Math.max(0, Math.min(mapHeight, rawV));

  return {
    u: clampedU,
    v: clampedV,
  };
}
