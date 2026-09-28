import * as THREE from "three";

export interface BarberShopSystem {
  group: THREE.Group;
  barberShopWorldPosition: { x: number; z: number };
  barberWorldPosition: { x: number; z: number };
  npcWorldPosition: { x: number; z: number };
  interactionRadius: number;
  update(deltaSeconds: number, isConversationOpen: boolean): void;
  dispose(): void;
}

export interface BarberShopOptions {
  countryCode?: string;
  rotation?: number;
}

/**
 * Returns the localized marquee heading for the Barber Saloon based on target country.
 * Japanese districts get the Japanese salon wording, everything else the default English sign.
 */
export function getBarberSalonHeading(countryCode?: string): string {
  const code = (countryCode || "").toLowerCase();
  return code === "ja" ? "BARBER SALON" : "VINTAGE BARBER SALOON";
}

/**
 * Returns the localized sub-heading / tagline for the Barber Saloon.
 */
export function getBarberSalonSubHeading(countryCode?: string): string {
  const code = (countryCode || "").toLowerCase();
  return code === "ja" ? "理容サロン · HAIRCUT & SHAVE · TOKYO" : "HAIRCUT & HOT TOWEL SHAVE";
}

/**
 * Creates a pure DataTexture for the traditional rotating barber pole
 * featuring crisp diagonal helical red, white, and blue stripes.
 * Compatible with headless Node.js tests and browser WebGL.
 */
export function createBarberPoleTexture(size = 64): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const stripeWidth = size / 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Diagonal wrap for helical barber pole
      const pos = (x + y * 1.5) % size;
      const stripeIdx = Math.floor(pos / stripeWidth);

      if (stripeIdx === 0) {
        // Vibrant Crimson Red (#DC2626)
        data[idx] = 220;
        data[idx + 1] = 38;
        data[idx + 2] = 38;
        data[idx + 3] = 255;
      } else if (stripeIdx === 1) {
        // Pure Crisp White (#FFFFFF)
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      } else if (stripeIdx === 2) {
        // Cobalt Blue (#2563EB)
        data[idx] = 37;
        data[idx + 1] = 99;
        data[idx + 2] = 235;
        data[idx + 3] = 255;
      } else {
        // Pure Crisp White (#FFFFFF)
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a high-resolution signboard texture for the Barber Saloon marquee heading.
 * In browser: uses HTML5 2D Canvas with ornate gold filigree border and typography.
 * In headless Node: provides a robust DataTexture fallback with border pattern.
 */
export function createBarberSignTexture(
  countryCode?: string,
  width = 512,
  height = 128
): THREE.Texture {
  const heading = getBarberSalonHeading(countryCode);
  const subHeading = getBarberSalonSubHeading(countryCode);

  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 1. Rich dark heritage background (very dark emerald/navy slate)
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#091e28");
        grad.addColorStop(0.5, "#0f2e3d");
        grad.addColorStop(1, "#06151c");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Ornate double gold filigree border
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, width - 12, height - 12);

        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, width - 24, height - 24);

        // Corner gold diamonds
        ctx.fillStyle = "#facc15";
        const cornerDiamonds = [
          [18, 18],
          [width - 18, 18],
          [18, height - 18],
          [width - 18, height - 18],
        ];
        for (const [cx, cy] of cornerDiamonds) {
          ctx.beginPath();
          ctx.moveTo(cx, cy - 4);
          ctx.lineTo(cx + 4, cy);
          ctx.lineTo(cx, cy + 4);
          ctx.lineTo(cx - 4, cy);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Main Heading ("SALOON" / localized salon name)
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Shadow
        ctx.font = "bold 36px 'Cinzel', 'Playfair Display', 'Times New Roman', 'Georgia', serif";
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillText(heading, width / 2 + 2, 48 + 2);

        // Gold Gradient Text
        const textGrad = ctx.createLinearGradient(0, 24, 0, 68);
        textGrad.addColorStop(0, "#fef08a"); // Light brilliant gold
        textGrad.addColorStop(0.5, "#facc15"); // Warm gold
        textGrad.addColorStop(1, "#ca8a04"); // Deep bronze gold
        ctx.fillStyle = textGrad;
        ctx.fillText(heading, width / 2, 48);

        // 4. Sub-heading / Tagline
        ctx.font = "600 15px 'Cinzel', 'Montserrat', 'Arial', sans-serif";
        ctx.fillStyle = "#fde047";
        ctx.fillText(`— ${subHeading} —`, width / 2, 92);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        return texture;
      }
    } catch {
      // Fallback to DataTexture if canvas fails
    }
  }

  // Headless Node fallback: return crisp DataTexture with gold/dark border pattern
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      const isInnerBorder =
        (x >= 8 && x <= 10 && y >= 8 && y <= height - 8) ||
        (x >= width - 11 && x <= width - 9 && y >= 8 && y <= height - 8) ||
        (y >= 8 && y <= 10 && x >= 8 && x <= width - 8) ||
        (y >= height - 11 && y <= height - 9 && x >= 8 && x <= width - 8);

      if (isBorder || isInnerBorder) {
        data[idx] = 250;     // R (Gold)
        data[idx + 1] = 204; // G
        data[idx + 2] = 21;  // B
        data[idx + 3] = 255;
      } else {
        data[idx] = 15;      // R (Deep slate #0f172a)
        data[idx + 1] = 23;  // G
        data[idx + 2] = 42;  // B
        data[idx + 3] = 255;
      }
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a high-fidelity, spacious Vintage Barber Shop Salon near the Transit Plaza.
 * Expanded into a grand, wide facade (22m wide, 11m deep, 7.2m high) and country-specific
 * saloon heading marquee sign.
 * Includes:
 * - Expansive architectural heritage facade with panoramic multi-pane display windows
 * - Localized illuminated marquee heading featuring "SALOON" as per the country
 * - 4 overhead vintage gooseneck illuminating lamps
 * - Rotating illuminated barber pole with helical red/white/blue stripes
 * - 3 vintage leather barber chairs with chrome hydraulics and footrests
 * - Full-width vanity styling counter, 3 illuminated vanity mirrors, and grooming accessories
 * - Wide checkerboard tiled entrance porch with waiting benches
 * - Master Barber NPC with grooming scissors, comb, and glowing beacon aura
 */
export function createBarberShop(
  worldX: number,
  worldZ: number,
  options?: BarberShopOptions
): BarberShopSystem {
  const group = new THREE.Group();
  group.position.set(worldX, 0, worldZ);
  const rotation = options?.rotation ?? 0;
  group.rotation.y = rotation;
  group.name = "BarberShopSystem";

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

  // --- Common Materials ---
  const wallMat = regMat(new THREE.MeshLambertMaterial({ color: 0x164e63 })); // Deep heritage teal/slate
  const trimMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf8fafc })); // Clean white cornices
  const darkTrimMat = regMat(new THREE.MeshLambertMaterial({ color: 0x0f172a })); // Dark slate door/window frames
  const goldMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.7,
      roughness: 0.3,
    })
  );
  const glassMat = regMat(
    new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    })
  );
  const chromeMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.15,
    })
  );
  const leatherMat = regMat(new THREE.MeshLambertMaterial({ color: 0x881337 })); // Rich burgundy leather
  const woodMat = regMat(new THREE.MeshLambertMaterial({ color: 0x451a03 })); // Dark walnut counter
  const tileBlackMat = regMat(new THREE.MeshLambertMaterial({ color: 0x18181b }));
  const tileWhiteMat = regMat(new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
  const lampGlowMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfef08a,
      emissiveIntensity: 1.2,
    })
  );
  const mirrorMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      metalness: 0.9,
    })
  );

  // --- 1. Grand Salon Building Structure ---
  // Substantially bigger: width 22m (was 15.6m), depth 11m (was 7.8m), height 7.2m (was 5.6m)
  const shopW = 22;
  const shopH = 7.2;
  const shopD = 11;
  const halfW = shopW / 2;
  const halfD = shopD / 2;

  // Master Barber standing just inside the grand doorway (local coordinates)
  const npcLocalX = 3.6;
  const npcLocalZ = halfD - 1.8;

  const buildingGroup = new THREE.Group();
  buildingGroup.name = "BarberShopBuilding";
  group.add(buildingGroup);

  // Back Wall
  const backWall = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(shopW, shopH, 0.35)),
    wallMat
  );
  backWall.position.set(0, shopH / 2, -shopD / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  buildingGroup.add(backWall);

  // Left Wall
  const leftWall = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.35, shopH, shopD)),
    wallMat
  );
  leftWall.position.set(-shopW / 2, shopH / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  buildingGroup.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.35, shopH, shopD)),
    wallMat
  );
  rightWall.position.set(shopW / 2, shopH / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  buildingGroup.add(rightWall);

  // Roof & Multi-tiered Cornice
  const roof = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(shopW + 0.8, 0.5, shopD + 0.8)),
    trimMat
  );
  roof.position.set(0, shopH + 0.25, 0);
  roof.castShadow = true;
  buildingGroup.add(roof);

  const upperFascia = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(shopW + 0.5, 0.35, shopD + 0.5)),
    darkTrimMat
  );
  upperFascia.position.set(0, shopH - 0.18, 0);
  buildingGroup.add(upperFascia);

  // Wide Checkerboard Entrance Porch (21m wide, 3m deep, 63 tiles)
  const porchGroup = new THREE.Group();
  porchGroup.name = "BarberShopPorch";
  for (let px = -10; px <= 10; px++) {
    for (let pz = 0; pz <= 2; pz++) {
      const isWhite = (px + pz) % 2 === 0;
      const tile = new THREE.Mesh(
        regGeo(new THREE.BoxGeometry(0.96, 0.04, 0.96)),
        isWhite ? tileWhiteMat : tileBlackMat
      );
      tile.position.set(px * 1.0, 0.02, halfD - 1.0 + pz * 1.0);
      tile.receiveShadow = true;
      porchGroup.add(tile);
    }
  }
  buildingGroup.add(porchGroup);

  // Front Facade:
  // - Left section: Grand multi-pane bay display window (13.6m wide)
  // - Center-right section: Double grand entrance doors (4.6m wide)
  // - Far-right section: Heritage corner wall with rotating barber pole

  // Left Window Section
  const windowWallBottom = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(13.6, 1.0, 0.3)),
    wallMat
  );
  windowWallBottom.position.set(-4.0, 0.5, halfD);
  buildingGroup.add(windowWallBottom);

  const windowWallTop = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(13.6, 1.4, 0.3)),
    wallMat
  );
  windowWallTop.position.set(-4.0, shopH - 0.7, halfD);
  buildingGroup.add(windowWallTop);

  // Large panoramic plate glass display window (13.0m wide, 4.8m high)
  const shopGlass = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(13.0, 4.8, 0.1)),
    glassMat
  );
  shopGlass.name = "BarberShopGlass";
  shopGlass.position.set(-4.0, 3.4, halfD);
  buildingGroup.add(shopGlass);

  // Window horizontal transom rail
  const windowFrameH = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(13.1, 0.16, 0.2)),
    darkTrimMat
  );
  windowFrameH.position.set(-4.0, 3.4, halfD);
  buildingGroup.add(windowFrameH);

  // Window vertical mullions (dividing into 4 grand panes)
  [-7.25, -4.0, -0.75].forEach((mx) => {
    const mullion = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.14, 4.8, 0.2)),
      darkTrimMat
    );
    mullion.position.set(mx, 3.4, halfD);
    buildingGroup.add(mullion);
  });

  // Entrance Doorway (Double Grand Entrance)
  const doorPostLeft = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.3, shopH - 1.4, 0.3)),
    darkTrimMat
  );
  doorPostLeft.position.set(2.95, (shopH - 1.4) / 2, halfD);
  buildingGroup.add(doorPostLeft);

  const doorPostRight = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.3, shopH - 1.4, 0.3)),
    darkTrimMat
  );
  doorPostRight.position.set(7.85, (shopH - 1.4) / 2, halfD);
  buildingGroup.add(doorPostRight);

  // Grand Entrance Doors
  const door = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(4.6, 5.0, 0.14)),
    darkTrimMat
  );
  door.position.set(5.4, 2.5, halfD);
  buildingGroup.add(door);

  const doorGlass = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(3.8, 3.0, 0.08)),
    glassMat
  );
  doorGlass.position.set(5.4, 3.0, halfD);
  buildingGroup.add(doorGlass);

  // Double gold handles
  [5.15, 5.65].forEach((hx) => {
    const doorHandle = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8)),
      goldMat
    );
    doorHandle.position.set(hx, 2.2, halfD + 0.12);
    buildingGroup.add(doorHandle);
  });

  // Far-Right Corner Wall
  const rightCornerWall = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(3.0, shopH, 0.3)),
    wallMat
  );
  rightCornerWall.position.set(halfW - 1.5, shopH / 2, halfD);
  buildingGroup.add(rightCornerWall);

  // --- 2. Prominent Illuminated Barber Saloon Signboard with Country-Specific Heading ---
  const signGroup = new THREE.Group();
  signGroup.name = "BarberShopSign";
  signGroup.position.set(-0.9, shopH - 0.70, halfD + 0.22);
  const saloonHeading = getBarberSalonHeading(options?.countryCode);
  signGroup.userData = { heading: saloonHeading, countryCode: options?.countryCode };

  // Wide Dark Signboard (17.0m wide, 1.5m high)
  const signBoard = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(17.0, 1.5, 0.18)),
    darkTrimMat
  );
  signGroup.add(signBoard);

  // Gold Trim Border
  const signBorder = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(17.2, 1.70, 0.08)),
    goldMat
  );
  signBorder.position.z = -0.04;
  signGroup.add(signBorder);

  // Sign Marquee Plaque with High-Resolution Localized Heading Texture
  const signTex = regTex(createBarberSignTexture(options?.countryCode, 1024, 128));
  const signMat = regMat(
    new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.25,
      metalness: 0.40,
    })
  );
  const signPlaque = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(16.6, 1.35, 0.06)),
    signMat
  );
  signPlaque.name = "BarberShopSignPlaque";
  signPlaque.position.z = 0.10;
  signPlaque.userData = { heading: saloonHeading, countryCode: options?.countryCode };
  signGroup.add(signPlaque);

  // 4 Overhead Vintage Gooseneck Lamps Spanning the Wide Sign
  [-6.4, -2.1, 2.1, 6.4].forEach((lx) => {
    const arm = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 6)),
      darkTrimMat
    );
    arm.rotation.x = Math.PI / 4;
    arm.position.set(lx, 0.85, 0.20);
    signGroup.add(arm);

    const shade = new THREE.Mesh(
      regGeo(new THREE.ConeGeometry(0.26, 0.22, 8)),
      darkTrimMat
    );
    shade.position.set(lx, 1.05, 0.45);
    shade.rotation.x = Math.PI;
    signGroup.add(shade);

    const bulb = new THREE.Mesh(
      regGeo(new THREE.SphereGeometry(0.12, 8, 8)),
      lampGlowMat
    );
    bulb.position.set(lx, 0.98, 0.45);
    signGroup.add(bulb);
  });
  buildingGroup.add(signGroup);

  // --- 3. Rotating Illuminated Barber Pole ---
  const poleGroup = new THREE.Group();
  poleGroup.name = "BarberPole";
  poleGroup.position.set(halfW - 1.35, 3.6, halfD + 0.35);
  poleGroup.scale.set(1.35, 1.35, 1.35);

  // Wall Mount Bracket
  const bracket = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.32, 0.14, 0.50)),
    chromeMat
  );
  bracket.position.z = -0.22;
  poleGroup.add(bracket);

  // Chrome Top and Bottom Finial Caps
  const topCap = new THREE.Mesh(
    regGeo(new THREE.SphereGeometry(0.26, 14, 12)),
    chromeMat
  );
  topCap.position.y = 1.15;
  poleGroup.add(topCap);

  const bottomCap = new THREE.Mesh(
    regGeo(new THREE.ConeGeometry(0.26, 0.40, 14)),
    chromeMat
  );
  bottomCap.position.y = -1.15;
  bottomCap.rotation.x = Math.PI;
  poleGroup.add(bottomCap);

  // Transparent Outer Glass Cylinder
  const outerGlass = new THREE.Mesh(
    regGeo(new THREE.CylinderGeometry(0.24, 0.24, 2.05, 16, 1, true)),
    regMat(
      new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
      })
    )
  );
  poleGroup.add(outerGlass);

  // Inner Spinning Cylinder with Helical Stripes
  const poleTex = regTex(createBarberPoleTexture(64));
  const innerPoleMat = regMat(
    new THREE.MeshBasicMaterial({
      map: poleTex,
    })
  );
  const innerPole = new THREE.Mesh(
    regGeo(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 16)),
    innerPoleMat
  );
  innerPole.name = "BarberPoleCylinder";
  poleGroup.add(innerPole);

  buildingGroup.add(poleGroup);

  // --- 4. Interior Barber Furniture (3 Styling Stations, Counters & Mirrors) ---
  const interiorGroup = new THREE.Group();
  interiorGroup.name = "BarberShopInterior";
  group.add(interiorGroup);

  // Full-Width Rear Vanity Counter
  const vanityCounter = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(17.0, 1.05, 1.6)),
    woodMat
  );
  vanityCounter.position.set(-1.3, 0.525, -halfD + 1.2);
  vanityCounter.castShadow = true;
  interiorGroup.add(vanityCounter);

  // 3 Large Vanity Mirrors with Ambient Glow & Gold Frames
  const stationPositions = [-7.0, -1.4, 4.2];

  stationPositions.forEach((mx, idx) => {
    const mirrorFrame = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(2.6, 2.2, 0.08)),
      goldMat
    );
    mirrorFrame.position.set(mx, 3.3, -halfD + 0.35);
    interiorGroup.add(mirrorFrame);

    const mirrorGlass = new THREE.Mesh(
      regGeo(new THREE.PlaneGeometry(2.4, 2.0)),
      mirrorMat
    );
    mirrorGlass.name = `BarberMirror-${idx + 1}`;
    mirrorGlass.position.set(mx, 3.3, -halfD + 0.40);
    interiorGroup.add(mirrorGlass);
  });

  // 3 Vintage Leather Barber Chairs
  stationPositions.forEach((cx, idx) => {
    const chairGroup = new THREE.Group();
    chairGroup.name = `BarberChair-${idx + 1}`;
    chairGroup.position.set(cx, 0, -halfD + 4.2);
    chairGroup.scale.set(1.15, 1.15, 1.15);

    // Chrome Pedestal Base
    const base = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.60, 0.70, 0.14, 16)),
      chromeMat
    );
    base.position.y = 0.07;
    chairGroup.add(base);

    // Hydraulic Column
    const column = new THREE.Mesh(
      regGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.65, 12)),
      chromeMat
    );
    column.position.y = 0.45;
    chairGroup.add(column);

    // Footrest
    const footrest = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.70, 0.09, 0.50)),
      chromeMat
    );
    footrest.position.set(0, 0.30, 0.70);
    chairGroup.add(footrest);

    // Cushioned Seat
    const seat = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.95, 0.20, 0.95)),
      leatherMat
    );
    seat.position.y = 0.85;
    chairGroup.add(seat);

    // Backrest (tilted slightly backwards)
    const back = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.90, 0.95, 0.18)),
      leatherMat
    );
    back.position.set(0, 1.38, -0.42);
    back.rotation.x = -0.1;
    chairGroup.add(back);

    // Headrest
    const headrest = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.50, 0.28, 0.14)),
      leatherMat
    );
    headrest.position.set(0, 1.95, -0.46);
    chairGroup.add(headrest);

    // Armrests
    [-0.52, 0.52].forEach((ax) => {
      const arm = new THREE.Mesh(
        regGeo(new THREE.BoxGeometry(0.14, 0.30, 0.78)),
        chromeMat
      );
      arm.position.set(ax, 1.10, 0);
      chairGroup.add(arm);
    });

    interiorGroup.add(chairGroup);
  });

  // 2 Outdoor Waiting Benches along the wide veranda
  const bench1 = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(2.6, 0.50, 0.70)),
    woodMat
  );
  bench1.name = "BarberWaitingBench";
  bench1.position.set(-7.4, 0.28, halfD + 1.3);
  group.add(bench1);

  const bench2 = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(2.6, 0.50, 0.70)),
    woodMat
  );
  bench2.position.set(-1.0, 0.28, halfD + 1.3);
  group.add(bench2);

  // --- 5. Barber NPC ("Marco") ---
  const npcGroup = new THREE.Group();
  npcGroup.name = "BarberNPC";
  // Positioned by the grand doorway / styling station greeting clients
  npcGroup.position.set(npcLocalX, 0, npcLocalZ);
  npcGroup.scale.set(1.9, 1.9, 1.9);

  const skinMat = regMat(new THREE.MeshLambertMaterial({ color: 0xd4956b })); // Natural warm skin
  const shirtMat = regMat(new THREE.MeshLambertMaterial({ color: 0xffffff })); // Crisp white barber shirt
  const apronMat = regMat(new THREE.MeshLambertMaterial({ color: 0x18181b })); // Black leather barber apron
  const pantsMat = regMat(new THREE.MeshLambertMaterial({ color: 0x334155 })); // Slate trousers
  const hairMat = regMat(new THREE.MeshLambertMaterial({ color: 0x171717 })); // Dark styled pompadour hair
  const scissorMat = chromeMat;
  const combMat = goldMat;

  // Torso (Shirt)
  const torso = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.50, 0.70, 0.26)),
    shirtMat
  );
  torso.position.y = 1.26;
  torso.castShadow = true;
  npcGroup.add(torso);

  // Leather Barber Apron with pocket
  const apron = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.46, 0.75, 0.06)),
    apronMat
  );
  apron.position.set(0, 1.18, 0.14);
  npcGroup.add(apron);

  // Apron Front Pocket
  const pocket = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.24, 0.16, 0.02)),
    leatherMat
  );
  pocket.position.set(0, 1.05, 0.18);
  npcGroup.add(pocket);

  // Head
  const head = new THREE.Mesh(
    regGeo(new THREE.SphereGeometry(0.25, 14, 12)),
    skinMat
  );
  head.position.y = 1.76;
  head.castShadow = true;
  npcGroup.add(head);

  // Styled Pompadour Hair
  const hair = new THREE.Mesh(
    regGeo(new THREE.SphereGeometry(0.27, 12, 10)),
    hairMat
  );
  hair.position.set(0, 1.85, -0.04);
  hair.scale.set(1.0, 1.15, 1.0);
  npcGroup.add(hair);

  // Mustache
  const stache = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.16, 0.04, 0.04)),
    hairMat
  );
  stache.position.set(0, 1.66, 0.23);
  npcGroup.add(stache);

  // Arms: Right hand holding scissors, Left hand holding comb
  const armGeo = regGeo(new THREE.BoxGeometry(0.16, 0.62, 0.16));

  // Left Arm (holding gold comb)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.35, 1.52, 0);
  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.y = -0.26;
  leftArmPivot.add(leftArm);

  const comb = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.04, 0.18, 0.06)),
    combMat
  );
  comb.position.set(0, -0.50, 0.08);
  leftArmPivot.add(comb);
  npcGroup.add(leftArmPivot);

  // Right Arm (holding chrome scissors)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.35, 1.52, 0);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.y = -0.26;
  rightArmPivot.add(rightArm);

  const scissorBlade1 = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.02, 0.22, 0.04)),
    scissorMat
  );
  scissorBlade1.position.set(0, -0.52, 0.08);
  scissorBlade1.rotation.z = 0.15;
  rightArmPivot.add(scissorBlade1);

  const scissorBlade2 = new THREE.Mesh(
    regGeo(new THREE.BoxGeometry(0.02, 0.22, 0.04)),
    scissorMat
  );
  scissorBlade2.position.set(0, -0.52, 0.08);
  scissorBlade2.rotation.z = -0.15;
  rightArmPivot.add(scissorBlade2);

  npcGroup.add(rightArmPivot);

  // Legs
  const legGeo = regGeo(new THREE.BoxGeometry(0.18, 0.72, 0.18));
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.13, 0.48, 0);
  leftLeg.castShadow = true;
  npcGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.13, 0.48, 0);
  rightLeg.castShadow = true;
  npcGroup.add(rightLeg);

  group.add(npcGroup);

  // --- 6. Glowing Beacon Aura around Barber NPC ---
  const highlightGroup = new THREE.Group();
  highlightGroup.name = "BarberHighlight";
  highlightGroup.position.set(npcLocalX, 0, npcLocalZ);

  // Glowing translucent cylinder
  const beaconGeo = regGeo(new THREE.CylinderGeometry(1.2, 1.2, 3.8, 20, 1, true));
  const beaconMat = regMat(
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan/Aqua glow
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.y = 1.9;
  highlightGroup.add(beaconMesh);

  // Pulsing ground ring
  const ringGeo = regGeo(new THREE.RingGeometry(0.9, 1.35, 24));
  const ringMat = regMat(
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.04;
  highlightGroup.add(ringMesh);

  group.add(highlightGroup);

  const barberLocalPos = new THREE.Vector3(npcLocalX, 0, npcLocalZ);
  if (rotation !== 0) {
    barberLocalPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
  }
  const barberWorldPosition = {
    x: Number((worldX + barberLocalPos.x).toFixed(4)),
    z: Number((worldZ + barberLocalPos.z).toFixed(4)),
  };
  const npcWorldPosition = barberWorldPosition;

  let animTime = 0;

  function update(deltaSeconds: number, isConversationOpen: boolean): void {
    animTime += deltaSeconds;

    // 1. Rotate the iconic barber pole continuously
    innerPole.rotation.y += deltaSeconds * 3.5;

    // 2. Animate pulsing highlight beacon
    const pulse = Math.sin(animTime * 2.8) * 0.5 + 0.5;
    ringMesh.scale.setScalar(1.0 + pulse * 0.18);
    beaconMat.opacity = 0.18 + pulse * 0.14;

    // 3. Subtle NPC idle breathing and arm gesture
    const breathe = Math.sin(animTime * 1.8) * 0.04;
    torso.position.y = 1.26 + breathe;
    head.position.y = 1.76 + breathe * 1.2;

    if (isConversationOpen) {
      // Gentle conversational hand motion
      rightArmPivot.rotation.x = Math.sin(animTime * 3.2) * 0.18;
      leftArmPivot.rotation.x = -Math.sin(animTime * 2.5) * 0.12;
      highlightGroup.visible = false;
    } else {
      rightArmPivot.rotation.x = 0;
      leftArmPivot.rotation.x = 0;
      highlightGroup.visible = true;
    }
  }

  function dispose(): void {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
  }

  return {
    group,
    barberShopWorldPosition: { x: worldX, z: worldZ },
    barberWorldPosition,
    npcWorldPosition,
    interactionRadius: 12,
    update,
    dispose,
  };
}

/**
 * Pure function to test whether the player is within range of the Barber Shop.
 */
export function isWithinBarberShopRange(
  playerX: number,
  playerZ: number,
  barberX: number,
  barberZ: number,
  radius = 12
): boolean {
  const dx = playerX - barberX;
  const dz = playerZ - barberZ;
  return dx * dx + dz * dz <= radius * radius;
}
