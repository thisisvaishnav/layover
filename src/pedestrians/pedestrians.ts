import * as THREE from "three";
import { CitySubsystem } from "@/city/types";
import { roadGraph, FootpathWaypoint } from "@/roads/road-graph";
import { computePedestrianKinematics } from "@/lib/world/avatar-kinematics";
import cityConfig from "@/city-config.json";

export interface ActivePedestrian {
  id: string;
  currentWaypoint: FootpathWaypoint;
  targetWaypoint: FootpathWaypoint;
  position: { x: number; z: number };
  heading: number;
  speed: number; // 1.2 - 1.5 m/s +/- 10%
  state: "walking" | "idle" | "crossing";
  idleTimer: number; // 1 - 3 seconds
  crossingTimer: number;
  phaseOffset: number;
  mesh: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
}

export class Pedestrians implements CitySubsystem {
  public readonly name = "Pedestrians";
  private rootGroup: THREE.Group = new THREE.Group();
  public pedestrians: ActivePedestrian[] = [];

  public init(scene: THREE.Scene): void {
    this.rootGroup.name = "CityPedestrians";
    scene.add(this.rootGroup);

    this.spawnPedestrians();
  }

  /**
   * Spawns exactly targetCount (30) active pedestrians along the footpath network,
   * weighted towards the park, shops, and bus stops per Section 7.
   */
  private spawnPedestrians(): void {
    const targetCount = cityConfig.pedestrians.targetCount; // 30
    const footpaths = roadGraph.footpaths;
    if (footpaths.length === 0) return;

    // Filter footpaths with bias toward park and inner ring
    const preferredFootpaths = footpaths.filter(
      (fp) => fp.blockType === "park" || fp.blockType === "inner"
    );
    const pool = preferredFootpaths.length > 0 ? preferredFootpaths : footpaths;

    for (let i = 0; i < targetCount; i++) {
      // Pick random starting node
      const startNode = pool[i % pool.length];
      const targetNode = this.pickNextWaypoint(startNode);

      // Walk speed 1.2 - 1.5 m/s with +/- 10% variance (1.08 - 1.65 m/s)
      const [minS, maxS] = cityConfig.pedestrians.walkSpeedMs;
      const baseSpeed = minS + Math.random() * (maxS - minS);
      const speed = baseSpeed * (0.9 + Math.random() * 0.2);

      const ped = this.createPedestrian(`ped_${i}`, startNode, targetNode, speed, i);
      this.pedestrians.push(ped);
      this.rootGroup.add(ped.mesh);
    }
  }

  private pickNextWaypoint(curr: FootpathWaypoint): FootpathWaypoint {
    if (curr.neighbors.length > 0) {
      const nId = curr.neighbors[Math.floor(Math.random() * curr.neighbors.length)];
      const next = roadGraph.footpathLookup.get(nId);
      if (next) return next;
    }
    // Fallback: pick any close footpath waypoint
    const all = roadGraph.footpaths;
    return all[Math.floor(Math.random() * all.length)];
  }

  private createPedestrian(
    id: string,
    startNode: FootpathWaypoint,
    targetNode: FootpathWaypoint,
    speed: number,
    idx: number
  ): ActivePedestrian {
    const mesh = new THREE.Group();
    mesh.position.set(startNode.position.x, 0, startNode.position.z);

    // Humanoid materials (diverse clothing colors)
    const shirtColors = [0x3b82f6, 0xef4444, 0x10b981, 0x8b5cf6, 0xf97316, 0xec4899, 0x06b6d4];
    const pantsColors = [0x1e293b, 0x334155, 0x475569, 0x27272a, 0x18181b];
    const skinTones = [0xfcd34d, 0xfbbf24, 0xd97706, 0xb45309, 0x78350f];

    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColors[idx % shirtColors.length],
      roughness: 0.8,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColors[idx % pantsColors.length],
      roughness: 0.9,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinTones[idx % skinTones.length],
      roughness: 0.6,
    });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });

    // Torso (0.5m x 0.3m x 0.25m) at human scale (adult height ~1.75m)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.25), shirtMat);
    torso.position.y = 1.15;
    mesh.add(torso);

    // Head (0.24m)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
    head.position.y = 1.62;
    mesh.add(head);

    // Left Leg Pivot
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.13, 0.85, 0);
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.16), pantsMat);
    lLegMesh.position.y = -0.375;
    leftLeg.add(lLegMesh);
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.25), shoeMat);
    lShoe.position.set(0, -0.72, 0.05);
    leftLeg.add(lShoe);
    mesh.add(leftLeg);

    // Right Leg Pivot
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.13, 0.85, 0);
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.16), pantsMat);
    rLegMesh.position.y = -0.375;
    rightLeg.add(rLegMesh);
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.25), shoeMat);
    rShoe.position.set(0, -0.72, 0.05);
    rightLeg.add(rShoe);
    mesh.add(rightLeg);

    // Left Arm Pivot
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.28, 1.38, 0);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), shirtMat);
    lArmMesh.position.y = -0.275;
    leftArm.add(lArmMesh);
    mesh.add(leftArm);

    // Right Arm Pivot
    const rightArm = new THREE.Group();
    rightArm.position.set(0.28, 1.38, 0);
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), shirtMat);
    rArmMesh.position.y = -0.275;
    rightArm.add(rArmMesh);
    mesh.add(rightArm);

    const dx = targetNode.position.x - startNode.position.x;
    const dz = targetNode.position.z - startNode.position.z;
    const heading = Math.atan2(dx, dz);

    return {
      id,
      currentWaypoint: startNode,
      targetWaypoint: targetNode,
      position: { x: startNode.position.x, z: startNode.position.z },
      heading,
      speed,
      state: "walking",
      idleTimer: 0,
      crossingTimer: 0,
      phaseOffset: (idx * 1.37) % (Math.PI * 2),
      mesh,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
    };
  }

  public update(delta: number, elapsed: number): void {
    const [minIdle, maxIdle] = cityConfig.pedestrians.idlePauseSeconds;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];

      // 1. Idle state behavior (Section 7: 1-3 seconds idle pauses at irregular points)
      if (p.state === "idle") {
        p.idleTimer -= delta;
        // Damped idle pose
        const idleKin = computePedestrianKinematics(false, elapsed, 0);
        this.applyKinematics(p, idleKin, 0);

        if (p.idleTimer <= 0) {
          p.state = "walking";
          p.targetWaypoint = this.pickNextWaypoint(p.currentWaypoint);
        }
        continue;
      }

      // 2. Crossing wait behavior (Section 7: wait at marked crossings)
      if (p.state === "crossing") {
        p.crossingTimer -= delta;
        const idleKin = computePedestrianKinematics(false, elapsed, 0);
        this.applyKinematics(p, idleKin, 0);

        if (p.crossingTimer <= 0) {
          p.state = "walking";
          p.targetWaypoint = this.pickNextWaypoint(p.currentWaypoint);
        }
        continue;
      }

      // 3. Movement towards target waypoint
      const tx = p.targetWaypoint.position.x;
      const tz = p.targetWaypoint.position.z;
      const dx = tx - p.position.x;
      const dz = tz - p.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.0) {
        // Reached waypoint
        p.currentWaypoint = p.targetWaypoint;

        // Check if this was a crossing point
        if (p.currentWaypoint.isCrossing && Math.random() < 0.4) {
          p.state = "crossing";
          p.crossingTimer = 2.0 + Math.random() * 2.0;
          continue;
        }

        // Random idle pause (window shopping / bus stop wait / park bench)
        if (Math.random() < 0.15) {
          p.state = "idle";
          p.idleTimer = minIdle + Math.random() * (maxIdle - minIdle);
          continue;
        }

        p.targetWaypoint = this.pickNextWaypoint(p.currentWaypoint);
      } else {
        // Move along vector
        const dirX = dx / dist;
        const dirZ = dz / dist;

        // Collision avoidance with other pedestrians (steer around)
        let steerX = dirX;
        let steerZ = dirZ;

        for (let j = 0; j < this.pedestrians.length; j++) {
          if (i === j) continue;
          const other = this.pedestrians[j];
          const ox = other.position.x - p.position.x;
          const oz = other.position.z - p.position.z;
          const dOther = Math.hypot(ox, oz);
          if (dOther < 1.2 && dOther > 0.05) {
            // Repel perpendicular
            steerX -= (ox / dOther) * 0.4;
            steerZ -= (oz / dOther) * 0.4;
          }
        }

        const norm = Math.hypot(steerX, steerZ);
        if (norm > 0.01) {
          p.position.x += (steerX / norm) * p.speed * delta;
          p.position.z += (steerZ / norm) * p.speed * delta;
          p.heading = Math.atan2(steerX, steerZ);
        }

        p.mesh.position.set(p.position.x, 0, p.position.z);
        p.mesh.rotation.y = p.heading;

        // Procedural kinematics with sinusoidal bob using avatar-kinematics.ts (per-pedestrian phase)
        const kin = computePedestrianKinematics(true, elapsed + p.phaseOffset, p.speed);
        this.applyKinematics(p, kin, kin.bounceY);
      }
    }
  }

  private applyKinematics(
    p: ActivePedestrian,
    kin: { leftLegRotX: number; rightLegRotX: number; leftArmRotX: number; rightArmRotX: number },
    bounceY: number
  ): void {
    p.leftLeg.rotation.x = kin.leftLegRotX;
    p.rightLeg.rotation.x = kin.rightLegRotX;
    p.leftArm.rotation.x = kin.leftArmRotX;
    p.rightArm.rotation.x = kin.rightArmRotX;
    p.mesh.position.y = bounceY;
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
