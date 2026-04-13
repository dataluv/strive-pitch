"use client";

import { useState } from "react";
import StriveDemo from "@/components/StriveDemo";
import PitchDeck from "@/components/PitchDeck";

export default function Home() {
  const [view, setView] = useState<"demo" | "pitch">("pitch");

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Mode toggle — presenter only */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        <button
          onClick={() => setView("pitch")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === "pitch"
              ? "bg-[#1a1f36] text-white shadow-lg"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Pitch
        </button>
        <button
          onClick={() => setView("demo")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === "demo"
              ? "bg-[#00B894] text-white shadow-lg"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Live Demo
        </button>
      </div>

      {view === "pitch" ? <PitchDeck onShowDemo={() => setView("demo")} /> : <StriveDemo />}
    </main>
  );
}
