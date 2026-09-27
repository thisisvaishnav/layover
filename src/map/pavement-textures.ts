import * as THREE from "three";

/**
 * Procedural Pavement Textures & Materials for Layover 3D City
 * - Footpath base: Warm terracotta / reddish-orange (#B94A2F to #C65A3A)
 * - Individual square pavement tiles with visible thin grout/seams
 * - Subtle per-tile brightness & color variation
 * - Matte rough surface finish (roughness >= 0.85)
 * - Narrow yellow tactile strip along road-facing edges with ribbed pattern
 * - Headless Node & WebGL compatible via THREE.DataTexture
 */

// Target terracotta base hex (#BD4F33 = rgb(189, 79, 51))
export const TERRACOTTA_BASE_HEX = 0xbd4f33;

// Target saturated muted yellow hex (#DCA81A = rgb(220, 168, 26))
export const TACTILE_YELLOW_HEX = 0xdca81a;

export interface TerracottaTextureOptions {
  size?: number;          // Texture resolution (power of 2, default 256)
  tilesPerSide?: number;  // Grid dimensions (default 4x4 tiles)
  groutWidth?: number;    // Width of grout seam in pixels (default 2)
}

export interface TactileTextureOptions {
  width?: number;
  height?: number;
  ribCount?: number;
}

/**
 * Creates a procedural DataTexture for warm terracotta square pavement tiles.
 * Uses pure byte array generation so it operates in both browser WebGL and headless Node.js tests.
 */
export function createTerracottaTileTexture(
  options: TerracottaTextureOptions = {}
): THREE.DataTexture {
  const size = options.size ?? 256;
  const tilesPerSide = options.tilesPerSide ?? 4;
  const groutWidth = options.groutWidth ?? 2;
  const tileSize = Math.floor(size / tilesPerSide);

  const data = new Uint8Array(size * size * 4);

  // Base terracotta color components (#BD4F33)
  const baseR = (TERRACOTTA_BASE_HEX >> 16) & 255; // 189
  const baseG = (TERRACOTTA_BASE_HEX >> 8) & 255;  // 79
  const baseB = TERRACOTTA_BASE_HEX & 255;         // 51

  // Grout seam color (#521c10 = rgb(82, 28, 16))
  const groutR = 82;
  const groutG = 28;
  const groutB = 16;

  // Precompute per-tile deterministic variation to make individual tiles distinct
  const tileVariations: { rOffset: number; gOffset: number; bOffset: number }[][] = [];
  for (let ty = 0; ty < tilesPerSide; ty++) {
    tileVariations[ty] = [];
    for (let tx = 0; tx < tilesPerSide; tx++) {
      // Deterministic pseudo-random seed per tile
      const seed = ((tx * 17 + ty * 29 + 11) % 23) / 23; // 0..1
      const lightOffset = Math.round((seed - 0.5) * 20); // -10 to +10
      const warmOffset = Math.round((((tx * 7 + ty * 13) % 9) - 4) * 1.5);

      tileVariations[ty][tx] = {
        rOffset: lightOffset + warmOffset,
        gOffset: Math.round(lightOffset * 0.45),
        bOffset: Math.round(lightOffset * 0.3),
      };
    }
  }

  for (let y = 0; y < size; y++) {
    const tileY = Math.min(Math.floor(y / tileSize), tilesPerSide - 1);
    const localY = y % tileSize;
    const isGroutY = localY < groutWidth || localY >= tileSize - groutWidth;

    for (let x = 0; x < size; x++) {
      const tileX = Math.min(Math.floor(x / tileSize), tilesPerSide - 1);
      const localX = x % tileSize;
      const isGroutX = localX < groutWidth || localX >= tileSize - groutWidth;

      const idx = (y * size + x) * 4;

      if (isGroutX || isGroutY) {
        // Grout seam pixel
        data[idx] = groutR;
        data[idx + 1] = groutG;
        data[idx + 2] = groutB;
        data[idx + 3] = 255;
      } else {
        // Tile interior with subtle variation & micro-grain
        const tileVar = tileVariations[tileY][tileX];
        // Subtle high-frequency surface noise (+-3)
        const grain = ((x * 37 + y * 73) % 7) - 3;

        const r = Math.min(255, Math.max(0, baseR + tileVar.rOffset + grain));
        const g = Math.min(255, Math.max(0, baseG + tileVar.gOffset + Math.round(grain * 0.4)));
        const b = Math.min(255, Math.max(0, baseB + tileVar.bOffset + Math.round(grain * 0.3)));

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  // Bytes are authored in sRGB (base hex #BD4F33); without this the renderer
  // treats them as linear and the pavement renders too dark.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates a procedural DataTexture for road-facing yellow tactile warning strips.
 * Features alternating parallel raised tactile ridges/ribs with highlight and groove shading.
 */
export function createTactileStripTexture(
  options: TactileTextureOptions = {}
): THREE.DataTexture {
  const width = options.width ?? 128;
  const height = options.height ?? 128;
  const ribCount = options.ribCount ?? 8;
  const ribHeight = Math.floor(height / ribCount);

  const data = new Uint8Array(width * height * 4);

  // Muted saturated yellow base (#DCA81A)
  const baseR = (TACTILE_YELLOW_HEX >> 16) & 255; // 220
  const baseG = (TACTILE_YELLOW_HEX >> 8) & 255;  // 168
  const baseB = TACTILE_YELLOW_HEX & 255;         // 26

  for (let y = 0; y < height; y++) {
    const localY = y % ribHeight;
    const ribFraction = localY / ribHeight; // 0.0 to 1.0 across the rib profile

    // Tactile rib profile: raised crest with highlight, bevel slope, and recessed groove
    let r = baseR;
    let g = baseG;
    let b = baseB;

    if (ribFraction < 0.45) {
      // Raised ridge crest (illuminated tactile rib)
      r = Math.min(255, baseR + 20);
      g = Math.min(255, baseG + 20);
      b = Math.min(255, baseB + 14);
    } else if (ribFraction < 0.75) {
      // Nominal base slope
      r = baseR;
      g = baseG;
      b = baseB;
    } else {
      // Recessed tactile groove shadow
      r = Math.max(0, baseR - 35);
      g = Math.max(0, baseG - 32);
      b = Math.max(0, baseB - 14);
    }

    for (let x = 0; x < width; x++) {
      // Add very subtle horizontal grain
      const grain = ((x * 19 + y * 13) % 5) - 2;
      const idx = (y * width + x) * 4;

      data[idx] = Math.min(255, Math.max(0, r + grain));
      data[idx + 1] = Math.min(255, Math.max(0, g + grain));
      data[idx + 2] = Math.min(255, Math.max(0, b + Math.round(grain * 0.5)));
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  // Bytes are authored in sRGB (base hex #DCA81A); without this the renderer
  // treats them as linear and the tactile strip renders too dark.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates the standard matte terracotta pavement material.
 * The terracotta base hex is baked into the texture, so the tint stays neutral:
 * multiplying the map by the same hex would double-darken the pavement.
 */
export function createTerracottaPavementMaterial(
  texture: THREE.Texture
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.88, // Matte, non-glossy paving
    metalness: 0.04,
  });
}

/**
 * Creates the standard matte yellow tactile paving strip material.
 * The yellow base hex is baked into the texture, so the tint stays neutral.
 */
export function createTactileStripMaterial(
  texture: THREE.Texture
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.85,
    metalness: 0.05,
  });
}
