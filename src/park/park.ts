import * as THREE from "three";
import { CitySubsystem } from "@/city/types";
import cityConfig from "@/city-config.json";

export class Park implements CitySubsystem {
  public readonly name = "Park";
  private rootGroup: THREE.Group = new THREE.Group();
  private waterMesh: THREE.Mesh | null = null;
  private swingsSeat: THREE.Group | null = null;

  public init(scene: THREE.Scene): void {
    this.rootGroup.name = "CentralPark";
    scene.add(this.rootGroup);

    this.buildParkTerrain();
    this.buildPaths();
    this.buildPond();
    this.buildPlayground();
    this.buildBenches();
    this.buildTrees();
  }

  private buildParkTerrain(): void {
    const [cx, cz] = cityConfig.park.center;
    const radius = cityConfig.park.radius; // 180m

    // Circular park grounds
    const parkGeo = new THREE.CircleGeometry(radius, 64);
    parkGeo.rotateX(-Math.PI / 2);
    const parkMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Fresh lush emerald park grass
      roughness: 0.85,
    });
    const parkMesh = new THREE.Mesh(parkGeo, parkMat);
    parkMesh.position.set(cx, 0.02, cz);
    parkMesh.receiveShadow = true;
    this.rootGroup.add(parkMesh);
  }

  private buildPaths(): void {
    const [cx, cz] = cityConfig.park.center;
    const radius = cityConfig.park.radius; // 180m
    const innerRingR = cityConfig.rings[0]; // 220m

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xfde047, // Golden crushed gravel walking trail
      roughness: 0.9,
    });

    // 1. Perimeter circular path inside park boundary (radius 165m)
    const perimGeo = new THREE.RingGeometry(162, 168, 64);
    perimGeo.rotateX(-Math.PI / 2);
    const perimPath = new THREE.Mesh(perimGeo, pathMat);
    perimPath.position.set(cx, 0.03, cz);
    this.rootGroup.add(perimPath);

    // 2. Inner circular promenade around the pond (radius 45m)
    const pondPromGeo = new THREE.RingGeometry(42, 48, 48);
    pondPromGeo.rotateX(-Math.PI / 2);
    const pondProm = new THREE.Mesh(pondPromGeo, pathMat);
    pondProm.position.set(cx, 0.03, cz);
    this.rootGroup.add(pondProm);

    // 3. 8 Radial connector pathways extending from pond promenade (45m) out to inner ring road (220m)
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      const pathLen = innerRingR - 45;
      const pathGeo = new THREE.PlaneGeometry(4.0, pathLen);
      pathGeo.rotateX(-Math.PI / 2);

      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      const midDist = 45 + pathLen / 2;
      pathMesh.position.set(cx + midDist * Math.cos(angle), 0.032, cz + midDist * Math.sin(angle));
      pathMesh.rotation.y = -angle + Math.PI / 2;
      this.rootGroup.add(pathMesh);
    }
  }

  private buildPond(): void {
    const [cx, cz] = cityConfig.park.center;
    const pondRadius = 32.0;

    // Pond Basin
    const pondGeo = new THREE.CircleGeometry(pondRadius, 48);
    pondGeo.rotateX(-Math.PI / 2);
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Serene blue lake water
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(pondGeo, pondMat);
    this.waterMesh.position.set(cx, 0.035, cz);
    this.rootGroup.add(this.waterMesh);

    // Stone rim around pond
    const rimGeo = new THREE.RingGeometry(pondRadius - 0.5, pondRadius + 1.2, 48);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(cx, 0.038, cz);
    this.rootGroup.add(rim);

    // Center fountain nozzle / jet base
    const fountainGeo = new THREE.CylinderGeometry(1.5, 2.0, 1.2, 16);
    const fountainMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const fountain = new THREE.Mesh(fountainGeo, fountainMat);
    fountain.position.set(cx, 0.6, cz);
    this.rootGroup.add(fountain);
  }

  private buildPlayground(): void {
    const [cx, cz] = cityConfig.park.center;
    // Position playground in North-East quadrant of park (x: +70m, z: -60m)
    const playX = cx + 65.0;
    const playZ = cz - 55.0;

    const playGroup = new THREE.Group();
    playGroup.position.set(playX, 0, playZ);

    // Rubber safety turf
    const turfGeo = new THREE.PlaneGeometry(35, 25);
    turfGeo.rotateX(-Math.PI / 2);
    const turfMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.9 }); // Bright safety orange
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.position.y = 0.035;
    playGroup.add(turf);

    // 1. Swings Set
    const swingFrameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 });
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 8);
    beamGeo.rotateZ(Math.PI / 2);
    const beam = new THREE.Mesh(beamGeo, swingFrameMat);
    beam.position.set(0, 3.2, 5.0);
    playGroup.add(beam);

    // A-frame legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.5, 8);
    const leftLeg1 = new THREE.Mesh(legGeo, swingFrameMat);
    leftLeg1.position.set(-3.0, 1.6, 5.8);
    leftLeg1.rotation.x = 0.25;
    playGroup.add(leftLeg1);

    const leftLeg2 = new THREE.Mesh(legGeo, swingFrameMat);
    leftLeg2.position.set(-3.0, 1.6, 4.2);
    leftLeg2.rotation.x = -0.25;
    playGroup.add(leftLeg2);

    const rightLeg1 = new THREE.Mesh(legGeo, swingFrameMat);
    rightLeg1.position.set(3.0, 1.6, 5.8);
    rightLeg1.rotation.x = 0.25;
    playGroup.add(rightLeg1);

    const rightLeg2 = new THREE.Mesh(legGeo, swingFrameMat);
    rightLeg2.position.set(3.0, 1.6, 4.2);
    rightLeg2.rotation.x = -0.25;
    playGroup.add(rightLeg2);

    // Swings seat group
    this.swingsSeat = new THREE.Group();
    this.swingsSeat.position.set(0, 3.2, 5.0);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const seatGeo = new THREE.BoxGeometry(0.8, 0.08, 0.35);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, -2.4, 0);
    this.swingsSeat.add(seat);

    // Chains
    const chainMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6);
    const leftChain = new THREE.Mesh(chainGeo, chainMat);
    leftChain.position.set(-0.35, -1.2, 0);
    this.swingsSeat.add(leftChain);
    const rightChain = new THREE.Mesh(chainGeo, chainMat);
    rightChain.position.set(0.35, -1.2, 0);
    this.swingsSeat.add(rightChain);

    playGroup.add(this.swingsSeat);

    // 2. Slide
    const slideGroup = new THREE.Group();
    slideGroup.position.set(-8.0, 0, -2.0);

    // Platform tower
    const towerGeo = new THREE.BoxGeometry(2.0, 2.4, 2.0);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 1.2;
    slideGroup.add(tower);

    // Chute ramp
    const chuteGeo = new THREE.BoxGeometry(1.0, 0.15, 4.0);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7, roughness: 0.2 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, 1.1, 2.5);
    chute.rotation.x = 0.55;
    slideGroup.add(chute);

    playGroup.add(slideGroup);

    this.rootGroup.add(playGroup);
  }

  private buildBenches(): void {
    const [cx, cz] = cityConfig.park.center;
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }); // Polished teak wood
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    const benchCount = 16;
    for (let i = 0; i < benchCount; i++) {
      const theta = (i * 2 * Math.PI) / benchCount;
      const dist = 52.0; // Along inner promenade
      const bx = cx + dist * Math.cos(theta);
      const bz = cz + dist * Math.sin(theta);

      const bench = new THREE.Group();
      bench.position.set(bx, 0, bz);
      bench.rotation.y = -theta - Math.PI / 2;

      // Wooden seat slat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), benchMat);
      seat.position.y = 0.45;
      bench.add(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.08), benchMat);
      back.position.set(0, 0.75, -0.28);
      bench.add(back);

      // Cast iron legs
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.55), legMat);
      leftLeg.position.set(-0.85, 0.225, 0);
      bench.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.55), legMat);
      rightLeg.position.set(0.85, 0.225, 0);
      bench.add(rightLeg);

      this.rootGroup.add(bench);
    }
  }

  private buildTrees(): void {
    const [cx, cz] = cityConfig.park.center;
    const radius = cityConfig.park.radius; // 180m

    // High performance instanced foliage: 120 trees scattered naturally inside park
    const treeCount = 120;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.5, 8);
    const foliageGeo = new THREE.ConeGeometry(2.8, 6.0, 8);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const foliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < treeCount; i++) {
      // Polar distribution between 55m and 160m (avoiding central pond and promenade)
      const r = 55 + Math.sqrt(Math.random()) * (radius - 70);
      const theta = Math.random() * 2 * Math.PI;

      const tx = cx + r * Math.cos(theta);
      const tz = cz + r * Math.sin(theta);
      const scale = 0.85 + Math.random() * 0.45;

      // Trunk
      dummy.position.set(tx, 1.75 * scale, tz);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(placed, dummy.matrix);

      // Foliage
      dummy.position.set(tx, (3.5 + 2.5) * scale, tz);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      foliageInstanced.setMatrixAt(placed, dummy.matrix);

      placed++;
    }

    trunkInstanced.instanceMatrix.needsUpdate = true;
    foliageInstanced.instanceMatrix.needsUpdate = true;

    this.rootGroup.add(trunkInstanced);
    this.rootGroup.add(foliageInstanced);
  }

  public update(delta: number, elapsed: number): void {
    // Gentle water shimmer
    if (this.waterMesh) {
      const mat = this.waterMesh.material as THREE.MeshStandardMaterial;
      mat.roughness = 0.1 + Math.sin(elapsed * 2.0) * 0.05;
    }

    // Playful gentle swing motion
    if (this.swingsSeat) {
      this.swingsSeat.rotation.x = Math.sin(elapsed * 1.8) * 0.25;
    }
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
