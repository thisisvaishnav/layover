"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Position3D } from "@/lib/world/types";
import {
  EXPANDED_WORLD_BOUNDS,
  ROAD_SYSTEM_CONFIG,
  worldToMinimapCoords,
  computeCarPosition,
} from "@/lib/world/city-expansion";
import { UNIFIED_PLAZA_HOTSPOTS } from "@/lib/world/unified-plaza";
import { Compass, Maximize2, Minimize2, MapPin } from "lucide-react";

export interface MinimapHUDHandle {
  updatePlayer: (pos: Position3D, rotation: number) => void;
}

interface MinimapHUDProps {
  currentZone?: string;
  className?: string;
}

export const MinimapHUD = forwardRef<MinimapHUDHandle, MinimapHUDProps>(function MinimapHUD(
  { currentZone = "cafe", className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerStateRef = useRef<{ pos: Position3D; rotation: number }>({
    pos: { x: -14, y: 0, z: 2 },
    rotation: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [coordsDisplay, setCoordsDisplay] = useState("X: -14.0, Z: 2.0");

  // Imperative handle for 60fps zero-react-overhead player updates
  useImperativeHandle(ref, () => ({
    updatePlayer: (pos: Position3D, rotation: number) => {
      playerStateRef.current.pos = pos;
      playerStateRef.current.rotation = rotation;
    },
  }));

  // Update low-frequency text coordinates every 200ms without triggering unnecessary re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerStateRef.current.pos;
      const formatted = `X: ${p.x.toFixed(1)}, Z: ${p.z.toFixed(1)}`;
      setCoordsDisplay((prev) => (prev === formatted ? prev : formatted));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 60fps 2D Canvas Radar Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const renderRadar = () => {
      animId = requestAnimationFrame(renderRadar);
      const width = canvas.width;
      const height = canvas.height;
      // Absolute epoch timestamp in lockstep with Three.js scene-builder
      const elapsed = performance.now() / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Radar Background & Border Grid
      ctx.fillStyle = "#0c1322"; // Deep dark navy slate
      ctx.fillRect(0, 0, width, height);

      // Batched coordinate grid lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 20) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Zone Footprints
      // Café Zone (West - Amber)
      const cafeMin = worldToMinimapCoords({ x: -24, y: 0, z: -10 }, EXPANDED_WORLD_BOUNDS, width, height);
      const cafeMax = worldToMinimapCoords({ x: -6, y: 0, z: 4.5 }, EXPANDED_WORLD_BOUNDS, width, height);
      ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.fillRect(cafeMin.u, cafeMin.v, cafeMax.u - cafeMin.u, cafeMax.v - cafeMin.v);
      ctx.strokeRect(cafeMin.u, cafeMin.v, cafeMax.u - cafeMin.u, cafeMax.v - cafeMin.v);

      // Bus Stop Hub (Center - Emerald/Cyan)
      const busMin = worldToMinimapCoords({ x: -6, y: 0, z: -10 }, EXPANDED_WORLD_BOUNDS, width, height);
      const busMax = worldToMinimapCoords({ x: 6, y: 0, z: 4.5 }, EXPANDED_WORLD_BOUNDS, width, height);
      ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
      ctx.fillRect(busMin.u, busMin.v, busMax.u - busMin.u, busMax.v - busMin.v);
      ctx.strokeRect(busMin.u, busMin.v, busMax.u - busMin.u, busMax.v - busMin.v);

      // Airport Gate Zone (East - Sky Blue)
      const airMin = worldToMinimapCoords({ x: 6, y: 0, z: -10 }, EXPANDED_WORLD_BOUNDS, width, height);
      const airMax = worldToMinimapCoords({ x: 24, y: 0, z: 4.5 }, EXPANDED_WORLD_BOUNDS, width, height);
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.fillRect(airMin.u, airMin.v, airMax.u - airMin.u, airMax.v - airMin.v);
      ctx.strokeRect(airMin.u, airMin.v, airMax.u - airMin.u, airMax.v - airMin.v);

      // 3. Multi-lane Active Roadway
      const roadTop = worldToMinimapCoords({ x: -50, y: 0, z: ROAD_SYSTEM_CONFIG.curbNorthZ }, EXPANDED_WORLD_BOUNDS, width, height);
      const roadBottom = worldToMinimapCoords({ x: 50, y: 0, z: ROAD_SYSTEM_CONFIG.curbSouthZ }, EXPANDED_WORLD_BOUNDS, width, height);
      ctx.fillStyle = "#1e293b"; // Asphalt
      ctx.fillRect(0, roadTop.v, width, roadBottom.v - roadTop.v);

      // Center divider dashed line
      const roadCenter = worldToMinimapCoords({ x: 0, y: 0, z: ROAD_SYSTEM_CONFIG.roadCenterZ }, EXPANDED_WORLD_BOUNDS, width, height);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, roadCenter.v);
      ctx.lineTo(width, roadCenter.v);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Road curbs
      ctx.strokeStyle = "#fbbf24"; // Yellow curb line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, roadTop.v);
      ctx.lineTo(width, roadTop.v);
      ctx.stroke();

      // 4. Street Lamps
      ROAD_SYSTEM_CONFIG.streetLamps.forEach((lamp) => {
        const pt = worldToMinimapCoords(lamp.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Traffic Lights
      ROAD_SYSTEM_CONFIG.trafficLights.forEach((tl) => {
        const pt = worldToMinimapCoords(tl.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = tl.initialState === "red" ? "#ef4444" : "#22c55e";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Moving Cars on Minimap (Zero per-frame allocations with precomputed colorCss)
      ROAD_SYSTEM_CONFIG.cars.forEach((car) => {
        const carPos = computeCarPosition(car, elapsed);
        const pt = worldToMinimapCoords(carPos, EXPANDED_WORLD_BOUNDS, width, height);

        ctx.fillStyle = car.colorCss;
        ctx.fillRect(pt.u - 3, pt.v - 1.5, 6, 3);
      });

      // 7. Interactive Hotspot Markers
      UNIFIED_PLAZA_HOTSPOTS.forEach((spot) => {
        const pt = worldToMinimapCoords(spot.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = spot.npcName ? "#fbbf24" : "#34d399";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. Player Live Location & Pulsing Radar Indicator
      const playerPos = playerStateRef.current.pos;
      const playerRot = playerStateRef.current.rotation;
      const playerPt = worldToMinimapCoords(playerPos, EXPANDED_WORLD_BOUNDS, width, height);

      // Radar pulse ring
      const pulseSize = 4 + (Math.sin(elapsed * 4) + 1) * 3;
      ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(playerPt.u, playerPt.v, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Player core dot
      ctx.fillStyle = "#10b981"; // Emerald
      ctx.beginPath();
      ctx.arc(playerPt.u, playerPt.v, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow pointer
      ctx.save();
      ctx.translate(playerPt.u, playerPt.v);
      // Map Three.js rotation (y-axis) to 2D canvas rotation
      ctx.rotate(-playerRot + Math.PI / 2);
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.moveTo(5.5, 0);
      ctx.lineTo(-2, -3);
      ctx.lineTo(-2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, []);

  const mapWidth = isExpanded ? 320 : 220;
  const mapHeight = isExpanded ? 200 : 140;

  return (
    <div
      className={`absolute bottom-4 left-4 z-20 select-none transition-all duration-300 ${
        className || ""
      }`}
    >
      <div className="bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-2.5 flex flex-col gap-2">
        {/* Header HUD */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-[11px] font-bold text-stone-200 tracking-wide uppercase">
              District Radar
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              LIVE
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              title={isExpanded ? "Collapse Minimap" : "Expand Minimap"}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 2D Canvas Radar Frame */}
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
          <canvas
            ref={canvasRef}
            width={mapWidth}
            height={mapHeight}
            className="block"
            style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
          />

          {/* Zone Labels on Map */}
          <div className="absolute top-1.5 left-2 text-[9px] font-bold text-amber-400/90 drop-shadow">
            ☕ Café
          </div>
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-400/90 drop-shadow">
            🚏 Bus Hub
          </div>
          <div className="absolute top-1.5 right-2 text-[9px] font-bold text-sky-400/90 drop-shadow">
            ✈️ Airport
          </div>
          <div className="absolute bottom-2 left-2 text-[8px] font-semibold text-stone-400 drop-shadow flex items-center gap-1">
            <span>🚗 Boulevard</span>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="flex items-center justify-between px-1 text-[10px] text-stone-400 font-mono">
          <div className="flex items-center gap-1 text-emerald-400">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">
              {currentZone === "cafe"
                ? "Café Plaza"
                : currentZone === "airport"
                ? "Airport Gate"
                : "Bus Terminal"}
            </span>
          </div>
          <span>{coordsDisplay}</span>
        </div>
      </div>
    </div>
  );
});
