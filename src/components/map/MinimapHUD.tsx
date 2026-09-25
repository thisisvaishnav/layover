"use client";

import { useEffect, useRef, useState } from "react";
import type { GeneratedMap } from "../../map/map-generator";
import type { Vector2D } from "../../player/movement-controller";
import {
  worldToMinimap,
  playerRotationToMinimapHeading,
  clampToMinimapCircle,
  MINIMAP_DEFAULT_CONFIG,
} from "../../map/minimap-math";

export interface MinimapHUDProps {
  mapData: GeneratedMap;
  playerPosition?: Vector2D;
  playerRotation?: number;
  playerStateRef?: React.RefObject<{ position: Vector2D; rotation: number }>;
  radius?: number;
  padding?: number;
  initialScale?: number;
  onScaleChange?: (newScale: number) => void;
}

/**
 * GTA V-style circular, fixed North-Up minimap HUD.
 * - Fixed to the bottom-right corner of the viewport.
 * - Renders existing map data (roads, buildings, central park, port).
 * - Fixed North-Up: only the player marker rotates.
 * - Main 3D camera zoom does not affect minimap scale.
 * - Configurable zoom scale.
 * - Lightweight HTML5 2D Canvas with cached static base map layer.
 */
export default function MinimapHUD({
  mapData,
  playerPosition = { x: 0, z: 0 },
  playerRotation = 0,
  playerStateRef,
  radius = 96,
  padding = MINIMAP_DEFAULT_CONFIG.padding,
  initialScale = 1.0,
  onScaleChange,
}: MinimapHUDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(initialScale);
  const [coords, setCoords] = useState<{ x: number; z: number }>({
    x: Math.round(playerPosition.x),
    z: Math.round(playerPosition.z),
  });

  const handleZoomIn = () => {
    const next = Math.min(2.0, Math.round((scale + 0.2) * 10) / 10);
    setScale(next);
    onScaleChange?.(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.7, Math.round((scale - 0.2) * 10) / 10);
    setScale(next);
    onScaleChange?.(next);
  };

  // 1. Pre-render static base map (roads, buildings, park, port) whenever mapData or scale changes
  useEffect(() => {
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const size = radius * 2;

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = size * dpr;
    baseCanvas.height = size * dpr;
    const ctx = baseCanvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Circular clipping for base map
    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    // Map background (dark city grid)
    ctx.fillStyle = "#0c101c";
    ctx.fillRect(0, 0, size, size);

    // A. Render Roads
    ctx.fillStyle = "#1e2638";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;

    for (const road of mapData.roads) {
      if (road.type === "vertical") {
        // Vertical road runs North-South
        const pTop = worldToMinimap(
          { x: road.x - road.width / 2, z: mapData.bounds.maxZ },
          mapData.bounds,
          radius,
          padding,
          scale
        );
        const pBottom = worldToMinimap(
          { x: road.x + road.width / 2, z: mapData.bounds.minZ },
          mapData.bounds,
          radius,
          padding,
          scale
        );
        const rw = pBottom.x - pTop.x;
        const rh = pBottom.y - pTop.y;
        ctx.fillRect(pTop.x, pTop.y, rw, rh);
      } else {
        // Horizontal road runs East-West
        const pLeft = worldToMinimap(
          { x: mapData.bounds.minX, z: road.z + road.depth / 2 },
          mapData.bounds,
          radius,
          padding,
          scale
        );
        const pRight = worldToMinimap(
          { x: mapData.bounds.maxX, z: road.z - road.depth / 2 },
          mapData.bounds,
          radius,
          padding,
          scale
        );
        const rw = pRight.x - pLeft.x;
        const rh = pRight.y - pLeft.y;
        ctx.fillRect(pLeft.x, pLeft.y, rw, rh);
      }
    }

    // B. Render Plots
    for (const plot of mapData.plots) {
      const tl = worldToMinimap(
        { x: plot.minX, z: plot.maxZ },
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const br = worldToMinimap(
        { x: plot.maxX, z: plot.minZ },
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const pw = br.x - tl.x;
      const ph = br.y - tl.y;

      if (plot.type === "park") {
        // Central Park
        ctx.fillStyle = "#14462a";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Park lawn inner section
        ctx.fillStyle = "#1e683e";
        const margin = pw * 0.12;
        ctx.fillRect(tl.x + margin, tl.y + margin, pw - margin * 2, ph - margin * 2);

        // Park footpaths
        ctx.strokeStyle = "#c2a677";
        ctx.lineWidth = Math.max(1, pw * 0.05);
        ctx.strokeRect(tl.x + margin, tl.y + margin, pw - margin * 2, ph - margin * 2);

        // Cross path in park center
        ctx.beginPath();
        ctx.moveTo(tl.x + pw / 2, tl.y + margin);
        ctx.lineTo(tl.x + pw / 2, tl.y + ph - margin);
        ctx.moveTo(tl.x + margin, tl.y + ph / 2);
        ctx.lineTo(tl.x + pw - margin, tl.y + ph / 2);
        ctx.stroke();

        ctx.strokeStyle = "#2e8852";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else if (plot.type === "port") {
        // Port & Water Basin
        ctx.fillStyle = "#0f365d";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Water surface
        ctx.fillStyle = "#1a5286";
        ctx.fillRect(tl.x + 2, tl.y + 2, pw - 4, ph - 4);

        // Wooden dock piers
        ctx.fillStyle = "#96754b";
        ctx.fillRect(tl.x + pw * 0.3, tl.y + ph * 0.2, pw * 0.4, ph * 0.6);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else {
        // Standard Building Blocks
        ctx.fillStyle = "#273349";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Inner building architectural roof footprint
        ctx.fillStyle = "#384762";
        const bMargin = Math.max(1.5, pw * 0.08);
        ctx.fillRect(tl.x + bMargin, tl.y + bMargin, pw - bMargin * 2, ph - bMargin * 2);

        ctx.strokeStyle = "#4b5f82";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      }
    }

    ctx.restore();
    baseMapCanvasRef.current = baseCanvas;
  }, [mapData, scale, radius, padding]);

  // 2. Dynamic render loop: Blit static map and draw rotating player marker
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let throttleCounter = 0;

    const renderMinimapFrame = (pos: Vector2D, rot: number) => {
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const size = radius * 2;

      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // A. Draw cached base map
      if (baseMapCanvasRef.current) {
        ctx.drawImage(baseMapCanvasRef.current, 0, 0, size, size);
      }

      // B. Concentric Radar Rings & Crosshairs
      ctx.save();
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(radius, radius, radius * 0.45, 0, Math.PI * 2);
      ctx.arc(radius, radius, radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      // Axis crosshair ticks
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.moveTo(radius, 6);
      ctx.lineTo(radius, 14);
      ctx.moveTo(radius, size - 14);
      ctx.lineTo(radius, size - 6);
      ctx.moveTo(6, radius);
      ctx.lineTo(14, radius);
      ctx.moveTo(size - 14, radius);
      ctx.lineTo(size - 6, radius);
      ctx.stroke();

      // C. Calculate Player Marker Position & Rotation
      const rawMinimapPos = worldToMinimap(
        pos,
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const clampedPos = clampToMinimapCircle(
        rawMinimapPos,
        { x: radius, y: radius },
        radius,
        6
      );
      const markerAngle = playerRotationToMinimapHeading(rot);

      // D. Render Directional Player Arrow (GTA V Chevron Style)
      ctx.save();
      ctx.translate(clampedPos.x, clampedPos.y);
      ctx.rotate(markerAngle);

      // Subtle pulse aura around player
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Directional Arrow Triangle
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5.5, 6);
      ctx.lineTo(0, 3.5);
      ctx.lineTo(-5.5, 6);
      ctx.closePath();

      ctx.fillStyle = "#38bdf8"; // Vibrant Cyan
      ctx.fill();
      ctx.strokeStyle = "#082f49"; // Dark high-contrast border
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.restore(); // Restore player rotation
      ctx.restore(); // Restore circular clip

      // E. Outer Polished Bezel & Compass North Indicator
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // North Indicator Badge at top edge
      ctx.fillStyle = "#ef4444"; // Red North badge
      ctx.beginPath();
      ctx.moveTo(radius, 2);
      ctx.lineTo(radius + 4, 8);
      ctx.lineTo(radius - 4, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("N", radius, 10);

      ctx.restore();
    };

    // If a ref is passed, run a smooth requestAnimationFrame loop
    if (playerStateRef) {
      const loop = () => {
        const cur = playerStateRef.current;
        if (cur) {
          renderMinimapFrame(cur.position, cur.rotation);
          throttleCounter++;
          if (throttleCounter % 15 === 0) {
            const nx = Math.round(cur.position.x);
            const nz = Math.round(cur.position.z);
            setCoords((prev) => (prev.x === nx && prev.z === nz ? prev : { x: nx, z: nz }));
          }
        }
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    } else {
      // Direct prop driven render
      renderMinimapFrame(playerPosition, playerRotation);
    }
  }, [playerStateRef, playerPosition, playerRotation, mapData.bounds, radius, padding, scale]);

  return (
    <div
      className="fixed bottom-6 right-6 z-30 select-none flex flex-col items-end gap-2 group"
      aria-label="GTA V Minimap HUD"
    >
      {/* Zoom Controls Overlay (appears on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-lg text-[10px] font-mono text-white/80">
        <button
          onClick={handleZoomIn}
          title="Zoom Minimap In"
          aria-label="Zoom Minimap In"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors font-bold cursor-pointer"
        >
          +
        </button>
        <span className="px-1 text-white/90">{Math.round(scale * 100)}%</span>
        <button
          onClick={handleZoomOut}
          title="Zoom Minimap Out"
          aria-label="Zoom Minimap Out"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors font-bold cursor-pointer"
        >
          −
        </button>
      </div>

      {/* Circular Radar Container */}
      <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-2xl bg-slate-950/90 backdrop-blur-md border border-white/20">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
        />
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-white/10 to-transparent" />
      </div>

      {/* Coordinate & Landmark Footer Badge */}
      <div className="bg-slate-950/85 backdrop-blur border border-white/15 px-2.5 py-0.5 rounded shadow text-[10px] font-mono text-white/70 flex items-center gap-2">
        <span className="text-sky-400 font-semibold">16 PLOTS</span>
        <span>X: {coords.x}</span>
        <span>Z: {coords.z}</span>
      </div>
    </div>
  );
}
