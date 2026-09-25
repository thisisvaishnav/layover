"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Position3D } from "@/lib/world/types";
import {
  EXPANDED_WORLD_BOUNDS,
  ROAD_SYSTEM_CONFIG,
  worldToMinimapCoords,
  computeCarPosition,
} from "@/lib/world/city-expansion";
import {
  MAPLE_HOLLOW_DISTRICT_BLOCKS,
  CENTRAL_PARK_CONFIG,
  TOWN_FACILITIES_CONFIG,
  DENSE_TRAFFIC_CONFIG,
  PEDESTRIAN_CONFIG,
  computePedestrianPosition,
} from "@/lib/world/town-park-expansion";
import { UNIFIED_PLAZA_HOTSPOTS } from "@/lib/world/unified-plaza";
import { Compass, Maximize2, Minimize2, Navigation } from "lucide-react";

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
      const elapsed = performance.now() / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Master Canvas Foundation
      ctx.fillStyle = "#090d16"; // Deep Midnight Navy
      ctx.fillRect(0, 0, width, height);

      // Coordinate Grid Lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 22) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 22) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Render Maple Hollow District Blocks
      MAPLE_HOLLOW_DISTRICT_BLOCKS.forEach((district) => {
        const minPt = worldToMinimapCoords(
          { x: district.bounds.minX, y: 0, z: district.bounds.minZ },
          EXPANDED_WORLD_BOUNDS,
          width,
          height
        );
        const maxPt = worldToMinimapCoords(
          { x: district.bounds.maxX, y: 0, z: district.bounds.maxZ },
          EXPANDED_WORLD_BOUNDS,
          width,
          height
        );

        const blockW = maxPt.u - minPt.u;
        const blockH = maxPt.v - minPt.v;

        // Block background with district tint
        ctx.fillStyle = district.color + "18"; // ~10% opacity
        ctx.fillRect(minPt.u, minPt.v, blockW, blockH);

        // Block perimeter border
        ctx.strokeStyle = district.color + "44"; // ~27% opacity
        ctx.lineWidth = 1;
        ctx.strokeRect(minPt.u, minPt.v, blockW, blockH);

        // District title text
        if (blockW > 35 && blockH > 20) {
          ctx.fillStyle = district.color + "cc";
          ctx.font = "bold 8px system-ui, sans-serif";
          ctx.fillText(district.name, minPt.u + 4, minPt.v + 10);
        }
      });

      // 3. Central Elm Park & Pond
      const pondPos = worldToMinimapCoords(
        { x: CENTRAL_PARK_CONFIG.pond.x, y: 0, z: CENTRAL_PARK_CONFIG.pond.z },
        EXPANDED_WORLD_BOUNDS,
        width,
        height
      );
      const pondRadiusPx = Math.max(4, (CENTRAL_PARK_CONFIG.pond.radius / 100) * width * 1.8);

      // Water pond
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(pondPos.u, pondPos.v, pondRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Stone rim
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Fountain center dot
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.arc(pondPos.u, pondPos.v, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Multi-Lane Active Transit Boulevard
      const roadTop = worldToMinimapCoords(
        { x: -50, y: 0, z: ROAD_SYSTEM_CONFIG.curbNorthZ },
        EXPANDED_WORLD_BOUNDS,
        width,
        height
      );
      const roadBottom = worldToMinimapCoords(
        { x: 50, y: 0, z: ROAD_SYSTEM_CONFIG.curbSouthZ },
        EXPANDED_WORLD_BOUNDS,
        width,
        height
      );

      ctx.fillStyle = "#1e293b"; // Asphalt
      ctx.fillRect(0, roadTop.v, width, roadBottom.v - roadTop.v);

      // Center lane divider dashed line
      const roadCenter = worldToMinimapCoords(
        { x: 0, y: 0, z: ROAD_SYSTEM_CONFIG.roadCenterZ },
        EXPANDED_WORLD_BOUNDS,
        width,
        height
      );
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, roadCenter.v);
      ctx.lineTo(width, roadCenter.v);
      ctx.stroke();
      ctx.setLineDash([]);

      // Road curbs
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, roadTop.v);
      ctx.lineTo(width, roadTop.v);
      ctx.moveTo(0, roadBottom.v);
      ctx.lineTo(width, roadBottom.v);
      ctx.stroke();

      // Zebra crosswalks
      [-8.0, 0.0, 8.0].forEach((cx) => {
        const cwPt = worldToMinimapCoords(
          { x: cx, y: 0, z: ROAD_SYSTEM_CONFIG.roadCenterZ },
          EXPANDED_WORLD_BOUNDS,
          width,
          height
        );
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cwPt.u - 3, roadTop.v, 6, roadBottom.v - roadTop.v);
      });

      // 5. Street Lamps & Traffic Lights
      ROAD_SYSTEM_CONFIG.streetLamps.forEach((lamp) => {
        const pt = worldToMinimapCoords(lamp.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      ROAD_SYSTEM_CONFIG.trafficLights.forEach((tl) => {
        const pt = worldToMinimapCoords(tl.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = tl.initialState === "red" ? "#ef4444" : "#22c55e";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Multiple Bus Stops
      TOWN_FACILITIES_CONFIG.busStops.forEach((stop) => {
        const pt = worldToMinimapCoords(
          { x: stop.x, y: 0, z: stop.z },
          EXPANDED_WORLD_BOUNDS,
          width,
          height
        );
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(pt.u - 3, pt.v - 3, 6, 6);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(pt.u - 3, pt.v - 3, 6, 6);
      });

      // 7. Dense Moving Vehicle Fleet
      DENSE_TRAFFIC_CONFIG.cars.forEach((car) => {
        const carPos = computeCarPosition(car, elapsed);
        const pt = worldToMinimapCoords(carPos, EXPANDED_WORLD_BOUNDS, width, height);

        ctx.fillStyle = car.colorCss;
        const carW = car.carType === "bus" ? 9 : 6;
        const carH = car.carType === "bus" ? 3.5 : 2.5;
        ctx.fillRect(pt.u - carW / 2, pt.v - carH / 2, carW, carH);

        // Headlight glow
        ctx.fillStyle = "#ffffff";
        if (car.direction > 0) {
          ctx.fillRect(pt.u + carW / 2 - 1, pt.v - carH / 2, 1.5, carH);
        } else {
          ctx.fillRect(pt.u - carW / 2 - 0.5, pt.v - carH / 2, 1.5, carH);
        }
      });

      // 8. Footpath Walking Pedestrians
      PEDESTRIAN_CONFIG.pedestrians.forEach((ped) => {
        const pedPos = computePedestrianPosition(ped, elapsed);
        const pt = worldToMinimapCoords(pedPos, EXPANDED_WORLD_BOUNDS, width, height);

        ctx.fillStyle = ped.colorCss;
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // 9. Interactive NPC Hotspots
      UNIFIED_PLAZA_HOTSPOTS.forEach((spot) => {
        const pt = worldToMinimapCoords(spot.position, EXPANDED_WORLD_BOUNDS, width, height);
        ctx.fillStyle = spot.npcName ? "#fbbf24" : "#34d399";
        ctx.beginPath();
        ctx.arc(pt.u, pt.v, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // 10. Live Player Avatar Position & Heading Pointer
      const playerPos = playerStateRef.current.pos;
      const playerRot = playerStateRef.current.rotation;
      const playerPt = worldToMinimapCoords(playerPos, EXPANDED_WORLD_BOUNDS, width, height);

      // Radar pulse ring
      const pulseSize = 4.5 + (Math.sin(elapsed * 4) + 1) * 3.5;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(playerPt.u, playerPt.v, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Player core beacon dot
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(playerPt.u, playerPt.v, 4.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Heading arrow pointer
      ctx.save();
      ctx.translate(playerPt.u, playerPt.v);
      ctx.rotate(-playerRot + Math.PI / 2);
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.moveTo(6.5, 0);
      ctx.lineTo(-2.5, -3.5);
      ctx.lineTo(-2.5, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, []);

  const mapWidth = isExpanded ? 460 : 340;
  const mapHeight = isExpanded ? 300 : 210;

  return (
    <div
      className={`absolute bottom-4 left-4 z-20 select-none transition-all duration-300 ${
        className || ""
      }`}
    >
      <div className="bg-stone-950/95 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-3 flex flex-col gap-2.5">
        {/* Header HUD with Maple Hollow branding */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <div>
              <div className="text-[12px] font-black text-stone-100 tracking-wider uppercase flex items-center gap-1.5">
                <span>MAPLE HOLLOW</span>
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                  LIVE GRID
                </span>
              </div>
              <div className="text-[9px] text-stone-400 font-medium tracking-tight">
                MUNICIPAL DISTRICT MAP & TRANSIT
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition-colors border border-stone-800"
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
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={mapWidth}
            height={mapHeight}
            className="block"
            style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
          />

          {/* Quick District Badges overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[8.5px] font-bold text-amber-300 drop-shadow">
            <span>☕ High St</span>
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8.5px] font-bold text-emerald-300 drop-shadow">
            <span>🌳 Elm Park</span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[8.5px] font-bold text-sky-300 drop-shadow">
            <span>✈️ Airport</span>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-semibold text-stone-400 drop-shadow">
            <span>🚏 Transit Boulevard</span>
          </div>
        </div>

        {/* District Legend Chips */}
        <div className="flex items-center gap-1.5 flex-wrap px-0.5">
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            🌳 Green Space
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            ☕ High Street
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            🏢 Apartments
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            🚏 Transit
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
            ✈️ Airport
          </span>
        </div>

        {/* Live Status Bar */}
        <div className="flex items-center justify-between px-1 text-[10px] text-stone-400 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-bold">
              {currentZone === "cafe"
                ? "High Street & Café"
                : currentZone === "airport"
                ? "Airport Concourse"
                : "Central Station Bus Hub"}
            </span>
          </div>
          <span className="text-stone-300 font-semibold">{coordsDisplay}</span>
        </div>
      </div>
    </div>
  );
});
