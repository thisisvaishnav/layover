import * as THREE from "three";
import { CitySubsystem } from "@/city/types";
import { roadGraph, CityRoadGraph } from "./road-graph";

export class RoadNetwork implements CitySubsystem {
  public readonly name = "RoadNetwork";
  public readonly graph: CityRoadGraph = roadGraph;
  private rootGroup: THREE.Group = new THREE.Group();
  private trafficLightMeshes: { mesh: THREE.Group; lightMesh: THREE.Mesh }[] = [];
  private trafficLightTimer = 0;

  public init(scene: THREE.Scene): void {
    this.rootGroup.name = "RoadNetwork";
    scene.add(this.rootGroup);

    this.buildTerrain();
    this.buildRingRoads();
    this.buildRadialRoads();
    this.buildIntersections();
  }

  private buildTerrain(): void {
    const { width, height } = this.graph.config.world;
    const [cx, cz] = this.graph.config.park.center;

    // Grand 2000m x 2000m terrain ground plane
    const terrainGeo = new THREE.PlaneGeometry(width, height, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x3f6212, // Rich organic green turf
      roughness: 0.9,
      metalness: 0.05,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(cx, -0.05, cz);
    terrainMesh.receiveShadow = true;
    this.rootGroup.add(terrainMesh);
  }

  private buildRingRoads(): void {
    const [cx, cz] = this.graph.config.park.center;
    const ringRadii = this.graph.config.rings;
    const roadWidth = this.graph.config.roadWidths.ring; // 12m
    const fpWidth = this.graph.config.footpathWidth; // 2.5m

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Dark asphalt
      roughness: 0.85,
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8, // Light concrete pavement
      roughness: 0.7,
    });

    const vergeMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f, // Earthy green verge
      roughness: 0.95,
    });

    const markingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    ringRadii.forEach((radius) => {
      // 1. Asphalt roadway (12m width -> r - 6 to r + 6)
      const roadGeo = new THREE.RingGeometry(radius - roadWidth / 2, radius + roadWidth / 2, 96);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
      roadMesh.position.set(cx, 0.01, cz);
      this.rootGroup.add(roadMesh);

      // 2. Inner Verge (0.5m) and Footpath (2.5m)
      const innerVergeGeo = new THREE.RingGeometry(radius - roadWidth / 2 - 0.5, radius - roadWidth / 2, 96);
      innerVergeGeo.rotateX(-Math.PI / 2);
      const innerVerge = new THREE.Mesh(innerVergeGeo, vergeMat);
      innerVerge.position.set(cx, 0.02, cz);
      this.rootGroup.add(innerVerge);

      const innerFpGeo = new THREE.RingGeometry(radius - roadWidth / 2 - 0.5 - fpWidth, radius - roadWidth / 2 - 0.5, 96);
      innerFpGeo.rotateX(-Math.PI / 2);
      const innerFp = new THREE.Mesh(innerFpGeo, sidewalkMat);
      innerFp.position.set(cx, 0.04, cz);
      this.rootGroup.add(innerFp);

      // 3. Outer Verge (0.5m) and Footpath (2.5m)
      const outerVergeGeo = new THREE.RingGeometry(radius + roadWidth / 2, radius + roadWidth / 2 + 0.5, 96);
      outerVergeGeo.rotateX(-Math.PI / 2);
      const outerVerge = new THREE.Mesh(outerVergeGeo, vergeMat);
      outerVerge.position.set(cx, 0.02, cz);
      this.rootGroup.add(outerVerge);

      const outerFpGeo = new THREE.RingGeometry(radius + roadWidth / 2 + 0.5, radius + roadWidth / 2 + 0.5 + fpWidth, 96);
      outerFpGeo.rotateX(-Math.PI / 2);
      const outerFp = new THREE.Mesh(outerFpGeo, sidewalkMat);
      outerFp.position.set(cx, 0.04, cz);
      this.rootGroup.add(outerFp);

      // 4. Center lane divider dashed markings
      const dashSegments = 48;
      for (let d = 0; d < dashSegments; d++) {
        const theta = (d * 2 * Math.PI) / dashSegments;
        const dashGeo = new THREE.PlaneGeometry(0.2, 2.5);
        dashGeo.rotateX(-Math.PI / 2);
        const dash = new THREE.Mesh(dashGeo, markingMat);
        dash.position.set(cx + radius * Math.cos(theta), 0.03, cz + radius * Math.sin(theta));
        dash.rotation.y = -theta;
        this.rootGroup.add(dash);
      }
    });
  }

  private buildRadialRoads(): void {
    const [cx, cz] = this.graph.config.park.center;
    const innerR = this.graph.config.rings[0];
    const outerR = this.graph.config.world.width / 2;
    const length = outerR - innerR; // 780m
    const roadWidth = this.graph.config.roadWidths.radial; // 14m
    const fpWidth = this.graph.config.footpathWidth; // 2.5m

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.85,
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.7,
    });

    const vergeMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.95,
    });

    const yellowCenterMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15, // Double yellow center line
    });

    for (let radIdx = 0; radIdx < this.graph.config.radialCount; radIdx++) {
      const angle = (radIdx * 2 * Math.PI) / this.graph.config.radialCount;
      const group = new THREE.Group();
      group.position.set(cx, 0, cz);
      group.rotation.y = -angle;

      const midDist = innerR + length / 2;

      // 1. Roadway Asphalt (14m width)
      const roadGeo = new THREE.PlaneGeometry(roadWidth, length);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
      roadMesh.position.set(0, 0.015, midDist);
      group.add(roadMesh);

      // 2. Yellow center divider
      const lineGeo = new THREE.PlaneGeometry(0.25, length);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, yellowCenterMat);
      lineMesh.position.set(0, 0.025, midDist);
      group.add(lineMesh);

      // 3. Verges (0.5m)
      const vergeGeo = new THREE.PlaneGeometry(0.5, length);
      vergeGeo.rotateX(-Math.PI / 2);

      const leftVerge = new THREE.Mesh(vergeGeo, vergeMat);
      leftVerge.position.set(-roadWidth / 2 - 0.25, 0.02, midDist);
      group.add(leftVerge);

      const rightVerge = new THREE.Mesh(vergeGeo, vergeMat);
      rightVerge.position.set(roadWidth / 2 + 0.25, 0.02, midDist);
      group.add(rightVerge);

      // 4. Sidewalks (2.5m)
      const fpGeo = new THREE.PlaneGeometry(fpWidth, length);
      fpGeo.rotateX(-Math.PI / 2);

      const leftFp = new THREE.Mesh(fpGeo, sidewalkMat);
      leftFp.position.set(-roadWidth / 2 - 0.5 - fpWidth / 2, 0.04, midDist);
      group.add(leftFp);

      const rightFp = new THREE.Mesh(fpGeo, sidewalkMat);
      rightFp.position.set(roadWidth / 2 + 0.5 + fpWidth / 2, 0.04, midDist);
      group.add(rightFp);

      this.rootGroup.add(group);
    }
  }

  private buildIntersections(): void {
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    this.graph.intersections.forEach((inter) => {
      // Zebra crossing markers
      const crossingGroup = new THREE.Group();
      crossingGroup.position.set(inter.center.x, 0.035, inter.center.z);
      crossingGroup.rotation.y = -inter.angle;

      const stripeCount = 6;
      for (let s = 0; s < stripeCount; s++) {
        const stripeGeo = new THREE.PlaneGeometry(0.5, 3.0);
        stripeGeo.rotateX(-Math.PI / 2);
        const stripe = new THREE.Mesh(stripeGeo, zebraMat);
        stripe.position.set((s - stripeCount / 2 + 0.5) * 1.0, 0, 7.5);
        crossingGroup.add(stripe);
      }
      this.rootGroup.add(crossingGroup);

      // Traffic light at 8 inner intersections
      if (inter.hasTrafficLight) {
        const tlGroup = new THREE.Group();
        tlGroup.position.set(inter.center.x + 8.0 * Math.cos(inter.angle + 0.1), 0, inter.center.z + 8.0 * Math.sin(inter.angle + 0.1));

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 5.0, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.5;
        tlGroup.add(pole);

        // Light box
        const boxGeo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(0, 4.4, 0);
        tlGroup.add(box);

        // Lamp sphere
        const lampGeo = new THREE.SphereGeometry(0.16, 12, 12);
        const lampMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(0, 4.4, 0.22);
        tlGroup.add(lamp);

        this.trafficLightMeshes.push({ mesh: tlGroup, lightMesh: lamp });
        this.rootGroup.add(tlGroup);
      }
    });
  }

  public update(delta: number, elapsed: number): void {
    // Traffic light cycling (green -> yellow -> red)
    this.trafficLightTimer += delta;
    const cycle = this.trafficLightTimer % 12; // 12-second full cycle
    const colorHex = cycle < 6 ? 0x10b981 : cycle < 8 ? 0xfacc15 : 0xef4444;

    this.trafficLightMeshes.forEach(({ lightMesh }) => {
      (lightMesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    });
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
