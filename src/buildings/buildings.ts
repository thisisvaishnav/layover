import * as THREE from "three";
import { CitySubsystem } from "@/city/types";
import { roadGraph } from "@/roads/road-graph";
import cityConfig from "@/city-config.json";

export class Buildings implements CitySubsystem {
  public readonly name = "Buildings";
  private rootGroup: THREE.Group = new THREE.Group();

  public init(scene: THREE.Scene): void {
    this.rootGroup.name = "CityBuildings";
    scene.add(this.rootGroup);

    this.buildBusStops();
    this.buildInnerRingBuildings();
    this.buildMiddleRingBuildings();
    this.buildOuterRingBuildings();
  }

  /**
   * Section 4: 110-115 bus stops placed evenly every 135m along rings and radials.
   * Uses THREE.InstancedMesh for maximum rendering performance.
   */
  private buildBusStops(): void {
    const stops = roadGraph.busStops;
    const [sw, sd] = cityConfig.busStop.shelterFootprint; // [3, 2]
    const sh = 2.4; // 2.4m human scale height

    // 1. Shelter Roof (Instanced)
    const roofGeo = new THREE.BoxGeometry(sw, 0.12, sd);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const roofInstanced = new THREE.InstancedMesh(roofGeo, roofMat, stops.length);

    // 2. Glass Back Panel (Instanced)
    const glassGeo = new THREE.BoxGeometry(sw - 0.2, sh - 0.2, 0.08);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
    });
    const glassInstanced = new THREE.InstancedMesh(glassGeo, glassMat, stops.length);

    // 3. Bench inside shelter (Instanced)
    const benchGeo = new THREE.BoxGeometry(sw - 0.6, 0.08, 0.45);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const benchInstanced = new THREE.InstancedMesh(benchGeo, benchMat, stops.length);

    const dummy = new THREE.Object3D();

    stops.forEach((stop, idx) => {
      dummy.position.set(stop.position.x, sh, stop.position.z);
      dummy.rotation.set(0, stop.rotationY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      roofInstanced.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(stop.position.x, sh / 2, stop.position.z - sd / 2 + 0.1);
      dummy.updateMatrix();
      glassInstanced.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(stop.position.x, 0.45, stop.position.z);
      dummy.updateMatrix();
      benchInstanced.setMatrixAt(idx, dummy.matrix);
    });

    roofInstanced.instanceMatrix.needsUpdate = true;
    glassInstanced.instanceMatrix.needsUpdate = true;
    benchInstanced.instanceMatrix.needsUpdate = true;

    this.rootGroup.add(roofInstanced);
    this.rootGroup.add(glassInstanced);
    this.rootGroup.add(benchInstanced);
  }

  /**
   * Section 3: Inner ring (220-460m):
   * Houses (type A: 12, type B: 8), Shop units (10), Cafes (2), Salons (2)
   */
  private buildInnerRingBuildings(): void {
    const [cx, cz] = cityConfig.park.center;
    const innerBandR = 340.0; // midway in 220-460m band

    // 1. House Type A: 10m x 8m x 6m, 2 floors, pitched roof (12 count)
    const hA = cityConfig.buildings.houseA;
    const [haW, haD] = hA.footprint;
    const haBodyGeo = new THREE.BoxGeometry(haW, hA.height - 1.8, haD);
    const haBodyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 }); // Cream stucco
    const haRoofGeo = new THREE.ConeGeometry(Math.max(haW, haD) * 0.75, 2.2, 4);
    haRoofGeo.rotateY(Math.PI / 4);
    const haRoofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }); // Terracotta tile

    const haBodyInst = new THREE.InstancedMesh(haBodyGeo, haBodyMat, hA.count);
    const haRoofInst = new THREE.InstancedMesh(haRoofGeo, haRoofMat, hA.count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < hA.count; i++) {
      const angle = (i * 2 * Math.PI) / hA.count + 0.1;
      const x = cx + innerBandR * Math.cos(angle);
      const z = cz + innerBandR * Math.sin(angle);

      dummy.position.set(x, (hA.height - 1.8) / 2, z);
      dummy.rotation.set(0, -angle + Math.PI / 2, 0);
      dummy.updateMatrix();
      haBodyInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, hA.height - 0.7, z);
      dummy.updateMatrix();
      haRoofInst.setMatrixAt(i, dummy.matrix);
    }
    haBodyInst.instanceMatrix.needsUpdate = true;
    haRoofInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(haBodyInst);
    this.rootGroup.add(haRoofInst);

    // 2. House Type B: 12m x 9m x 6m, 2 floors, pitched roof (8 count)
    const hB = cityConfig.buildings.houseB;
    const [hbW, hbD] = hB.footprint;
    const hbBodyGeo = new THREE.BoxGeometry(hbW, hB.height - 1.8, hbD);
    const hbBodyMat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, roughness: 0.7 }); // Soft colonial blue
    const hbBodyInst = new THREE.InstancedMesh(hbBodyGeo, hbBodyMat, hB.count);
    const hbRoofInst = new THREE.InstancedMesh(haRoofGeo, haRoofMat, hB.count);

    for (let i = 0; i < hB.count; i++) {
      const angle = (i * 2 * Math.PI) / hB.count + 0.35;
      const r = innerBandR + 40.0;
      const x = cx + r * Math.cos(angle);
      const z = cz + r * Math.sin(angle);

      dummy.position.set(x, (hB.height - 1.8) / 2, z);
      dummy.rotation.set(0, -angle + Math.PI / 2, 0);
      dummy.updateMatrix();
      hbBodyInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, hB.height - 0.7, z);
      dummy.updateMatrix();
      hbRoofInst.setMatrixAt(i, dummy.matrix);
    }
    hbBodyInst.instanceMatrix.needsUpdate = true;
    hbRoofInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(hbBodyInst);
    this.rootGroup.add(hbRoofInst);

    // 3. Shop units: 8m x 10m x 5m (10 count in a strip along radial 0)
    const shopCfg = cityConfig.buildings.shop;
    const [sW, sD] = shopCfg.footprint;
    const shopGeo = new THREE.BoxGeometry(sW, shopCfg.height, sD);
    const shopMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
    const shopInst = new THREE.InstancedMesh(shopGeo, shopMat, shopCfg.count);

    for (let i = 0; i < shopCfg.count; i++) {
      const dist = 240 + i * (sW + 3.0);
      // Along radial 0 (East axis, offset +14m for sidewalk access)
      const x = cx + dist;
      const z = cz + 16.0;

      dummy.position.set(x, shopCfg.height / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      shopInst.setMatrixAt(i, dummy.matrix);
    }
    shopInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(shopInst);

    // 4. Cafes (2 count)
    const cafeCfg = cityConfig.buildings.cafe;
    const [cW, cD] = cafeCfg.footprint;
    for (let i = 0; i < cafeCfg.count; i++) {
      const cafeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(cW, cafeCfg.height, cD),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }) // Warm amber café
      );
      const angle = 0.8 + i * 2.5;
      cafeMesh.position.set(cx + 250 * Math.cos(angle), cafeCfg.height / 2, cz + 250 * Math.sin(angle));
      this.rootGroup.add(cafeMesh);
    }

    // 5. Salons (2 count)
    const salonCfg = cityConfig.buildings.salon;
    const [slW, slD] = salonCfg.footprint;
    for (let i = 0; i < salonCfg.count; i++) {
      const salonMesh = new THREE.Mesh(
        new THREE.BoxGeometry(slW, salonCfg.height, slD),
        new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }) // Chic magenta salon
      );
      const angle = 1.9 + i * 2.8;
      salonMesh.position.set(cx + 260 * Math.cos(angle), salonCfg.height / 2, cz + 260 * Math.sin(angle));
      this.rootGroup.add(salonMesh);
    }
  }

  /**
   * Section 3: Middle ring (460-760m):
   * Big apartment towers (2), Church (1), Temple (1), School (1), Town Hall (1)
   */
  private buildMiddleRingBuildings(): void {
    const [cx, cz] = cityConfig.park.center;
    const midR = 600.0;

    // 1. Big Apartment Buildings (40m x 25m x 45m, 15 floors, count: 2)
    // "tallest residential structure in the city; min 4x footprint, 7x height"
    const aptCfg = cityConfig.buildings.apartmentBig;
    const [aW, aD] = aptCfg.footprint;
    for (let i = 0; i < aptCfg.count; i++) {
      const aptGroup = new THREE.Group();
      const angle = 0.5 + i * Math.PI;
      const x = cx + midR * Math.cos(angle);
      const z = cz + midR * Math.sin(angle);
      aptGroup.position.set(x, 0, z);

      // Main tower
      const towerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(aW, aptCfg.height, aD),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.3 })
      );
      towerMesh.position.y = aptCfg.height / 2;
      aptGroup.add(towerMesh);

      // Glass window strips
      for (let f = 1; f <= aptCfg.floors; f++) {
        const floorY = f * (aptCfg.height / (aptCfg.floors + 1));
        const winGeo = new THREE.BoxGeometry(aW + 0.2, 0.8, aD + 0.2);
        const winMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
        const winStrip = new THREE.Mesh(winGeo, winMat);
        winStrip.position.y = floorY;
        aptGroup.add(winStrip);
      }
      this.rootGroup.add(aptGroup);
    }

    // 2. Church (18m x 30m, 22m steeple, 1 count)
    const churchCfg = cityConfig.buildings.church;
    const [chW, chD] = churchCfg.footprint;
    const churchGroup = new THREE.Group();
    churchGroup.position.set(cx - midR * 0.8, 0, cz + midR * 0.6);

    const nave = new THREE.Mesh(
      new THREE.BoxGeometry(chW, 12, chD),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    nave.position.y = 6;
    churchGroup.add(nave);

    // Steeple
    const steeple = new THREE.Mesh(
      new THREE.ConeGeometry(5, churchCfg.height - 12, 4),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    steeple.position.set(0, 12 + (churchCfg.height - 12) / 2, -chD / 2 + 5);
    churchGroup.add(steeple);
    this.rootGroup.add(churchGroup);

    // 3. Temple (20m x 20m x 18m gopuram, 1 count)
    const templeCfg = cityConfig.buildings.temple;
    const [tW, tD] = templeCfg.footprint;
    const templeGroup = new THREE.Group();
    templeGroup.position.set(cx + midR * 0.8, 0, cz - midR * 0.6);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(tW, 8, tD),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
    );
    base.position.y = 4;
    templeGroup.add(base);

    // Tiered Gopuram pyramid
    for (let tier = 1; tier <= 4; tier++) {
      const tierH = (templeCfg.height - 8) / 4;
      const tierW = tW * (1 - tier * 0.18);
      const tierD = tD * (1 - tier * 0.18);
      const tierMesh = new THREE.Mesh(
        new THREE.BoxGeometry(tierW, tierH, tierD),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
      );
      tierMesh.position.y = 8 + (tier - 0.5) * tierH;
      templeGroup.add(tierMesh);
    }
    this.rootGroup.add(templeGroup);

    // 4. School (40m x 30m x 12m, 3 floors, 1 count)
    const schoolCfg = cityConfig.buildings.school;
    const [scW, scD] = schoolCfg.footprint;
    const school = new THREE.Mesh(
      new THREE.BoxGeometry(scW, schoolCfg.height, scD),
      new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 }) // Classic red brick school
    );
    school.position.set(cx, schoolCfg.height / 2, cz + midR);
    this.rootGroup.add(school);

    // 5. Town Hall / Library (35m x 25m x 14m, 2 floors, 1 count)
    const thCfg = cityConfig.buildings.townHall;
    const [thW, thD] = thCfg.footprint;
    const thGroup = new THREE.Group();
    thGroup.position.set(cx, 0, cz - midR);

    const thBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(thW, thCfg.height, thD),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }) // Neo-classical marble
    );
    thBuilding.position.y = thCfg.height / 2;
    thGroup.add(thBuilding);

    // Classical pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    for (let p = -3; p <= 3; p++) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, thCfg.height, 12), pillarMat);
      pillar.position.set(p * (thW / 7), thCfg.height / 2, thD / 2 + 1.0);
      thGroup.add(pillar);
    }
    this.rootGroup.add(thGroup);
  }

  /**
   * Section 3: Outer ring (760m-edge):
   * Hospital (1), Police station (1), Airport terminal (1) + Runway (1), Train station (1), Bus depot (1)
   */
  private buildOuterRingBuildings(): void {
    const [cx, cz] = cityConfig.park.center;
    const outerDist = 880.0;

    // 1. Hospital: 50m x 35m x 20m, 5 floors
    const hospCfg = cityConfig.buildings.hospital;
    const [hW, hD] = hospCfg.footprint;
    const hospGroup = new THREE.Group();
    hospGroup.position.set(cx - outerDist * 0.7, 0, cz - outerDist * 0.7);

    const hospBody = new THREE.Mesh(
      new THREE.BoxGeometry(hW, hospCfg.height, hD),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    hospBody.position.y = hospCfg.height / 2;
    hospGroup.add(hospBody);

    // Red Cross emblem
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.0, 6.0, 0.2), crossMat);
    crossV.position.set(0, hospCfg.height - 4, hD / 2 + 0.2);
    hospGroup.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.0, 0.2), crossMat);
    crossH.position.set(0, hospCfg.height - 4, hD / 2 + 0.2);
    hospGroup.add(crossH);
    this.rootGroup.add(hospGroup);

    // 2. Police Station: 25m x 20m x 10m, 2 floors
    const polCfg = cityConfig.buildings.police;
    const [pW, pD] = polCfg.footprint;
    const police = new THREE.Mesh(
      new THREE.BoxGeometry(pW, polCfg.height, pD),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }) // Deep navy civic
    );
    police.position.set(cx + outerDist * 0.7, polCfg.height / 2, cz - outerDist * 0.7);
    this.rootGroup.add(police);

    // 3. Airport Terminal (60m x 30m x 12m) + Runway (400m x 45m)
    const airCfg = cityConfig.buildings.airportTerminal;
    const [aW, aD] = airCfg.footprint;
    const airGroup = new THREE.Group();
    airGroup.position.set(cx + 800, 0, cz + 600);

    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(aW, airCfg.height, aD),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 })
    );
    terminal.position.y = airCfg.height / 2;
    airGroup.add(terminal);

    // Control tower
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.5, 26, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    tower.position.set(aW / 2 - 8, 13, -aD / 2 + 8);
    airGroup.add(tower);

    // Runway (400m x 45m)
    const [rwL, rwW] = cityConfig.buildings.runway.footprint;
    const runwayGeo = new THREE.PlaneGeometry(rwL, rwW);
    runwayGeo.rotateX(-Math.PI / 2);
    const runway = new THREE.Mesh(
      runwayGeo,
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
    );
    runway.position.set(rwL / 2 + aW / 2 + 30, 0.02, 0);
    airGroup.add(runway);

    // Runway dashed centerline
    const rwDashGeo = new THREE.PlaneGeometry(rwL - 40, 1.2);
    rwDashGeo.rotateX(-Math.PI / 2);
    const rwDash = new THREE.Mesh(rwDashGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    rwDash.position.set(rwL / 2 + aW / 2 + 30, 0.03, 0);
    airGroup.add(rwDash);

    this.rootGroup.add(airGroup);

    // 4. Train Station: 40m x 20m x 10m (tracks tangent to outer ring)
    const trainCfg = cityConfig.buildings.trainStation;
    const [trW, trD] = trainCfg.footprint;
    const trainGroup = new THREE.Group();
    trainGroup.position.set(cx - 800, 0, cz + 650);

    const station = new THREE.Mesh(
      new THREE.BoxGeometry(trW, trainCfg.height, trD),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 })
    );
    station.position.y = trainCfg.height / 2;
    trainGroup.add(station);

    // Tangent train track rails (120m long)
    const trackBed = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.2, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9 })
    );
    trackBed.position.set(0, 0.1, trD / 2 + 4.0);
    trainGroup.add(trackBed);
    this.rootGroup.add(trainGroup);

    // 5. Bus Depot: 30m x 20m x 8m (parking & maintenance yard)
    const depotCfg = cityConfig.buildings.busDepot;
    const [dW, dD] = depotCfg.footprint;
    const depotGroup = new THREE.Group();
    depotGroup.position.set(cx + 400, 0, cz + 850);

    const depot = new THREE.Mesh(
      new THREE.BoxGeometry(dW, depotCfg.height, dD),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 })
    );
    depot.position.y = depotCfg.height / 2;
    depotGroup.add(depot);

    // Parking lot yard (60m x 40m)
    const yard = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
    );
    yard.position.set(dW / 2 + 35, 0.02, 0);
    depotGroup.add(yard);
    this.rootGroup.add(depotGroup);
  }

  public update(delta: number, elapsed: number): void {
    // Static architecture does not require per-frame physics mutation
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
