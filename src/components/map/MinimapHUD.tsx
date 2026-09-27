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
import { COFFEE_SHOP_WORLD_POSITION } from "../../scenarios/coffee-shop-scenario";
import { BUS_STOP_WORLD_POSITION } from "../../scenarios/bus-stop-scenario";
import { TAXI_STAND_WORLD_POSITION } from "../../scenarios/taxi-stand-scenario";
import { BARBER_SHOP_WORLD_POSITION } from "../../scenarios/barber-shop-scenario";
import { getCountryMinimapBuildingColors } from "../../map/country-building-architectures";

export interface MinimapHUDProps {
  mapData: GeneratedMap;
  playerPosition?: Vector2D;
  playerRotation?: number;
  playerStateRef?: React.RefObject<{ position: Vector2D; rotation: number }>;
  radius?: number;
  padding?: number;
  initialScale?: number;
  countryCode?: string;
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
/** Stable identity for the default position: an inline `{ x: 0, z: 0 }` default would be a
 * new object every render, changing the render-loop effect's deps and restarting the rAF
 * loop (resetting its throttle counter) on every parent re-render. */
const DEFAULT_PLAYER_POSITION: Vector2D = { x: 0, z: 0 };

export default function MinimapHUD({
  mapData,
  playerPosition = DEFAULT_PLAYER_POSITION,
  playerRotation = 0,
  playerStateRef,
  radius = 96,
  padding = MINIMAP_DEFAULT_CONFIG.padding,
  initialScale = 1.0,
  countryCode,
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

    // Map background (clean modern city grid)
    ctx.fillStyle = "#161e2e";
    ctx.fillRect(0, 0, size, size);

    // A. Render Roads
    ctx.fillStyle = "#2d374d";
    ctx.strokeStyle = "#475569";
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
        ctx.fillStyle = "#1b5936";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Park lawn inner section
        ctx.fillStyle = "#277a4a";
        const margin = pw * 0.12;
        ctx.fillRect(tl.x + margin, tl.y + margin, pw - margin * 2, ph - margin * 2);

        // Park footpaths (warm terracotta)
        ctx.strokeStyle = "#c05436";
        ctx.lineWidth = Math.max(1, pw * 0.05);
        ctx.strokeRect(tl.x + margin, tl.y + margin, pw - margin * 2, ph - margin * 2);

        // Cross path in park center
        ctx.beginPath();
        ctx.moveTo(tl.x + pw / 2, tl.y + margin);
        ctx.lineTo(tl.x + pw / 2, tl.y + ph - margin);
        ctx.moveTo(tl.x + margin, tl.y + ph / 2);
        ctx.lineTo(tl.x + pw - margin, tl.y + ph / 2);
        ctx.stroke();

        ctx.strokeStyle = "#34a864";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else if (plot.type === "port") {
        // Port & Water Basin
        ctx.fillStyle = "#144e82";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Water surface
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(tl.x + 2, tl.y + 2, pw - 4, ph - 4);

        // Wooden dock piers
        ctx.fillStyle = "#b48554";
        ctx.fillRect(tl.x + pw * 0.3, tl.y + ph * 0.2, pw * 0.4, ph * 0.6);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else if (plot.id === "plot-0-0") {
        // Central Taxi Terminal & Transit Hub Plot
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // North Terminal Portico footprint
        ctx.fillStyle = "#475569";
        ctx.fillRect(tl.x + pw * 0.06, tl.y + ph * 0.06, pw * 0.88, ph * 0.20);

        // South Terminal Concourse footprint
        ctx.fillRect(tl.x + pw * 0.06, tl.y + ph * 0.74, pw * 0.88, ph * 0.20);

        // Center Taxi Plaza & Bay pavement
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(tl.x + pw * 0.06, tl.y + ph * 0.30, pw * 0.88, ph * 0.40);

        // Taxi bay markings & yellow lot boundary
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(tl.x + pw * 0.08, tl.y + ph * 0.32, pw * 0.84, ph * 0.36);

        // Elevated skybridge connecting North and South concourses
        ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
        ctx.fillRect(tl.x + pw * 0.38, tl.y + ph * 0.26, pw * 0.24, ph * 0.48);

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else if (plot.id === "plot-1-0") {
        // Multi-story Parking Garage Plot
        ctx.fillStyle = "#27303f";
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // L-shaped parking garage footprint (North and West)
        ctx.fillStyle = "#4b5563";
        // North bar
        ctx.fillRect(tl.x + pw * 0.05, tl.y + ph * 0.05, pw * 0.9, ph * 0.45);
        // West bar
        ctx.fillRect(tl.x + pw * 0.05, tl.y + ph * 0.05, pw * 0.45, ph * 0.9);

        // South-East parking apron pavement
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(tl.x + pw * 0.52, tl.y + ph * 0.52, pw * 0.43, ph * 0.43);

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      } else {
        // Standard Building Blocks (country-adapted palette)
        const bColors = getCountryMinimapBuildingColors(countryCode);
        ctx.fillStyle = bColors.base;
        ctx.fillRect(tl.x, tl.y, pw, ph);

        // Inner building architectural roof footprint
        ctx.fillStyle = bColors.roof;
        const bMargin = Math.max(1.5, pw * 0.08);
        ctx.fillRect(tl.x + bMargin, tl.y + bMargin, pw - bMargin * 2, ph - bMargin * 2);

        ctx.strokeStyle = bColors.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(tl.x, tl.y, pw, ph);
      }
    }

    ctx.restore();
    baseMapCanvasRef.current = baseCanvas;
  }, [mapData, scale, radius, padding, countryCode]);

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

      // D1. Render Coffee Shop / Stall POI Marker
      const shopMinimapPos = worldToMinimap(
        COFFEE_SHOP_WORLD_POSITION,
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const clampedShopPos = clampToMinimapCircle(
        shopMinimapPos,
        { x: radius, y: radius },
        radius,
        8
      );

      ctx.save();
      ctx.translate(clampedShopPos.x, clampedShopPos.y);

      // Amber glowing pulse halo
      ctx.fillStyle = "rgba(245, 197, 24, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Golden pin circle
      ctx.fillStyle = "#f59e0b"; // Warm amber
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // D2. Render Bus Stop POI Marker (Transit Cyan/Blue pin)
      const busMinimapPos = worldToMinimap(
        BUS_STOP_WORLD_POSITION,
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const clampedBusPos = clampToMinimapCircle(
        busMinimapPos,
        { x: radius, y: radius },
        radius,
        8
      );

      ctx.save();
      ctx.translate(clampedBusPos.x, clampedBusPos.y);

      // Cyan glowing pulse halo
      ctx.fillStyle = "rgba(14, 165, 233, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Sky blue transit pin circle
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // D3. Render Taxi Stand POI Marker (Vibrant Taxi Yellow pin)
      const taxiMinimapPos = worldToMinimap(
        TAXI_STAND_WORLD_POSITION,
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const clampedTaxiPos = clampToMinimapCircle(
        taxiMinimapPos,
        { x: radius, y: radius },
        radius,
        8
      );

      ctx.save();
      ctx.translate(clampedTaxiPos.x, clampedTaxiPos.y);

      // Yellow glowing pulse halo
      ctx.fillStyle = "rgba(250, 204, 21, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Taxi yellow pin circle
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center black dot for taxi contrast
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
 
      // D4. Render Barber Shop POI Marker (Deep Crimson / Barber Pole pin)
      const barberMinimapPos = worldToMinimap(
        BARBER_SHOP_WORLD_POSITION,
        mapData.bounds,
        radius,
        padding,
        scale
      );
      const clampedBarberPos = clampToMinimapCircle(
        barberMinimapPos,
        { x: radius, y: radius },
        radius,
        8
      );

      ctx.save();
      ctx.translate(clampedBarberPos.x, clampedBarberPos.y);

      // Crimson glowing pulse halo
      ctx.fillStyle = "rgba(220, 38, 38, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Crimson pin circle
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center white dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // D5. Render Directional Player Arrow (GTA V Chevron Style)
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
