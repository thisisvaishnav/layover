"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX, ArrowRight, Check } from "lucide-react";
import { retroAudio } from "@/lib/audio/retro-audio";
import { SUPPORTED_LEARNER_LANGUAGES } from "@/scenarios/multilingual";
import {
  ONBOARDING_COUNTRIES,
  DEFAULT_STARTING_PLACE,
} from "@/scenarios/catalog";

export default function UnifiedFlowHomePage() {
  const router = useRouter();

  // Selection state
  const [targetLang, setTargetLang] = useState<string>("es");
  const [nativeLang, setNativeLang] = useState<string>("en");
  const [soundOn, setSoundOn] = useState<boolean>(true);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    retroAudio.enabled = next;
    if (next) retroAudio.playCoin();
  };

  const handleLaunchGame = () => {
    retroAudio.play1Up();
    setTimeout(() => {
      router.push(
        `/play?place=${encodeURIComponent(DEFAULT_STARTING_PLACE)}&lang=${encodeURIComponent(
          targetLang
        )}&native=${encodeURIComponent(nativeLang)}`
      );
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Two-color minimal header */}
      <header className="w-full border-b border-black px-6 py-4 sticky top-0 bg-white z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold tracking-widest uppercase">
            LAYOVER
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              aria-label={soundOn ? "Mute audio" : "Enable audio"}
              className="p-2 border border-black hover:bg-black hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="hidden sm:inline font-mono">
                {soundOn ? "AUDIO ON" : "MUTED"}
              </span>
            </button>

            <button
              onClick={handleLaunchGame}
              className="px-4 py-2 bg-black text-white hover:bg-white hover:text-black border border-black transition-colors font-medium text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>Start</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
        {/* Simple Page Title */}
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
            Onboarding
          </h1>
          <p className="text-sm font-medium text-black/70">
            Choose your destination country and the language you speak.
          </p>
        </section>

        {/* 1. Pick a country */}
        <section className="flex flex-col gap-4">
          <div className="border-b border-black pb-2">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              1. Pick a country
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ONBOARDING_COUNTRIES.map((item) => {
              const isSelected = targetLang === item.code;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setTargetLang(item.code);
                    retroAudio.playSelect();
                  }}
                  className={`p-4 border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-black/30 bg-white text-black hover:border-black"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold">{item.country}</div>
                      <div className="text-xs font-mono mt-0.5 opacity-80">
                        {item.language} ({item.nativeName})
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 mt-1" />}
                  </div>
                  <div className="text-[11px] font-mono opacity-60 mt-2">
                    {item.tagline}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Language you are comfortable in */}
        <section className="flex flex-col gap-4">
          <div className="border-b border-black pb-2">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              2. Language you are comfortable in
            </h2>
            <p className="text-xs text-black/70 mt-1 font-mono">
              Choose the language you speak
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUPPORTED_LEARNER_LANGUAGES.map((lang) => {
              const isSelected = nativeLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setNativeLang(lang.code);
                    retroAudio.playSelect();
                  }}
                  className={`p-3 border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-black/30 bg-white text-black hover:border-black"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{lang.name}</div>
                    <div className="text-xs font-mono opacity-70">
                      {lang.nativeName}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Action */}
        <div className="pt-4 border-t border-black flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-black/70">
            Selected:{" "}
            <span className="font-bold text-black uppercase">
              {ONBOARDING_COUNTRIES.find((c) => c.code === targetLang)?.country}
            </span>{" "}
            · Taught in:{" "}
            <span className="font-bold text-black uppercase">
              {SUPPORTED_LEARNER_LANGUAGES.find((l) => l.code === nativeLang)?.name}
            </span>
          </div>

          <button
            onClick={handleLaunchGame}
            className="w-full sm:w-auto px-8 py-3.5 bg-black text-white hover:bg-white hover:text-black border border-black font-bold text-sm tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
