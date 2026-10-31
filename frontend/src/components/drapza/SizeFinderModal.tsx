import { useState } from "react";
import { X, Check, Ruler, Sliders, Scissors } from "lucide-react";
import { audioSystem } from "./AudioSystem";
import { sizeFinderSchema } from "@/lib/validation";
import { useLockBodyScroll } from "./useLockBodyScroll";

interface SizeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomSizeModal?: () => void;
}

export function SizeFinderModal({ isOpen, onClose, onOpenCustomSizeModal }: SizeFinderModalProps) {
  const [heightCm, setHeightCm] = useState(178);
  const [fitType, setFitType] = useState<"boxy" | "tapered" | "oversized">("boxy");

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  // Validate with Zod
  const validation = sizeFinderSchema.safeParse({ heightCm, fitType });
  const validHeight = validation.success ? validation.data.heightCm : 178;
  const validFit = validation.success ? validation.data.fitType : "boxy";

  // Calculate size recommendation
  let recommendedSize = "M";
  if (validHeight < 170) recommendedSize = validFit === "oversized" ? "M" : "S";
  else if (validHeight < 182) recommendedSize = validFit === "oversized" ? "L" : "M";
  else recommendedSize = validFit === "boxy" ? "L" : "XL";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Silhouette Calculator"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={() => {
          audioSystem.playClick(400);
          onClose();
        }}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white border border-neutral-200 p-6 sm:p-8 text-neutral-900 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            audioSystem.playClick(400);
            onClose();
          }}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-950 p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Close size finder"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Ruler className="h-4 w-4 text-neutral-900" />
          <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-500 font-semibold">
            [ SILHOUETTE CALCULATOR ]
          </span>
        </div>

        <h2 className="font-sans text-xl sm:text-2xl uppercase tracking-tight text-neutral-950 font-bold">
          FIND YOUR FIT MODULE
        </h2>

        {/* Height Slider */}
        <div className="mt-6 bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
          <div className="flex justify-between items-center font-mono-technical text-xs uppercase text-neutral-600 font-semibold">
            <span>YOUR HEIGHT</span>
            <span className="font-bold text-neutral-950 text-sm">
              {heightCm} CM ({Math.floor(heightCm / 30.48)}&apos;{Math.round((heightCm % 30.48) / 2.54)}&quot;)
            </span>
          </div>
          <input
            type="range"
            min="155"
            max="205"
            value={heightCm}
            onChange={(e) => {
              audioSystem.playClick(1000, 0.005);
              setHeightCm(Number(e.target.value));
            }}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>

        {/* Fit Preference */}
        <div className="mt-5">
          <span className="font-mono-technical text-xs uppercase tracking-wider text-neutral-600 font-semibold block mb-2.5">
            PREFERRED CUT &amp; SILHOUETTE
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "boxy", label: "BOXY / NEUTRAL" },
              { id: "tapered", label: "TAPERED SLIM" },
              { id: "oversized", label: "OVERSIZED DROP" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  audioSystem.playClick(600);
                  setFitType(item.id as "boxy" | "tapered" | "oversized");
                }}
                className={`py-3 px-2 rounded-xl font-mono-technical text-[11px] uppercase tracking-wider font-semibold border transition-all cursor-pointer ${
                  fitType === item.id
                    ? "bg-black text-white border-black shadow-lg font-bold"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation Box */}
        <div className="mt-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-white shadow-xl">
          <div>
            <span className="font-mono-technical text-[10px] uppercase tracking-[0.2em] text-neutral-400 block font-semibold">
              RECOMMENDED MODULE SIZE
            </span>
            <span className="font-display text-4xl text-white uppercase font-bold mt-1 block">
              SIZE {recommendedSize}
            </span>
          </div>

          <button
            onClick={() => {
              audioSystem.playClick(900);
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-white text-black font-mono-technical text-xs uppercase font-bold tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            <span>APPLY SIZE {recommendedSize}</span>
          </button>
        </div>

        {/* Bespoke Custom Sizing CTA Banner */}
        {onOpenCustomSizeModal && (
          <div className="mt-5 pt-3.5 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-[11px] text-neutral-600 font-mono-technical">
              Need 100% tailor-calibrated bespoke measurements?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomSizeModal();
              }}
              className="text-neutral-900 hover:text-black text-xs font-bold uppercase flex items-center gap-1.5 font-mono-technical transition-colors cursor-pointer bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-200"
            >
              <Scissors className="w-3.5 h-3.5 text-neutral-900" />
              <span>Book Atelier Fitting</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
