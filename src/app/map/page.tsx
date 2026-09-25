"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import WorldCanvas with SSR disabled to ensure Three.js WebGL context initializes in the browser
const WorldCanvas = dynamic(() => import("@/components/map/WorldCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-mono gap-3">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <span className="text-xs uppercase tracking-widest text-white/70">
        Loading 3D Map Prototype...
      </span>
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();

  return (
    <main className="w-full h-screen overflow-hidden">
      <WorldCanvas onBackToOnboarding={() => router.push("/")} />
    </main>
  );
}
