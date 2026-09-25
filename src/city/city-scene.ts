import * as THREE from "three";
import { CitySubsystem } from "./types";
import { RoadNetwork } from "@/roads/road-network";
import { Park } from "@/park/park";
import { Buildings } from "@/buildings/buildings";
import { Traffic } from "@/traffic/traffic";
import { Pedestrians } from "@/pedestrians/pedestrians";
import { roadGraph, CityRoadGraph } from "@/roads/road-graph";

export class CityScene implements CitySubsystem {
  public readonly name = "CityScene";
  public readonly roadGraph: CityRoadGraph = roadGraph;

  // The 5 modular subsystems
  public readonly roads: RoadNetwork;
  public readonly park: Park;
  public readonly buildings: Buildings;
  public readonly traffic: Traffic;
  public readonly pedestrians: Pedestrians;

  private subsystems: CitySubsystem[] = [];
  private isInitialized = false;

  constructor() {
    this.roads = new RoadNetwork();
    this.park = new Park();
    this.buildings = new Buildings();
    this.traffic = new Traffic();
    this.pedestrians = new Pedestrians();

    this.subsystems = [
      this.roads,
      this.park,
      this.buildings,
      this.traffic,
      this.pedestrians,
    ];
  }

  public init(scene: THREE.Scene): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize subsystems in dependency order
    this.subsystems.forEach((sub) => {
      sub.init(scene);
    });
  }

  public update(delta: number, elapsed: number): void {
    if (!this.isInitialized) return;
    this.subsystems.forEach((sub) => {
      sub.update(delta, elapsed);
    });
  }

  public dispose(): void {
    this.subsystems.forEach((sub) => {
      sub.dispose();
    });
    this.isInitialized = false;
  }
}
