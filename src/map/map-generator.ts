export interface MapConfig {
  gridSize: number;       // Number of plots per row/col (default 4)
  plotSize: number;       // Size of each square plot (default 72)
  roadWidth: number;      // Width of roads separating plots (default 20)
  hasPerimeterRoads?: boolean; // Whether perimeter roads encircle the plots (default true)
  parkSizeMultiplier?: number; // Multiplier for park plot size (default 2 for 2x size)
}

export type PlotType = "park" | "building" | "port" | "empty";

export interface PlotData {
  id: string;
  row: number;
  col: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  type: PlotType;
}

export interface RoadData {
  id: string;
  type: "horizontal" | "vertical";
  index: number;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  totalWidth: number;
  totalDepth: number;
}

export interface GeneratedMap {
  config: MapConfig;
  plots: PlotData[];
  roads: RoadData[];
  bounds: MapBounds;
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  gridSize: 4,
  plotSize: 72,       // Standard plot size (72x72)
  roadWidth: 20,      // Proportionate wide boulevard roads
  hasPerimeterRoads: true,
  parkSizeMultiplier: 2, // Central Park is 2x current size (144x144)
};

/**
 * Pure mathematical data-driven map generator.
 * Generates an N x N grid of large plots separated by wide road surfaces.
 */
export function generateMap(customConfig?: Partial<MapConfig>): GeneratedMap {
  const config: MapConfig = {
    ...DEFAULT_MAP_CONFIG,
    ...customConfig,
  };

  // If customConfig explicitly provides plotSize but omits parkSizeMultiplier,
  // default parkSizeMultiplier to 1 for custom uniform-grid test cases.
  if (customConfig?.plotSize !== undefined && customConfig?.parkSizeMultiplier === undefined) {
    config.parkSizeMultiplier = 1;
  }

  const { gridSize, plotSize, roadWidth, hasPerimeterRoads = true, parkSizeMultiplier = 2 } = config;

  // Designated center plot for Central Park (row 2, col 2 -> 0-indexed 1, 1 for 4x4)
  const centerRow = Math.max(0, Math.floor((gridSize - 1) / 2));
  const centerCol = Math.max(0, Math.floor((gridSize - 1) / 2));
  // Designated outer edge plot for Port (bottom edge row gridSize-1, col centerCol + 1)
  const portRow = gridSize - 1;
  const portCol = Math.min(gridSize - 1, centerCol + 1);

  // Column widths and Row depths (Central Park column and row scale by parkSizeMultiplier)
  const colWidths = Array.from({ length: gridSize }, (_, c) =>
    c === centerCol ? plotSize * parkSizeMultiplier : plotSize
  );
  const rowDepths = Array.from({ length: gridSize }, (_, r) =>
    r === centerRow ? plotSize * parkSizeMultiplier : plotSize
  );

  const sumColWidths = colWidths.reduce((a, b) => a + b, 0);
  const sumRowDepths = rowDepths.reduce((a, b) => a + b, 0);

  // Calculate total map dimensions
  const totalWidth = sumColWidths + (hasPerimeterRoads ? (gridSize + 1) * roadWidth : (gridSize - 1) * roadWidth);
  const totalDepth = sumRowDepths + (hasPerimeterRoads ? (gridSize + 1) * roadWidth : (gridSize - 1) * roadWidth);

  const minX = -totalWidth / 2;
  const maxX = totalWidth / 2;
  const minZ = -totalDepth / 2;
  const maxZ = totalDepth / 2;

  const bounds: MapBounds = {
    minX,
    maxX,
    minZ,
    maxZ,
    totalWidth,
    totalDepth,
  };

  // 1. Calculate Road coordinates
  const roads: RoadData[] = [];
  const roadXs: { minX: number; centerX: number }[] = [];
  const roadZs: { minZ: number; centerZ: number }[] = [];

  if (hasPerimeterRoads) {
    let currX = minX;
    for (let i = 0; i <= gridSize; i++) {
      roadXs.push({ minX: currX, centerX: currX + roadWidth / 2 });
      roads.push({
        id: `road-v-${i}`,
        type: "vertical",
        index: i,
        x: currX + roadWidth / 2,
        z: 0,
        width: roadWidth,
        depth: totalDepth,
      });
      if (i < gridSize) {
        currX += roadWidth + colWidths[i];
      }
    }

    let currZ = minZ;
    for (let i = 0; i <= gridSize; i++) {
      roadZs.push({ minZ: currZ, centerZ: currZ + roadWidth / 2 });
      roads.push({
        id: `road-h-${i}`,
        type: "horizontal",
        index: i,
        x: 0,
        z: currZ + roadWidth / 2,
        width: totalWidth,
        depth: roadWidth,
      });
      if (i < gridSize) {
        currZ += roadWidth + rowDepths[i];
      }
    }
  } else {
    let currX = minX;
    for (let i = 0; i < gridSize - 1; i++) {
      currX += colWidths[i];
      roadXs.push({ minX: currX, centerX: currX + roadWidth / 2 });
      roads.push({
        id: `road-v-${i}`,
        type: "vertical",
        index: i,
        x: currX + roadWidth / 2,
        z: 0,
        width: roadWidth,
        depth: totalDepth,
      });
      currX += roadWidth;
    }

    let currZ = minZ;
    for (let i = 0; i < gridSize - 1; i++) {
      currZ += rowDepths[i];
      roadZs.push({ minZ: currZ, centerZ: currZ + roadWidth / 2 });
      roads.push({
        id: `road-h-${i}`,
        type: "horizontal",
        index: i,
        x: 0,
        z: currZ + roadWidth / 2,
        width: totalWidth,
        depth: roadWidth,
      });
      currZ += roadWidth;
    }
  }

  // 2. Calculate Plot coordinates
  const plots: PlotData[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      let pMinX: number;
      let pMinZ: number;

      if (hasPerimeterRoads) {
        pMinX = roadXs[col].minX + roadWidth;
        pMinZ = roadZs[row].minZ + roadWidth;
      } else {
        pMinX = col === 0 ? minX : roadXs[col - 1].minX + roadWidth;
        pMinZ = row === 0 ? minZ : roadZs[row - 1].minZ + roadWidth;
      }

      const pW = colWidths[col];
      const pD = rowDepths[row];
      const pMaxX = pMinX + pW;
      const pMaxZ = pMinZ + pD;

      const centerX = (pMinX + pMaxX) / 2;
      const centerZ = (pMinZ + pMaxZ) / 2;

      let type: PlotType = "building";
      if (row === centerRow && col === centerCol) {
        type = "park";
      } else if (row === portRow && col === portCol) {
        type = "port";
      }

      plots.push({
        id: `plot-${row}-${col}`,
        row,
        col,
        x: centerX,
        z: centerZ,
        width: pW,
        depth: pD,
        minX: pMinX,
        maxX: pMaxX,
        minZ: pMinZ,
        maxZ: pMaxZ,
        type,
      });
    }
  }

  return {
    config,
    plots,
    roads,
    bounds,
  };
}

/**
 * Default player spawn point: on the central park lawn, a little south of the
 * memorial so the character loads inside the green — not on the terracotta
 * perimeter footpath — facing into the park (+Z).
 *
 * Falls back to the map origin when the generated map has no park plot.
 */
export function getParkSpawnPoint(map: GeneratedMap): { x: number; z: number } {
  const park = map.plots.find((plot) => plot.type === "park");
  if (!park) return { x: 0, z: 0 };

  // Central green lawn (see map-mesh-builder): 116 on the 2x park, 58 otherwise.
  const lawnSize = Math.min(park.width, park.depth) >= 120 ? 116 : 58;
  const lawnHalf = lawnSize / 2;

  // Memorial plinth radius (park-features) + player collision radius.
  const memorialClearance = 13.5 + 0.7;

  // Two thirds out from the centre: clear of the plinth, planters and tables,
  // but at least 2 units short of the lawn edge so we never land on the path.
  const offset = Math.min(
    Math.max(lawnHalf * 0.66, memorialClearance + 1),
    lawnHalf - 2
  );

  return { x: park.x, z: park.z - offset };
}
