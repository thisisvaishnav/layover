import * as THREE from "three";

export interface RoadCarOptions {
  color?: number;
  isTaxi?: boolean;
  scale?: number;
  name?: string;
  regGeo?: <T extends THREE.BufferGeometry>(g: T) => T;
  regMat?: <T extends THREE.Material>(m: T) => T;
}

export interface BuiltCar {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  chassis: THREE.Mesh;
  cabin: THREE.Mesh;
  glass: THREE.Mesh;
  frontBumper: THREE.Mesh;
  rearBumper: THREE.Mesh;
  taxiSign?: THREE.Mesh;
}

/**
 * Builds the canonical road car model used across the city traffic system and taxi stand.
 * Guarantees visual consistency across moving road vehicles and stationed taxi stand cabs.
 */
export function buildRoadCarModel(options: RoadCarOptions = {}): BuiltCar {
  const {
    color = 0xfacc15,
    isTaxi = false,
    scale = 2.0,
    name = "road-car",
    regGeo = (g) => g,
    regMat = (m) => m,
  } = options;

  const carGroup = new THREE.Group();
  carGroup.name = name;
  carGroup.scale.set(scale, scale, scale);

  const wheels: THREE.Mesh[] = [];

  // Geometries
  const carChassisGeo = regGeo(new THREE.BoxGeometry(2.4, 0.65, 5.2));
  const carCabinGeo = regGeo(new THREE.BoxGeometry(2.1, 0.75, 2.9));
  const carGlassGeo = regGeo(new THREE.BoxGeometry(2.14, 0.70, 2.75));
  const carBumperGeo = regGeo(new THREE.BoxGeometry(2.42, 0.32, 0.2));
  const carWheelGeo = regGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 12));
  carWheelGeo.rotateZ(Math.PI / 2);
  const carHubcapGeo = regGeo(new THREE.CylinderGeometry(0.20, 0.20, 0.28, 10));
  carHubcapGeo.rotateZ(Math.PI / 2);
  const lampGeo = regGeo(new THREE.BoxGeometry(0.45, 0.22, 0.12));
  const taxiSignGeo = regGeo(new THREE.BoxGeometry(0.85, 0.26, 0.42));

  // Materials
  const bodyMat = regMat(new THREE.MeshLambertMaterial({ color }));
  const windowMat = regMat(
    new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    })
  );
  const trimMat = regMat(new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
  const headlampMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfef08a,
      emissiveIntensity: 1.2,
    })
  );
  const taillampMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.2,
    })
  );
  const taxiSignMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.8,
    })
  );
  const tireMat = regMat(new THREE.MeshLambertMaterial({ color: 0x18181b }));
  const hubcapMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd1d5db }));

  // Meshes
  const chassis = new THREE.Mesh(carChassisGeo, bodyMat);
  chassis.name = "CarChassis";
  chassis.position.y = 0.72;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  carGroup.add(chassis);

  const cabin = new THREE.Mesh(carCabinGeo, bodyMat);
  cabin.name = "CarCabin";
  cabin.position.set(0, 1.38, -0.2);
  cabin.castShadow = true;
  carGroup.add(cabin);

  const glass = new THREE.Mesh(carGlassGeo, windowMat);
  glass.name = "CarGlass";
  glass.position.set(0, 1.38, -0.2);
  carGroup.add(glass);

  const fBumper = new THREE.Mesh(carBumperGeo, trimMat);
  fBumper.name = "CarFrontBumper";
  fBumper.position.set(0, 0.55, 2.6);
  carGroup.add(fBumper);

  const rBumper = new THREE.Mesh(carBumperGeo, trimMat);
  rBumper.name = "CarRearBumper";
  rBumper.position.set(0, 0.55, -2.6);
  carGroup.add(rBumper);

  // Front headlights (+Z forward)
  const lHead = new THREE.Mesh(lampGeo, headlampMat);
  lHead.name = "CarHeadlampLeft";
  lHead.position.set(-0.85, 0.75, 2.62);
  carGroup.add(lHead);

  const rHead = new THREE.Mesh(lampGeo, headlampMat);
  rHead.name = "CarHeadlampRight";
  rHead.position.set(0.85, 0.75, 2.62);
  carGroup.add(rHead);

  // Rear taillights (-Z rear)
  const lTail = new THREE.Mesh(lampGeo, taillampMat);
  lTail.name = "CarTaillampLeft";
  lTail.position.set(-0.85, 0.75, -2.62);
  carGroup.add(lTail);

  const rTail = new THREE.Mesh(lampGeo, taillampMat);
  rTail.name = "CarTaillampRight";
  rTail.position.set(0.85, 0.75, -2.62);
  carGroup.add(rTail);

  let taxiSignMesh: THREE.Mesh | undefined;
  if (isTaxi) {
    taxiSignMesh = new THREE.Mesh(taxiSignGeo, taxiSignMat);
    taxiSignMesh.name = "TaxiRoofSign";
    taxiSignMesh.position.set(0, 1.88, -0.2);
    carGroup.add(taxiSignMesh);
  }

  // 4 Wheels
  const wZ = [-1.55, 1.55];
  const wX = [-1.22, 1.22];
  let wIndex = 0;
  for (const wz of wZ) {
    for (const wx of wX) {
      const wheel = new THREE.Mesh(carWheelGeo, tireMat);
      wheel.name = `CarWheel-${wIndex}`;
      wheel.position.set(wx, 0.42, wz);
      wheel.castShadow = true;
      carGroup.add(wheel);
      wheels.push(wheel);

      const hubcap = new THREE.Mesh(carHubcapGeo, hubcapMat);
      hubcap.name = `CarHubcap-${wIndex++}`;
      hubcap.position.set(wx, 0.42, wz);
      carGroup.add(hubcap);
    }
  }

  return {
    group: carGroup,
    wheels,
    chassis,
    cabin,
    glass,
    frontBumper: fBumper,
    rearBumper: rBumper,
    taxiSign: taxiSignMesh,
  };
}
