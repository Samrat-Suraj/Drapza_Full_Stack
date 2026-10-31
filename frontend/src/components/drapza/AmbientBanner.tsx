import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { audioSystem } from "./AudioSystem";

export function AmbientBanner() {
  const [ambientActive, setAmbientActive] = useState(true);

  return (
    <div className="relative w-full bg-base-700 text-base-100 py-12 px-6 overflow-hidden border-y border-white/10">
      {ambientActive && (
        <div className="pointer-events-none absolute inset-0 bg-halftone-xl opacity-25 animate-star-twinkle" aria-hidden="true" />
      )}

      <div className="relative z-10 mx-auto max-w-[1800px] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
          <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-300 font-medium">
            [ ATMOSPHERIC SIGNAL AMBIENCE ]
          </span>
        </div>

        <p className="font-display text-lg sm:text-2xl uppercase tracking-wider text-center md:text-left font-light">
          REDUCED TO PURE SIGNAL. MODULAR SILHOUETTES FOR THE FRICTIONLESS.
        </p>

        <button
          onClick={() => {
            audioSystem.playClick(600);
            setAmbientActive(!ambientActive);
          }}
          aria-label={ambientActive ? "Turn off background ambience" : "Turn on background ambience"}
          className="font-mono-technical text-[10px] uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          {ambientActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span>{ambientActive ? "AMBIENCE: ON" : "AMBIENCE: OFF"}</span>
        </button>
      </div>
    </div>
  );
}
