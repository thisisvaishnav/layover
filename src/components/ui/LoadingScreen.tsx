"use client";

import { useEffect, useState } from "react";
import { Plane, Compass, Globe, Sparkles, CheckCircle2 } from "lucide-react";
import { ONBOARDING_COUNTRIES } from "@/scenarios/catalog";
import { SUPPORTED_LEARNER_LANGUAGES } from "@/scenarios/multilingual";

export interface LoadingStage {
  id: string;
  title: string;
  description: string;
}

export const LOADING_STAGES: LoadingStage[] = [
  {
    id: "boarding",
    title: "Boarding Flight & Plotting 3D Coordinates",
    description: "Confirming destination and comfortable language scaffolding...",
  },
  {
    id: "city_generation",
    title: "Constructing Walkable City & Districts",
    description: "Rendering 3D architecture, traffic network & interactive hotspots...",
  },
  {
    id: "ready",
    title: "Entering Simulation",
    description: "3D Maps world ready. Stepping into the district...",
  },
];

export interface LoadingScreenMetadata {
  countryName: string;
  targetLanguageName: string;
  targetNativeName: string;
  nativeLanguageName: string;
  nativeNativeName: string;
  flagEmoji: string;
  tagline: string;
  destinationTitle: string;
}

export function getLoadingScreenMetadata(
  targetLang: string = "es",
  nativeLang: string = "en",
  placeType: string = "cafe"
): LoadingScreenMetadata {
  const country =
    ONBOARDING_COUNTRIES.find((c) => c.code === targetLang) ||
    ONBOARDING_COUNTRIES[0] || {
      code: "es",
      country: "Spain",
      language: "Spanish",
      nativeName: "Español",
      flag: "🇪🇸",
      tagline: "Madrid & Barcelona",
    };

  const learnerLang =
    SUPPORTED_LEARNER_LANGUAGES.find((l) => l.code === nativeLang) ||
    SUPPORTED_LEARNER_LANGUAGES[0] || {
      code: "en",
      name: "English",
      nativeName: "English",
    };

  let destinationTitle = "Café de la Luna";
  if (placeType === "bus_stop" || placeType === "transit") {
    destinationTitle = "City Transit & Bus Stop";
  } else if (placeType === "airport" || placeType === "gate") {
    destinationTitle = "International Airport Terminal";
  } else if (placeType === "park") {
    destinationTitle = "Central Urban Park";
  }

  return {
    countryName: country.country,
    targetLanguageName: country.language,
    targetNativeName: country.nativeName,
    nativeLanguageName: learnerLang.name,
    nativeNativeName: learnerLang.nativeName,
    flagEmoji: country.flag,
    tagline: country.tagline,
    destinationTitle,
  };
}

export interface LoadingScreenProps {
  isLoading: boolean;
  targetLang?: string;
  nativeLang?: string;
  placeType?: string;
  onFinished?: () => void;
  className?: string;
}

export function LoadingScreen({
  isLoading,
  targetLang = "es",
  nativeLang = "en",
  placeType = "cafe",
  onFinished,
  className = "",
}: LoadingScreenProps) {
  const metadata = getLoadingScreenMetadata(targetLang, nativeLang, placeType);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isExited, setIsExited] = useState(!isLoading);
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading);

  // Synchronize exit state during render if prop changes back to loading
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading);
    if (isLoading) {
      setIsExited(false);
      setCurrentStageIndex(0);
    }
  }

  // Progressive stage simulation for visual interest
  useEffect(() => {
    if (!isLoading) return;

    const stepTimer = setTimeout(() => {
      setCurrentStageIndex(1);
    }, 700);

    return () => {
      clearTimeout(stepTimer);
    };
  }, [isLoading]);

  if (isExited) {
    return null;
  }

  const isFadingOut = !isLoading;
  const stageIndex = !isLoading ? 2 : currentStageIndex;
  const currentStage = LOADING_STAGES[stageIndex] || LOADING_STAGES[0];

  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={(e) => {
        // Only trigger on the container's own opacity transition
        if (e.target === e.currentTarget && !isLoading) {
          setIsExited(true);
          onFinished?.();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-stone-950 text-white transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${className}`}
    >
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black pointer-events-none opacity-90" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none bg-[size:32px_32px]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)",
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-4 flex flex-col items-center">
        {/* Boarding Pass Container */}
        <div className="w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6">
          {/* Top Flight Header */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={metadata.countryName}>
                {metadata.flagEmoji}
              </span>
              <div>
                <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold block">
                  Flight Boarding Pass
                </span>
                <span className="text-lg font-extrabold uppercase tracking-tight text-stone-100">
                  {metadata.countryName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-xs font-mono text-stone-300">
              <Plane className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>3D SIMULATION</span>
            </div>
          </div>

          {/* Selected Language Match Box */}
          <div className="grid grid-cols-2 gap-3 bg-stone-950/70 border border-stone-800/80 rounded-2xl p-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                Target Language
              </span>
              <div className="text-sm font-bold text-stone-100">
                {metadata.targetLanguageName}
              </div>
              <div className="text-xs font-mono text-amber-400/80">
                {metadata.targetNativeName}
              </div>
            </div>

            <div className="border-l border-stone-800 pl-3">
              <span className="text-[10px] uppercase font-mono text-stone-400 block mb-0.5">
                Comfortable Language
              </span>
              <div className="text-sm font-bold text-stone-100">
                {metadata.nativeLanguageName}
              </div>
              <div className="text-xs font-mono text-stone-400">
                {metadata.nativeNativeName}
              </div>
            </div>
          </div>

          {/* Centerpiece: Pure CSS Radar / Orbit Loading Animation */}
          <div className="flex flex-col items-center justify-center py-2 gap-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping" />
              {/* Spinning compass border */}
              <div className="absolute inset-1 rounded-full border-2 border-stone-700 border-t-amber-400 animate-spin" />
              {/* Inner core circle */}
              <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shadow-inner">
                {currentStageIndex === 2 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                ) : (
                  <Compass className="w-6 h-6 animate-pulse" />
                )}
              </div>
            </div>

            {/* Stage Title and Description */}
            <div className="text-center flex flex-col gap-1 max-w-sm">
              <div className="text-sm font-bold tracking-wide text-stone-100 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentStage.title}</span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                {currentStage.description}
              </p>
            </div>
          </div>

          {/* Stage Progress Bar (Pure CSS animation) */}
          <div className="flex flex-col gap-2">
            <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-amber-400 h-full transition-all duration-700 ease-out"
                style={{
                  width: `${((currentStageIndex + 1) / LOADING_STAGES.length) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-stone-400 px-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-stone-400" />
                <span>{metadata.destinationTitle}</span>
              </span>
              <span>
                STAGE {currentStageIndex + 1} OF {LOADING_STAGES.length}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom subtle tagline */}
        <div className="mt-4 text-xs font-mono text-stone-500 tracking-wider uppercase text-center">
          LAYOVER · IMMERSIVE 3D LANGUAGE SIMULATION
        </div>
      </div>
    </div>
  );
}
