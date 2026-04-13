"use client";

import PitchDeck from "@/components/PitchDeck";

export default function PitchPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <PitchDeck onShowDemo={() => window.location.href = "/"} />
    </main>
  );
}
