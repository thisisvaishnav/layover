"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  RotateCcw,
  CheckCircle2,
  Compass,
  Globe2,
  Radio,
  Eye,
  Megaphone,
  UserCheck,
  Footprints,
  Headphones,
  KeyRound,
  ShieldCheck,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { retroAudio } from "@/lib/audio/retro-audio";
import { SUPPORTED_LEARNER_LANGUAGES } from "@/scenarios/multilingual";
import { ONBOARDING_COUNTRIES } from "@/scenarios/catalog";
import CharacterShowcase from "@/components/character/CharacterShowcase";

const TARGET_KEY = "layover_target_lang";
const NATIVE_KEY = "layover_native_lang";
const PREFS_EVENT = "layover:prefs";

function subscribePrefs(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(PREFS_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(PREFS_EVENT, listener);
  };
}

function readStoredPref(key: string, isValid: (code: string) => boolean, fallback: string): string {
  try {
    const saved = localStorage.getItem(key);
    if (saved && isValid(saved)) return saved;
  } catch {
    // Ignore
  }
  return fallback;
}

function writeStoredPref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export default function OnboardingPage() {
  // Persisted selections: server snapshot falls back to the defaults so hydration matches.
  const targetLang = useSyncExternalStore(
    subscribePrefs,
    () => readStoredPref(TARGET_KEY, (c) => ONBOARDING_COUNTRIES.some((o) => o.code === c), "ja"),
    () => "ja"
  );
  const nativeLang = useSyncExternalStore(
    subscribePrefs,
    () => readStoredPref(NATIVE_KEY, (c) => SUPPORTED_LEARNER_LANGUAGES.some((l) => l.code === c), "ja"),
    () => "ja"
  );

  const selectTarget = (code: string) => {
    writeStoredPref(TARGET_KEY, code);
    retroAudio.playSelect();
  };

  const selectNative = (code: string) => {
    writeStoredPref(NATIVE_KEY, code);
    retroAudio.playSelect();
  };

  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const selectedCountry =
    ONBOARDING_COUNTRIES.find((c) => c.code === targetLang) || ONBOARDING_COUNTRIES[0];
  const selectedNativeLang =
    SUPPORTED_LEARNER_LANGUAGES.find((l) => l.code === nativeLang) ||
    SUPPORTED_LEARNER_LANGUAGES[0];

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    retroAudio.enabled = next;
    if (next) retroAudio.playCoin();
  };

  const handleStart = () => {
    writeStoredPref(TARGET_KEY, targetLang);
    writeStoredPref(NATIVE_KEY, nativeLang);
    retroAudio.play1Up();
    setIsCompleted(true);
  };

  const handleEdit = () => {
    retroAudio.playSelect();
    setIsCompleted(false);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-graph-paper text-black flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Black Marquee Ticker */}
      <div className="w-full bg-black text-white text-[11px] font-mono font-bold tracking-wider py-2 overflow-hidden uppercase border-b-2 border-black flex items-center select-none">
        <div className="animate-ticker flex items-center gap-6 whitespace-nowrap">
          <span>THE FIRST WORDS YOU NEED</span>
          <span className="text-[#FF5722]">♢</span>
          <span>NO SCRIPT REQUIRED</span>
          <span className="text-[#FFB800]">♢</span>
          <span>RUNS IN A BROWSER TAB</span>
          <span className="text-[#00D084]">♢</span>
          <span>TWO VIEWS · ONE SAFE JOURNEY</span>
          <span className="text-[#FF5722]">♢</span>
          <span>REAL NPC CONVERSATIONS</span>
          <span className="text-[#FFB800]">♢</span>
          <span>SPAIN · INDIA · JAPAN · FRANCE · ITALY</span>
          <span className="text-[#00D084]">♢</span>
          <span>WALK THE 3D DISTRICT</span>
          <span className="text-[#FF5722]">♢</span>
          <span>PRACTICE BEFORE YOUR FLIGHT</span>
          <span className="text-[#FFB800]">♢</span>
          <span>THE FIRST WORDS YOU NEED</span>
          <span className="text-[#FF5722]">♢</span>
          <span>NO SCRIPT REQUIRED</span>
          <span className="text-[#FFB800]">♢</span>
          <span>RUNS IN A BROWSER TAB</span>
          <span className="text-[#00D084]">♢</span>
          <span>TWO VIEWS · ONE SAFE JOURNEY</span>
          <span className="text-[#FF5722]">♢</span>
          <span>REAL NPC CONVERSATIONS</span>
          <span className="text-[#FFB800]">♢</span>
          <span>SPAIN · INDIA · JAPAN · FRANCE · ITALY</span>
          <span className="text-[#00D084]">♢</span>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="w-full border-b-2 border-black px-6 py-3.5 sticky top-0 bg-[#FAF9F5]/95 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-[#FFB800] border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_#000] transition-all">
              <Compass className="w-4 h-4 text-black" />
            </div>
            <div className="text-xl font-black tracking-tight uppercase flex items-center">
              <span>LAY</span>
              <span className="text-[#FF5722]">OVER</span>
            </div>
          </Link>

          {/* Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-black tracking-wider uppercase">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-[#FF5722] hover:underline cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("destinations")}
              className="hover:text-[#FF5722] hover:underline cursor-pointer"
            >
              Destinations
            </button>
            <button
              onClick={() => scrollToSection("roles")}
              className="hover:text-[#FF5722] hover:underline cursor-pointer"
            >
              Roles
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              aria-label={soundOn ? "Mute audio" : "Enable audio"}
              className="px-3 py-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer text-xs font-black flex items-center gap-1.5"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-black" />
              ) : (
                <VolumeX className="w-4 h-4 text-black/60" />
              )}
              <span className="hidden sm:inline font-mono">
                {soundOn ? "AUDIO ON" : "MUTED"}
              </span>
            </button>

            {!isCompleted ? (
              <button
                onClick={() => scrollToSection("destinations")}
                className="px-4 py-2 bg-[#FFB800] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all font-black text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <span>Start A Drill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] transition-all font-black text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit Preferences</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-14">
        {!isCompleted ? (
          <>
            {/* HERO SECTION */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              {/* Left Column: Typography & CTAs */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="bg-black text-[#FFB800] border-2 border-black text-xs font-black px-3 py-1 shadow-[2px_2px_0px_#000] uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#FFB800] animate-pulse" />
                    <span>CO-OP LANGUAGE DRILL</span>
                  </div>
                  <div className="bg-white text-black border-2 border-black text-xs font-black px-3 py-1 shadow-[2px_2px_0px_#000] uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-black" />
                    <span>3D IN THE BROWSER</span>
                  </div>
                </div>

                {/* Massive Hero Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-black leading-[0.95] flex flex-col items-start">
                  <span>TWO</span>
                  <span>VIEWS.</span>
                  <span>
                    ONE <span className="text-[#FF5722]">SAFE</span>
                  </span>
                  <span className="inline-block bg-[#FFB800] border-[3px] border-black px-4 py-0.5 shadow-[5px_5px_0px_#000] mt-1 text-black">
                    EXIT.
                  </span>
                </h1>

                {/* Paragraph copy */}
                <p className="text-base sm:text-lg font-medium text-black/80 max-w-xl leading-relaxed">
                  A real-time travel evacuation and language drill on a stylized 3D city district.
                  One of you is navigating the streets with no script. The other watches from above
                  with bilingual scaffolding and audio hints. Neither of you finishes alone.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => scrollToSection("destinations")}
                    className="px-8 py-4 bg-[#FFB800] text-black border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start A Drill</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => scrollToSection("destinations")}
                    className="px-6 py-4 bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Footprints className="w-4 h-4" />
                    <span>Practice Solo</span>
                  </button>
                </div>

                {/* Fast Trigger Link */}
                <div className="pt-1">
                  <button
                    onClick={handleStart}
                    className="text-xs font-black tracking-wider uppercase underline underline-offset-4 hover:text-[#FF5722] cursor-pointer"
                  >
                    JOIN WITH A CODE / QUICK START
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive 3D Character Simulation Frame */}
              <div className="lg:col-span-5 flex justify-center">
                <CharacterShowcase
                  selectedCountryCode={targetLang}
                  selectedCountryName={selectedCountry.country}
                  selectedCountryFlag={selectedCountry.flag}
                  nativeLangName={selectedNativeLang.name}
                  mode="hero"
                  className="max-w-md"
                />
              </div>
            </section>

            {/* 3-STAT SEGMENTED BANNER */}
            <section className="w-full border-[3px] border-black shadow-[6px_6px_0px_#000] grid grid-cols-1 md:grid-cols-3">
              {/* Yellow Stat Box */}
              <div className="bg-[#FFB800] p-6 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-black">5</span>
                    <span className="text-sm font-black uppercase tracking-wider text-black">
                      DESTINATIONS
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-none border-2 border-black bg-black text-[#FFB800] flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <Globe2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs font-mono font-bold uppercase text-black/80 tracking-wide">
                  SPAIN · INDIA · JAPAN · FRANCE · ITALY
                </div>
              </div>

              {/* Mint Green Stat Box */}
              <div className="bg-[#00D084] p-6 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-black">4</span>
                    <span className="text-sm font-black uppercase tracking-wider text-black">
                      HOTSPOTS
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-none border-2 border-black bg-black text-[#00D084] flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs font-mono font-bold uppercase text-black/80 tracking-wide">
                  CAFE · TAXI STAND · BUS STOP · AIRPORT
                </div>
              </div>

              {/* Electric Violet Stat Box */}
              <div className="bg-[#7C3AED] text-white p-6 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-white">8</span>
                    <span className="text-sm font-black uppercase tracking-wider text-white">
                      MIN RUN
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-none border-2 border-black bg-white text-[#7C3AED] flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <Headphones className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs font-mono font-bold uppercase text-white/90 tracking-wide">
                  A FULL DRILL, START TO DEBRIEF
                </div>
              </div>
            </section>

            {/* HOW A DRILL WORKS SECTION */}
            <section id="how-it-works" className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                  HOW A DRILL WORKS
                </h2>
                <div className="bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_#000] text-xs font-mono font-black uppercase tracking-wider inline-flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>ABOUT 8 MINUTES A RUN</span>
                </div>
              </div>

              {/* 4 Steps Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Step 01 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col justify-between gap-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-all">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-mono font-black text-stroke-num leading-none">
                      01
                    </span>
                    <div className="w-8 h-8 bg-[#FFB800] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      <KeyRound className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-black uppercase tracking-wide text-black">
                      OPEN A ROOM
                    </h3>
                    <p className="text-xs text-black/75 font-medium leading-relaxed">
                      Choose your arrival country and start a session. All 3D landmarks, local signs,
                      and NPCs configure instantly.
                    </p>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col justify-between gap-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-all">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-mono font-black text-stroke-num leading-none">
                      02
                    </span>
                    <div className="w-8 h-8 bg-[#00D084] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      <UserCheck className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-black uppercase tracking-wide text-black">
                      GET YOUR ROLE
                    </h3>
                    <p className="text-xs text-black/75 font-medium leading-relaxed">
                      Select the native language you speak comfortably. Translations, hints, and
                      guidance speak your tongue.
                    </p>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col justify-between gap-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-all">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-mono font-black text-stroke-num leading-none">
                      03
                    </span>
                    <div className="w-8 h-8 bg-[#FFB800] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      <Megaphone className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-black uppercase tracking-wide text-black">
                      HEAR THE BRIEFING
                    </h3>
                    <p className="text-xs text-black/75 font-medium leading-relaxed">
                      Walk freely in the 3D district. Approach the cafe counter, taxi driver, or bus
                      stand to initiate dialogue.
                    </p>
                  </div>
                </div>

                {/* Step 04 */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col justify-between gap-6 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-all">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-mono font-black text-stroke-num leading-none">
                      04
                    </span>
                    <div className="w-8 h-8 bg-[#7C3AED] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-black uppercase tracking-wide text-black">
                      EVACUATE, THEN DEBRIEF
                    </h3>
                    <p className="text-xs text-black/75 font-medium leading-relaxed">
                      Give real replies at every stop. Clear speaking objectives, reach the
                      exit, and complete your run.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SELECTION WORKFLOW */}
            <div id="destinations" className="flex flex-col gap-10 pt-4">
              {/* 1. Pick a country */}
              <section className="flex flex-col gap-4">
                <div className="border-b-2 border-black pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                      1. Pick a country
                    </h2>
                    <p className="text-xs font-mono text-black/70 mt-0.5">
                      Select your travel destination to calibrate localized signs, accents, and scenarios.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black uppercase bg-[#FFB800] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                    STEP 1 OF 2
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ONBOARDING_COUNTRIES.map((item) => {
                    const isSelected = targetLang === item.code;
                    return (
                      <button
                        key={item.code}
                        onClick={() => selectTarget(item.code)}
                        className={`p-5 border-2 border-black text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                          isSelected
                            ? "bg-[#FFB800] text-black shadow-[6px_6px_0px_#000] -translate-x-0.5 -translate-y-0.5"
                            : "bg-white text-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-2xl font-black flex items-center gap-2">
                              <span>{item.flag}</span>
                              <span className="uppercase">{item.country}</span>
                            </div>
                            <div className="text-xs font-mono font-bold mt-1">
                              {item.language} ({item.nativeName})
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-none bg-black text-white border-2 border-black flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] font-mono font-medium text-black/80 mt-3 pt-2 border-t border-black/20">
                          {item.tagline}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Language you are comfortable in */}
              <section id="languages" className="flex flex-col gap-4">
                <div className="border-b-2 border-black pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                      2. Language you are comfortable in
                    </h2>
                    <p className="text-xs font-mono text-black/70 mt-0.5">
                      Choose the language you speak. Hints, phonetics, and dialogue breakdowns appear in this tongue.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black uppercase bg-[#00D084] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                    STEP 2 OF 2
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SUPPORTED_LEARNER_LANGUAGES.map((lang) => {
                    const isSelected = nativeLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => selectNative(lang.code)}
                        className={`p-3.5 border-2 border-black text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-black text-white shadow-[5px_5px_0px_#FF5722] -translate-x-0.5 -translate-y-0.5"
                            : "bg-white text-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
                        }`}
                      >
                        <div>
                          <div className="font-black text-sm flex items-center gap-1.5 uppercase">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                          <div className={`text-xs font-mono ${isSelected ? "text-white/80" : "text-black/70"}`}>
                            {lang.nativeName}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#FF5722] stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Bottom Sticky Action Banner */}
              <div className="p-4 bg-white border-2 border-black shadow-[5px_5px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-mono font-bold text-black/80 flex items-center gap-2">
                  <span>Selected:</span>
                  <span className="bg-[#FFB800] border border-black px-2 py-0.5 text-black uppercase">
                    {selectedCountry.country} {selectedCountry.flag}
                  </span>
                  <span>· Taught in:</span>
                  <span className="bg-black text-white px-2 py-0.5 uppercase">
                    {selectedNativeLang.name}
                  </span>
                </div>

                <button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#FFB800] text-black border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start A Drill</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROLES COMPARISON SECTION */}
            <section id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Role 01: The Traveler */}
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_#6366F1] p-6 sm:p-8 flex flex-col justify-between gap-6 relative">
                <div className="flex items-start justify-between">
                  <div className="bg-[#6366F1] text-white border-2 border-black px-2.5 py-0.5 font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] -rotate-2">
                    ROLE 01
                  </div>
                  <Footprints className="w-6 h-6 text-[#6366F1]" />
                </div>

                <div className="flex flex-col gap-2.5">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                    THE EVACUEE
                  </h3>
                  <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                    You are inside the district with no script. You walk up to counters, read authentic
                    signs, order coffee, and hail cabs. You must trust what you hear and answer
                    clearly to get through.
                  </p>
                </div>

                {/* Operative Identity / Avatar Spec Badge */}
                <div className="bg-[#FAF9F5] border-2 border-black p-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0284c7] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0px_#000] overflow-hidden relative">
                    <Image
                      src="/character/avatar.png"
                      alt="Travel Operative 3D Avatar"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover object-top scale-125"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-black uppercase text-black">
                      <span className="w-2 h-2 rounded-full bg-[#00D084]" />
                      <span>YOUR PLAYABLE 3D AVATAR</span>
                    </div>
                    <span className="text-[11px] text-black/70 font-medium truncate">
                      Blue field operative attire · 360° procedural bipedal control
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] border-2 border-black p-3 text-[11px] font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <span>WASD MOVE / CLICK TO WALK / SPACE TO TALK</span>
                </div>
              </div>

              {/* Role 02: The Warden */}
              <div className="bg-[#141416] text-white border-[3px] border-black shadow-[6px_6px_0px_#FF5722] p-6 sm:p-8 flex flex-col justify-between gap-6 relative">
                <div className="flex items-start justify-between">
                  <div className="bg-[#FF5722] text-white border-2 border-black px-2.5 py-0.5 font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] rotate-2">
                    ROLE 02
                  </div>
                  <Eye className="w-6 h-6 text-[#FF5722]" />
                </div>

                <div className="flex flex-col gap-2.5">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    THE WARDEN
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
                    You watch from above. You can see the conversation objectives and pronunciation
                    hazards. Verify spoken replies, suggest clear phonetic hints, and scaffold real-time
                    confidence at the right moment.
                  </p>
                </div>

                <div className="bg-[#202024] border-2 border-white/30 p-3 text-[11px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-pulse" />
                  <span>OBSERVE → VERIFY → SEND PHONETIC ROUTE</span>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* COMPLETION CONFIRMATION SCREEN */
          <section className="flex flex-col gap-8 animate-in fade-in duration-300 py-6">
            <div className="border-[3px] border-black p-8 sm:p-12 flex flex-col gap-8 bg-white shadow-[8px_8px_0px_#000]">
              {/* Badge & Title */}
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 bg-[#00D084] border-2 border-black px-3 py-1 text-xs font-mono font-black uppercase tracking-wider w-fit shadow-[2px_2px_0px_#000]">
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span className="text-black">Onboarding Complete</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-black">
                  You&apos;re All Set!
                </h1>
                <p className="text-sm font-medium text-black/80 max-w-xl">
                  Your travel language profile is configured and ready. Here is a summary of your selected preferences:
                </p>
              </div>

              {/* Selection Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Destination Card */}
                <div className="border-2 border-black bg-[#FFB800] p-6 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_#000]">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono uppercase text-black font-black tracking-wider">
                      Destination Country
                    </span>
                    <div className="text-3xl font-black flex items-center gap-2 mt-1 text-black">
                      <span>{selectedCountry.flag}</span>
                      <span className="uppercase">{selectedCountry.country}</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-black/30 pt-3 flex flex-col gap-1 text-xs font-mono text-black">
                    <div>
                      <span className="font-bold">Target Language: </span>
                      <span>{selectedCountry.language}</span> ({selectedCountry.nativeName})
                    </div>
                    <div>
                      <span className="font-bold">Hotspots: </span>
                      <span>{selectedCountry.tagline}</span>
                    </div>
                  </div>
                </div>

                {/* Comfortable Language Card */}
                <div className="border-2 border-black bg-black text-white p-6 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_#FF5722]">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono uppercase text-white/70 font-black tracking-wider">
                      Language You Speak
                    </span>
                    <div className="text-3xl font-black flex items-center gap-2 mt-1 text-white">
                      <span>{selectedNativeLang.flag}</span>
                      <span className="uppercase">{selectedNativeLang.name}</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-white/20 pt-3 flex flex-col gap-1 text-xs font-mono text-white/90">
                    <div>
                      <span className="font-bold">Scaffolding Tongue: </span>
                      <span>{selectedNativeLang.nativeName}</span>
                    </div>
                    <div className="text-white/70">
                      Instruction, phonetics, and dialogue hints will be given in this language.
                    </div>
                  </div>
                </div>

                {/* 3D Operative Avatar Status Card */}
                <div className="border-2 border-black bg-[#121316] text-white p-5 flex flex-col justify-between gap-3 shadow-[4px_4px_0px_#00D084]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-[#00D084] font-black tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00D084] animate-ping" />
                        Operative Deployed
                      </span>
                      <span className="text-[10px] font-mono bg-[#FFB800] text-black px-1.5 py-0.5 font-black uppercase border border-black">
                        LIVE 3D
                      </span>
                    </div>
                    <div className="text-2xl font-black flex items-center gap-2 mt-0.5 text-white">
                      <span>Travel Operative</span>
                    </div>
                  </div>

                  <div className="h-44 w-full relative overflow-hidden border border-white/20 bg-black">
                    <CharacterShowcase
                      selectedCountryCode={targetLang}
                      selectedCountryName={selectedCountry.country}
                      selectedCountryFlag={selectedCountry.flag}
                      nativeLangName={selectedNativeLang.name}
                      mode="compact"
                      className="h-full border-0 shadow-none"
                    />
                  </div>

                  <div className="border-t-2 border-white/20 pt-2 flex flex-col gap-0.5 text-[11px] font-mono text-white/90">
                    <div>
                      <span className="font-bold text-[#FFB800]">Attire: </span>
                      <span>Sky Blue Field Uniform</span>
                    </div>
                    <div className="text-white/60">
                      Spawn point calibrated at Central District Cafe.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleEdit}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit Preferences</span>
                </button>

                <Link
                  href={`/map?target=${encodeURIComponent(targetLang)}&native=${encodeURIComponent(nativeLang)}`}
                  onClick={() => {
                    writeStoredPref(TARGET_KEY, targetLang);
                    writeStoredPref(NATIVE_KEY, nativeLang);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#FFB800] text-black border-2 border-black shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore 3D Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
