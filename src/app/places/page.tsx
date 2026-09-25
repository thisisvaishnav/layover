"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  ArrowRight,
  Shuffle,
  Store,
  Coffee,
  Plane,
  Building,
  Pill,
  UtensilsCrossed,
  Croissant,
  Check,
} from "lucide-react";
import { DESTINATIONS, DestinationOption } from "@/scenarios/catalog";
import { retroAudio } from "@/lib/audio/retro-audio";

// Category definitions with icons and descriptions
const CATEGORY_TABS = [
  { id: "all", label: "All Places", icon: "🗺️", count: DESTINATIONS.length },
  { id: "coffee", label: "Coffee Shop", icon: "☕", count: 1 },
  { id: "grocery", label: "Grocery Store", icon: "🛒", count: 1 },
  { id: "airport", label: "Airport", icon: "✈️", count: 1 },
  { id: "hotel", label: "Hotel", icon: "🏨", count: 1 },
  { id: "pharmacy", label: "Pharmacy", icon: "💊", count: 1 },
  { id: "restaurant", label: "Restaurant & Tapas", icon: "🍽️", count: 3 },
  { id: "bakery", label: "Bakery", icon: "🥐", count: 1 },
] as const;

// 3D features badge for each place type
const PLACE_3D_PERKS: Record<string, { badge: string; items: string[] }> = {
  coffee: {
    badge: "3D COFFEE SHOP",
    items: ["Espresso machine with steam", "Glass pastry display with croissants", "Warm wood floors & menu board"],
  },
  grocery: {
    badge: "3D SUPERMARKET",
    items: ["Checkout conveyor belt & barcode scanner", "Crates of fresh red apples & oranges", "Emerald supermarket floor tiles"],
  },
  airport: {
    badge: "3D AIRPORT GATE",
    items: ["Baggage weight scale with luggage suitcases", "Gate B12 flight podium & departures screen", "Dark slate terminal floor with yellow safety lines"],
  },
  hotel: {
    badge: "3D HOTEL LOBBY",
    items: ["Brass bellhop luggage cart with suitcases", "Gold reception desk bell & room key register", "Burgundy velvet carpet & chandelier lighting"],
  },
  pharmacy: {
    badge: "3D APOTHECARY / PHARMACY",
    items: ["Medicine glass cabinet with glowing cross", "Prescription counter with stethoscope & pill boxes", "Mint green sanitary tile flooring"],
  },
  restaurant: {
    badge: "3D TAPAS BAR",
    items: ["Stainless draft beer taps & bar counter", "Glass refrigerated display with tapas plates", "Spanish tavern dining tables & warm amber glow"],
  },
  bakery: {
    badge: "3D BAKERY",
    items: ["Bread baskets & fresh baguettes", "Warm pastry display counter", "French boutique atmosphere"],
  },
};

export default function PlacesPage() {
  const router = useRouter();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [coins, setCoins] = useState<number>(14);
  const [score, setScore] = useState<number>(3200);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    retroAudio.enabled = next;
    if (next) retroAudio.playCoin();
  };

  // Filtered places
  const displayedPlaces = DESTINATIONS.filter((d) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "restaurant") {
      return d.placeType === "restaurant" || d.category === "restaurant" || d.category === "street_food";
    }
    return d.placeType === selectedCategory || d.category === selectedCategory;
  });

  // Warp into 3D world
  const handleWarp = (place: DestinationOption) => {
    retroAudio.playWarpPipe();
    setTimeout(() => {
      router.push(`/play?place=${encodeURIComponent(place.id)}&lang=${encodeURIComponent(place.languageCode)}`);
    }, 280);
  };

  // Random lucky warp
  const handleRandomWarp = () => {
    const randomPlace = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    setCoins((c) => c + 1);
    setScore((s) => s + 300);
    handleWarp(randomPlace);
  };

  return (
    <div className="min-h-screen bg-[#5c94fc] text-stone-900 flex flex-col font-sans selection:bg-[#ffcc00] selection:text-black">
      {/* 1. Classic Mario NES Top Bar */}
      <header className="w-full bg-[#000000] text-[#ffffff] border-b-4 border-black px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-arcade">
          {/* Back to Home & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={() => retroAudio.playSelect()}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-[#ffcc00] border border-stone-600 flex items-center gap-1.5 cursor-pointer text-[10px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>HOME</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xl">🗺️</span>
              <span className="text-[#ffcc00] tracking-wider text-sm hidden sm:inline">
                STAGE SELECT · WORLD MAP
              </span>
            </div>
          </div>

          {/* Retro Arcade Status Items */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px]">
            <div>
              <span className="text-[#ff4444] block text-[9px]">SCORE</span>
              <span className="text-[#ffffff]">{score.toString().padStart(6, "0")}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-base mario-coin">🪙</span>
              <span>x{coins.toString().padStart(2, "0")}</span>
            </div>

            <div className="hidden sm:block">
              <span className="text-[#00a800] block text-[9px]">PLACES</span>
              <span>{DESTINATIONS.length} OPEN</span>
            </div>
          </div>

          {/* Sound & Random Warp Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 text-[10px] flex items-center gap-1 cursor-pointer"
              title={soundOn ? "Mute" : "Unmute"}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-[#ffcc00]" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
              <span className="hidden md:inline">{soundOn ? "FX ON" : "MUTED"}</span>
            </button>

            <button
              onClick={handleRandomWarp}
              className="mario-btn bg-[#ffcc00] hover:bg-[#ffe066] text-black text-[10px] px-3 py-1.5 font-arcade flex items-center gap-1.5 cursor-pointer uppercase shadow-[2px_2px_0px_#000]"
              title="Pick a random place to visit!"
            >
              <Shuffle className="w-3 h-3 text-black" />
              <span>RANDOM</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        {/* 2. Top Banner: Super Simple Rules */}
        <section className="relative mario-box-lg bg-gradient-to-r from-[#00a800] via-[#00c800] to-[#00a800] p-6 sm:p-7 rounded-2xl overflow-hidden text-white">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-[#ffcc00] font-arcade text-[10px] rounded-md mb-2 border-2 border-black">
                <Sparkles className="w-3 h-3 text-[#ffcc00]" />
                <span>CHOOSE YOUR 3D DESTINATION</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-arcade text-white tracking-tight drop-shadow-[2px_2px_0px_#000]">
                WHERE DO YOU WANT TO GO?
              </h1>

              <p className="text-sm sm:text-base font-bold text-white/90 mt-1 max-w-xl">
                Pick a place below. Each place has its own 3D room, custom items, and friendly locals to talk to!
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="bg-black/90 p-4 rounded-xl border-3 border-black text-[#ffcc00] font-arcade text-xs flex flex-col gap-1.5 shrink-0 shadow-[4px_4px_0px_#000]">
              <div className="text-white text-[10px]">3D WORLDS LOADED:</div>
              <div className="text-base text-[#00ff66]">✓ COFFEE SHOP</div>
              <div className="text-base text-[#00ff66]">✓ GROCERY STORE</div>
              <div className="text-base text-[#00ff66]">✓ AIRPORT & HOTEL</div>
              <div className="text-base text-[#00ff66]">✓ PHARMACY & TAPAS</div>
            </div>
          </div>
        </section>

        {/* 3. Category Filter Tabs */}
        <section className="mario-box bg-white p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-stone-200">
            <span className="font-arcade text-xs text-stone-700">FILTER BY PLACE:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    retroAudio.playSelect();
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#ffcc00] text-black shadow-[3px_3px_0px_#000] -translate-y-0.5 font-black"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 shadow-[1px_1px_0px_#000]"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Places Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedPlaces.map((place) => {
            const placeTypeKey = place.placeType || (place.category as string) || "coffee";
            const perks = PLACE_3D_PERKS[placeTypeKey] || PLACE_3D_PERKS["coffee"];
            const isHovered = hoveredPlace === place.id;

            return (
              <div
                key={place.id}
                onMouseEnter={() => setHoveredPlace(place.id)}
                onMouseLeave={() => setHoveredPlace(null)}
                className={`mario-box bg-white rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 relative ${
                  isHovered
                    ? "shadow-[6px_6px_0px_#000] -translate-y-1.5 border-black ring-2 ring-[#e52521]"
                    : "shadow-[4px_4px_0px_#000]"
                }`}
              >
                <div>
                  {/* Top Bar: World Stage & Difficulty */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-arcade text-[10px] px-2.5 py-1 rounded-md bg-black text-[#ffcc00] border border-black shadow-[1px_1px_0px_#000]">
                      {place.worldCode || "WORLD 1-1"}
                    </span>

                    <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (place.stars || 1)
                              ? "text-[#f8b800] fill-[#f8b800]"
                              : "text-stone-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Header: Icon + Name */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 border-2 border-black flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_#000]">
                      {place.bossIcon || "📍"}
                    </div>

                    <div>
                      <div className="inline-block text-[10px] font-arcade text-[#e52521] uppercase">
                        {place.categoryLabel || place.placeType || "Place"}
                      </div>
                      <h3 className="font-black text-xl text-stone-900 leading-snug">
                        {place.name}
                      </h3>
                      <div className="text-xs font-bold text-stone-500 mt-0.5">
                        {place.flag} {place.city}, {place.country}
                      </div>
                    </div>
                  </div>

                  {/* Simple Mission Box */}
                  <div className="p-3 rounded-xl bg-[#fff9db] border-2 border-stone-300 mb-3.5 shadow-sm">
                    <div className="text-[10px] font-arcade text-stone-700 uppercase mb-0.5">
                      🎯 YOUR MISSION:
                    </div>
                    <div className="text-xs font-bold text-stone-900">
                      {place.simpleMission || place.description}
                    </div>
                  </div>

                  {/* NPC Meet & Greet */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#e52521] text-white flex items-center justify-center text-lg border border-black shadow-[1px_1px_0px_#000] shrink-0">
                      {place.bossIcon || "👤"}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-stone-900 truncate">
                        Talk with {place.npcName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-semibold truncate">
                        {place.npcRole}
                      </div>
                    </div>
                  </div>

                  {/* 3D World Perks Preview */}
                  <div className="p-2.5 rounded-xl bg-stone-100/90 border border-stone-300 text-stone-700 mb-4">
                    <div className="text-[9px] font-arcade text-stone-600 uppercase mb-1.5 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>3D ROOM ITEMS:</span>
                    </div>
                    <ul className="space-y-1">
                      {perks.items.map((item, idx) => (
                        <li key={idx} className="text-[11px] text-stone-800 flex items-center gap-1.5 font-medium">
                          <span className="text-[#00a800] font-bold">✓</span>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Warp Action Button */}
                <div className="pt-2 border-t-2 border-stone-100">
                  <button
                    onClick={() => handleWarp(place)}
                    className="w-full mario-btn bg-gradient-to-r from-[#00a800] to-[#00c800] hover:from-[#00c800] hover:to-[#00a800] text-white font-arcade text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer uppercase shadow-[3px_3px_0px_#000] active:translate-y-0.5"
                  >
                    <span>WARP IN!</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5. Bottom Quick Navigation Bar */}
        <section className="mario-box bg-black text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍄</span>
            <div>
              <div className="text-sm font-arcade text-[#ffcc00]">READY TO PRACTICE?</div>
              <p className="text-xs text-stone-300 font-medium">
                Hold the Spacebar in 3D to talk directly with the characters!
              </p>
            </div>
          </div>

          <Link
            href="/"
            onClick={() => retroAudio.playSelect()}
            className="mario-btn bg-[#e52521] hover:bg-[#ff3b30] text-white text-xs px-5 py-3 font-arcade rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </section>
      </main>

      {/* Mario Ground Footer */}
      <footer className="w-full mt-8">
        <div className="h-3 bg-[#00a800] border-t-4 border-black" />
        <div className="mario-brick py-4 px-4 text-center border-t-2 border-black/40 text-stone-200 text-xs font-arcade">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span>© 2026 SUPER LAYOVER 3D</span>
            <span className="text-[#ffcc00]">WALK: WASD · TALK: SPACEBAR</span>
            <span>POWERED BY ASSEMBLYAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
