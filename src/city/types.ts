import * as THREE from "three";

export interface CityConfig {
  world: { width: number; height: number; units: string };
  park: { center: [number, number]; radius: number };
  rings: number[];
  radialCount: number;
  roadWidths: { ring: number; radial: number };
  footpathWidth: number;
  busStop: { spacing: number; shelterFootprint: [number, number] };
  busRoutes: string[];
  buildings: Record<
    string,
    {
      footprint: [number, number];
      height?: number;
      floors?: number;
      count: number;
      ring: "inner" | "middle" | "outer";
    }
  >;
  traffic: {
    targetDensity: number;
    mix: { car: number; taxi: number; van: number; bus: number; motorbike: number };
    speedKmh: { radial: [number, number]; ring: [number, number]; bus: number };
    followGapSeconds: number;
  };
  pedestrians: {
    targetCount: number;
    walkSpeedMs: [number, number];
    idlePauseSeconds: [number, number];
  };
}

export interface CitySubsystem {
  readonly name: string;
  init(scene: THREE.Scene): void;
  update(delta: number, elapsed: number): void;
  dispose(): void;
}
