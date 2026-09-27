import * as THREE from "three";

export interface SunlightConfig {
  sunPosition?: THREE.Vector3;
  sunColor?: number;
  enableGodRays?: boolean;
  enableSunMotes?: boolean;
}

export interface SunlightSystem {
  group: THREE.Group;
  sunMesh: THREE.Mesh;
  coronaMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  godRaysGroup: THREE.Group;
  motesParticles: THREE.Points;
  sunPosition: THREE.Vector3;
  update(deltaSeconds: number, camera?: THREE.Camera): void;
  dispose(): void;
}

// Default celestial position of the sun high in the southern-eastern sky (180, 260, 140)
export const DEFAULT_SUN_POSITION = new THREE.Vector3(180, 260, 140);
// Warm golden-white sunlight color
export const DEFAULT_SUN_COLOR = 0xfffaed;

/**
 * Creates a pure DataTexture radial sun corona with warm golden gradient falloff.
 * Pure byte-array generation: 100% compatible with headless Node tests & WebGL.
 */
export function createSunCoronaTexture(size = 128): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const r = dist / maxR;

      if (r >= 1.0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      } else {
        // Smooth exponential falloff
        const alpha = Math.max(0, Math.min(255, Math.floor(255 * Math.pow(1 - r, 1.7))));

        let red = 255;
        let green = 255;
        let blue = 255;

        if (r < 0.22) {
          // Brilliant white core
          red = 255;
          green = 255;
          blue = 248;
        } else if (r < 0.65) {
          // Warm golden yellow
          const t = (r - 0.22) / 0.43;
          red = 255;
          green = Math.floor(255 - t * 45); // 255 -> 210
          blue = Math.floor(248 - t * 140); // 248 -> 108
        } else {
          // Amber outer rim
          const t = (r - 0.65) / 0.35;
          red = 255;
          green = Math.floor(210 - t * 70); // 210 -> 140
          blue = Math.floor(108 - t * 80); // 108 -> 28
        }

        data[idx] = red;
        data[idx + 1] = green;
        data[idx + 2] = blue;
        data[idx + 3] = alpha;
      }
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a pure DataTexture for volumetric god rays / sunlight shafts.
 * Features bright top illumination that smoothly tapers off towards the ground.
 */
export function createSunRayTexture(width = 64, height = 256): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  const halfW = width / 2;

  for (let y = 0; y < height; y++) {
    // Top (y=0) is brightest near sun, tapering off to bottom (y=height-1)
    const vertT = y / (height - 1);
    const vertFactor = Math.pow(1.0 - vertT, 1.4); // smooth fade downwards

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const horizDist = Math.abs(x - halfW) / halfW;
      // Soft horizontal beam falloff (bell curve)
      const horizFactor = Math.max(0, 1.0 - Math.pow(horizDist, 2.0));

      const alpha = Math.max(0, Math.min(255, Math.floor(255 * vertFactor * horizFactor)));

      // Warm golden sunlight tint (rgb: 255, 246, 215)
      data[idx] = 255;
      data[idx + 1] = 246;
      data[idx + 2] = 215;
      data[idx + 3] = alpha;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a pure DataTexture for floating sun motes (airborne golden dust sparkles).
 */
export function createSunMoteTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const r = dist / maxR;

      if (r >= 1.0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      } else {
        const alpha = Math.max(0, Math.min(255, Math.floor(255 * Math.exp(-r * r * 3.5))));
        data[idx] = 255;
        data[idx + 1] = 250;
        data[idx + 2] = 220;
        data[idx + 3] = alpha;
      }
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a comprehensive cinematic Sunlight System for the 3D world:
 * 1. Radiant Sun Core in the high sky with dual-layer corona & atmospheric halo.
 * 2. Volumetric God Rays (crepuscular sunlight shafts) streaming across park and city.
 * 3. Floating Sun Motes: warm golden airborne dust particles dancing in the sunlight.
 * 4. Dynamic camera-reactive glare: expands and radiates when looking towards the sun.
 */
export function createSunlightSystem(config: SunlightConfig = {}): SunlightSystem {
  const group = new THREE.Group();
  group.name = "SunlightSystem";

  const sunPosition = (config.sunPosition ?? DEFAULT_SUN_POSITION).clone();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  function regGeo<T extends THREE.BufferGeometry>(g: T): T {
    geometries.push(g);
    return g;
  }
  function regMat<T extends THREE.Material>(m: T): T {
    materials.push(m);
    return m;
  }
  function regTex<T extends THREE.Texture>(t: T): T {
    textures.push(t);
    return t;
  }

  // Textures
  const coronaTex = regTex(createSunCoronaTexture(128));
  const rayTex = regTex(createSunRayTexture(64, 256));
  const moteTex = regTex(createSunMoteTexture(32));

  // --- 1. Visual Sun Core & Corona ---
  // A. Brilliant Core Sphere
  const sunCoreGeo = regGeo(new THREE.SphereGeometry(18, 20, 20));
  const sunCoreMat = regMat(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    })
  );
  const sunMesh = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunMesh.name = "SunCore";
  sunMesh.position.copy(sunPosition);
  group.add(sunMesh);

  // B. Inner Golden Corona Flare Disc (Billboard)
  const coronaGeo = regGeo(new THREE.PlaneGeometry(92, 92));
  const coronaMat = regMat(
    new THREE.MeshBasicMaterial({
      map: coronaTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
  coronaMesh.name = "SunCorona";
  coronaMesh.position.copy(sunPosition);
  group.add(coronaMesh);

  // C. Broad Outer Atmospheric Sun Halo Disc (~220 units wide)
  const haloGeo = regGeo(new THREE.PlaneGeometry(240, 240));
  const haloMat = regMat(
    new THREE.MeshBasicMaterial({
      map: coronaTex,
      transparent: true,
      opacity: 0.40,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.name = "SunAtmosphericHalo";
  haloMesh.position.copy(sunPosition);
  group.add(haloMesh);

  // --- 2. Volumetric God Rays (Crepuscular Light Shafts) ---
  const godRaysGroup = new THREE.Group();
  godRaysGroup.name = "SunGodRays";
  group.add(godRaysGroup);

  // Calculate sun ray angle pointing from sky down towards city center
  const sunRayDir = new THREE.Vector3().copy(sunPosition).normalize().negate();
  // Compute rotation quaternion to orient rays along sun ray direction
  const defaultDir = new THREE.Vector3(0, -1, 0);
  const rayOrientation = new THREE.Quaternion().setFromUnitVectors(defaultDir, sunRayDir);

  interface GodRayShaft {
    mesh: THREE.Mesh;
    baseOpacity: number;
    phase: number;
    speed: number;
  }
  const godRayShafts: GodRayShaft[] = [];

  // Anchor points around city & park to receive dramatic sunlight beams
  const shaftAnchors: Array<{ x: number; z: number; width: number; height: number; opacity: number }> = [
    { x: 0, z: 0, width: 34, height: 260, opacity: 0.18 },       // Central Park & Memorial
    { x: -28, z: 12, width: 28, height: 240, opacity: 0.14 },    // Coffee Shop edge & lawn
    { x: 28, z: -15, width: 30, height: 250, opacity: 0.16 },    // Transit Plaza & Bus Stop
    { x: -50, z: -40, width: 38, height: 270, opacity: 0.13 },   // North-West Boulevard
    { x: 45, z: 45, width: 32, height: 250, opacity: 0.15 },     // South-East Plaza
  ];

  for (let i = 0; i < shaftAnchors.length; i++) {
    const anchor = shaftAnchors[i];
    // Create crossed double-quads for 3D visibility from any camera angle
    const rayGeo = regGeo(new THREE.PlaneGeometry(anchor.width, anchor.height));
    const rayMat = regMat(
      new THREE.MeshBasicMaterial({
        map: rayTex,
        transparent: true,
        opacity: anchor.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );

    const shaftMesh1 = new THREE.Mesh(rayGeo, rayMat);
    shaftMesh1.quaternion.copy(rayOrientation);
    // Position ray center midway along the beam
    const midwayDistance = anchor.height * 0.45;
    shaftMesh1.position.set(
      anchor.x - sunRayDir.x * midwayDistance,
      anchor.height * 0.45,
      anchor.z - sunRayDir.z * midwayDistance
    );
    godRaysGroup.add(shaftMesh1);

    // Cross quad rotated 90 degrees around beam axis for full 3D body
    const shaftMesh2 = new THREE.Mesh(rayGeo, rayMat);
    shaftMesh2.quaternion.copy(rayOrientation);
    shaftMesh2.rotateY(Math.PI / 2);
    shaftMesh2.position.copy(shaftMesh1.position);
    godRaysGroup.add(shaftMesh2);

    godRayShafts.push({
      mesh: shaftMesh1,
      baseOpacity: anchor.opacity,
      phase: i * 1.25,
      speed: 0.6 + i * 0.15,
    });
  }

  // --- 3. Floating Sun Motes / Airborne Golden Dust Particles ---
  const MOTE_COUNT = 180;
  const motePositions = new Float32Array(MOTE_COUNT * 3);
  const moteVelocities: Array<{ vx: number; vy: number; vz: number; phase: number }> = [];

  const BOUND_X = 85;
  const BOUND_Z = 85;
  const MIN_Y = 0.6;
  const MAX_Y = 22.0;

  for (let i = 0; i < MOTE_COUNT; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * (BOUND_X * 2);
    motePositions[i * 3 + 1] = MIN_Y + Math.random() * (MAX_Y - MIN_Y);
    motePositions[i * 3 + 2] = (Math.random() - 0.5) * (BOUND_Z * 2);

    moteVelocities.push({
      vx: 0.4 + Math.random() * 0.8,              // Gentle eastward drift
      vy: 0.15 + (Math.random() - 0.5) * 0.35,     // Slight gentle vertical float
      vz: 0.2 + (Math.random() - 0.5) * 0.4,       // Subtle cross breeze
      phase: Math.random() * Math.PI * 2,
    });
  }

  const motesGeo = regGeo(new THREE.BufferGeometry());
  motesGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));

  const motesMat = regMat(
    new THREE.PointsMaterial({
      map: moteTex,
      size: 0.85,
      color: 0xffeed0,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    })
  );

  const motesParticles = new THREE.Points(motesGeo, motesMat);
  motesParticles.name = "SunMotes";
  group.add(motesParticles);

  let accumulatedTime = 0;

  // --- 4. Animation & Dynamic Camera Interaction Update ---
  function update(deltaSeconds: number, camera?: THREE.Camera): void {
    accumulatedTime += deltaSeconds;

    // A. Update Floating Sun Motes
    const posAttr = motesGeo.getAttribute("position") as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const idx = i * 3;
      const vel = moteVelocities[i];

      // Sinusoidal buoyant floating
      const bobY = Math.sin(accumulatedTime * 1.2 + vel.phase) * 0.04;
      const driftX = Math.cos(accumulatedTime * 0.8 + vel.phase) * 0.03;

      posArray[idx] += (vel.vx + driftX) * deltaSeconds;
      posArray[idx + 1] += (vel.vy + bobY) * deltaSeconds;
      posArray[idx + 2] += vel.vz * deltaSeconds;

      // Wrap particles inside world volume
      if (posArray[idx] > BOUND_X) posArray[idx] = -BOUND_X;
      if (posArray[idx] < -BOUND_X) posArray[idx] = BOUND_X;
      if (posArray[idx + 1] > MAX_Y) posArray[idx + 1] = MIN_Y;
      if (posArray[idx + 1] < MIN_Y) posArray[idx + 1] = MAX_Y;
      if (posArray[idx + 2] > BOUND_Z) posArray[idx + 2] = -BOUND_Z;
      if (posArray[idx + 2] < -BOUND_Z) posArray[idx + 2] = BOUND_Z;
    }
    posAttr.needsUpdate = true;

    // B. Breathe Volumetric God Rays
    for (const shaft of godRayShafts) {
      const pulse = Math.sin(accumulatedTime * shaft.speed + shaft.phase);
      const targetOpacity = shaft.baseOpacity * (1.0 + 0.20 * pulse);
      (shaft.mesh.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
    }

    // C. Dynamic Camera-Facing Sun Corona & Optical Glare
    if (camera) {
      coronaMesh.quaternion.copy(camera.quaternion);
      haloMesh.quaternion.copy(camera.quaternion);

      // Measure view angle to sun for dynamic cinematic optical flare
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);

      const dirToSun = new THREE.Vector3()
        .copy(sunPosition)
        .sub(camera.position)
        .normalize();

      const dot = Math.max(0, camDir.dot(dirToSun));
      const glare = Math.pow(dot, 2.2);

      // Flare scale expands and corona brightens as player looks toward sunlight
      const flareScale = 1.0 + 0.45 * glare;
      coronaMesh.scale.set(flareScale, flareScale, 1.0);
      coronaMat.opacity = Math.min(1.0, 0.75 + 0.25 * glare);

      const haloScale = 1.0 + 0.25 * glare;
      haloMesh.scale.set(haloScale, haloScale, 1.0);
    }
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
  }

  return {
    group,
    sunMesh,
    coronaMesh,
    haloMesh,
    godRaysGroup,
    motesParticles,
    sunPosition,
    update,
    dispose,
  };
}
