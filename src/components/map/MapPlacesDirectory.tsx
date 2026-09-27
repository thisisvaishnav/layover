"use client";

import React, { useState } from "react";
import { Compass, Footprints, ChevronDown, ChevronUp } from "lucide-react";
import type { Vector2D } from "@/player/movement-controller";
import { COFFEE_SHOP_WORLD_POSITION } from "@/scenarios/coffee-shop-scenario";
import { BUS_STOP_WORLD_POSITION } from "@/scenarios/bus-stop-scenario";
import { TAXI_STAND_WORLD_POSITION } from "@/scenarios/taxi-stand-scenario";
import { BARBER_SHOP_WORLD_POSITION } from "@/scenarios/barber-shop-scenario";

export interface PlacePOI {
  id: string;
  name: string;
  category: string;
  icon: string;
  npcName: string;
  objective: string;
  color: string;
  accentBg: string;
  textColor: string;
  position: Vector2D;
  interactionRadius: number;
}

export const DISTRICT_PLACES: PlacePOI[] = [
  {
    id: "taxi",
    name: "TAXI STATION",
    category: "TRANSPORT",
    icon: "🚕",
    npcName: "Driver Carlos",
    objective: "Hail cab & negotiate fare",
    color: "#FFB800",
    accentBg: "bg-[#FFB800]",
    textColor: "text-black",
    position: TAXI_STAND_WORLD_POSITION,
    interactionRadius: 14,
  },
  {
    id: "cafe",
    name: "COFFEE SHOP",
    category: "FOOD & DRINK",
    icon: "☕",
    npcName: "Barista Sofia",
    objective: "Order espresso & breakfast",
    color: "#FF5722",
    accentBg: "bg-[#FF5722]",
    textColor: "text-white",
    position: COFFEE_SHOP_WORLD_POSITION,
    interactionRadius: 12,
  },
  {
    id: "barber",
    name: "BARBER SHOP",
    category: "SERVICES",
    icon: "💈",
    npcName: "Stylist Marco",
    objective: "Ask for haircut & styling",
    color: "#7C3AED",
    accentBg: "bg-[#7C3AED]",
    textColor: "text-white",
    position: BARBER_SHOP_WORLD_POSITION,
    interactionRadius: 12,
  },
  {
    id: "bus",
    name: "BUS STOP",
    category: "TRANSIT",
    icon: "🚌",
    npcName: "Conductor Juan",
    objective: "Buy transit ticket & schedule",
    color: "#00D084",
    accentBg: "bg-[#00D084]",
    textColor: "text-black",
    position: BUS_STOP_WORLD_POSITION,
    interactionRadius: 12,
  },
  {
    id: "park",
    name: "CENTRAL PARK",
    category: "LANDMARK",
    icon: "🌳",
    npcName: "Country Memorial",
    objective: "Explore monument & gardens",
    color: "#0284C7",
    accentBg: "bg-[#0284C7]",
    textColor: "text-white",
    position: { x: -46, z: -46 },
    interactionRadius: 16,
  },
];

interface MapPlacesDirectoryProps {
  playerPosition: Vector2D;
  onNavigateToPlace(position: Vector2D): void;
}

/**
 * Neo-Brutalist District Directory sidebar panel.
 * Displays all visitable hotspots on the 3D map with distinct color identities.
 */
export function MapPlacesDirectory({
  playerPosition,
  onNavigateToPlace,
}: MapPlacesDirectoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className="absolute top-20 left-4 z-20 pointer-events-auto flex flex-col font-sans select-none max-w-[290px] sm:max-w-[320px] transition-all"
      aria-label="District Places to Visit"
    >
      {/* Header bar matching Onboarding UI */}
      <div className="bg-[#FAF9F5] border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FFB800] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
            <Compass className="w-4 h-4 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-tight text-black flex items-center gap-1">
              <span>PLACES TO VISIT</span>
              <span className="text-[10px] font-mono font-bold bg-[#FF5722] text-white px-1 py-0.2">
                5
              </span>
            </span>
            <span className="text-[9px] font-mono font-bold text-black/60 uppercase">
              Click to walk & talk
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-1 bg-white hover:bg-black hover:text-white border-2 border-black shadow-[2px_2px_0px_#000] text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
          title={isExpanded ? "Collapse Directory" : "Expand Directory"}
        >
          <span>{isExpanded ? "HIDE" : "SHOW"}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Expanded Hotspots Card Stack */}
      {isExpanded && (
        <div className="mt-2 bg-[#FAF9F5]/95 backdrop-blur-md border-[3px] border-black shadow-[5px_5px_0px_#000] p-2.5 flex flex-col gap-2 max-h-[calc(100vh-170px)] overflow-y-auto">
          {DISTRICT_PLACES.map((place) => {
            const distance = Math.round(
              Math.hypot(
                playerPosition.x - place.position.x,
                playerPosition.z - place.position.z
              )
            );
            const isInRange = distance <= place.interactionRadius;

            return (
              <div
                key={place.id}
                onClick={() => onNavigateToPlace(place.position)}
                className={`border-2 border-black p-2 bg-white shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isInRange ? "ring-2 ring-[#00D084]" : ""
                }`}
              >
                {/* Header row with distinct color icon & category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 ${place.accentBg} ${place.textColor} border-2 border-black flex items-center justify-center text-sm font-black shadow-[1px_1px_0px_#000]`}
                    >
                      <span>{place.icon}</span>
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight text-black leading-tight">
                        {place.name}
                      </div>
                      <div className="text-[9px] font-mono font-bold text-black/60 uppercase">
                        {place.npcName}
                      </div>
                    </div>
                  </div>

                  {/* Distance / In Range indicator */}
                  <div>
                    {isInRange ? (
                      <span className="bg-[#00D084] text-black border border-black px-1.5 py-0.5 text-[9px] font-mono font-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>IN RANGE</span>
                      </span>
                    ) : (
                      <span className="bg-black/5 border border-black/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black/70 uppercase">
                        {distance}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Objective details */}
                <div className="text-[10px] text-black/80 font-medium leading-tight pt-1 border-t border-black/10 flex items-center justify-between">
                  <span className="truncate pr-1">{place.objective}</span>
                  <span className="font-mono text-[9px] font-black uppercase text-[#FF5722] shrink-0 flex items-center gap-0.5">
                    <Footprints className="w-2.5 h-2.5" />
                    <span>WALK</span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick hint at bottom */}
          <div className="pt-1 text-[9px] font-mono text-black/60 text-center uppercase tracking-wider">
            Walk within 12m to talk [E]
          </div>
        </div>
      )}
    </aside>
  );
}
