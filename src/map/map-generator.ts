export interface MapConfig {
  gridSize: number;       // Number of plots per row/col (default 4)
  plotSize: number;       // Size of each square plot (default 24)
  roadWidth: number;      // Width of roads separating plots (default 8)
  hasPerimeterRoads?: boolean; // Whether perimeter roads encircle the plots (default true)
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
  plotSize: 72,       // 1.5x larger plot size (72x72 = 5,184 vs 48x48 = 2,304)
  roadWidth: 20,      // Proportionate wide boulevard roads
  hasPerimeterRoads: true,
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

  const { gridSize, plotSize, roadWidth, hasPerimeterRoads = true } = config;
  const numRoads = hasPerimeterRoads ? gridSize + 1 : gridSize - 1;

  // Calculate total map dimensions
  const totalWidth = gridSize * plotSize + (hasPerimeterRoads ? (gridSize + 1) * roadWidth : (gridSize - 1) * roadWidth);
  const totalDepth = totalWidth;

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

  // 1. Calculate Plot coordinates
  const plots: PlotData[] = [];

  // Starting offset for the first plot along an axis
  // If perimeter roads exist, start after the initial perimeter road width
  const startOffset = minX + (hasPerimeterRoads ? roadWidth : 0);
  const step = plotSize + roadWidth;

  // Designated center plot for Central Park (row 2, col 2 -> 0-indexed 1, 1 for 4x4)
  const centerRow = Math.max(0, Math.floor((gridSize - 1) / 2));
  const centerCol = Math.max(0, Math.floor((gridSize - 1) / 2));
  // Designated outer edge plot for Port (bottom edge row gridSize-1, col centerCol + 1)
  const portRow = gridSize - 1;
  const portCol = Math.min(gridSize - 1, centerCol + 1);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const pMinX = startOffset + col * step;
      const pMaxX = pMinX + plotSize;
      const pMinZ = minZ + (hasPerimeterRoads ? roadWidth : 0) + row * step;
      const pMaxZ = pMinZ + plotSize;

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
        width: plotSize,
        depth: plotSize,
        minX: pMinX,
        maxX: pMaxX,
        minZ: pMinZ,
        maxZ: pMaxZ,
        type,
      });
    }
  }

  // 2. Calculate Road coordinates
  const roads: RoadData[] = [];

  // Vertical roads (running north-south along Z axis)
  for (let i = 0; i < numRoads; i++) {
    let rMinX: number;
    if (hasPerimeterRoads) {
      rMinX = minX + i * (plotSize + roadWidth);
    } else {
      rMinX = minX + plotSize + i * (plotSize + roadWidth);
    }
    const rCenterX = rMinX + roadWidth / 2;

    roads.push({
      id: `road-v-${i}`,
      type: "vertical",
      index: i,
      x: rCenterX,
      z: 0,
      width: roadWidth,
      depth: totalDepth,
    });
  }

  // Horizontal roads (running east-west along X axis)
  for (let i = 0; i < numRoads; i++) {
    let rMinZ: number;
    if (hasPerimeterRoads) {
      rMinZ = minZ + i * (plotSize + roadWidth);
    } else {
      rMinZ = minZ + plotSize + i * (plotSize + roadWidth);
    }
    const rCenterZ = rMinZ + roadWidth / 2;

    roads.push({
      id: `road-h-${i}`,
      type: "horizontal",
      index: i,
      x: 0,
      z: rCenterZ,
      width: totalWidth,
      depth: roadWidth,
    });
  }

  return {
    config,
    plots,
    roads,
    bounds,
  };
}
