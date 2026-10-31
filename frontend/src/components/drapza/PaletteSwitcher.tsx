import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { audioSystem } from "./AudioSystem";

export type PaletteTheme = "noir" | "mono" | "charcoal";

export function PaletteSwitcher() {
  const [theme, setTheme] = useState<PaletteTheme>("noir");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "mono") {
      root.style.setProperty("--base-100", "#ffffff");
      root.style.setProperty("--base-200", "#f4f4f5");
      root.style.setProperty("--base-300", "#d4d4d8");
      root.style.setProperty("--base-400", "#71717a");
      root.style.setProperty("--base-500", "#52525b");
      root.style.setProperty("--base-600", "#18181b");
      root.style.setProperty("--base-700", "#000000");
    } else if (theme === "charcoal") {
      root.style.setProperty("--base-100", "#0d0e11");
      root.style.setProperty("--base-200", "#17181d");
      root.style.setProperty("--base-300", "#24262f");
      root.style.setProperty("--base-400", "#a1a1aa");
      root.style.setProperty("--base-500", "#d4d4d8");
      root.style.setProperty("--base-600", "#f4f4f5");
      root.style.setProperty("--base-700", "#ffffff");
    } else {
      // Default Pure Noir Monochrome
      root.style.setProperty("--base-100", "#000000");
      root.style.setProperty("--base-200", "#111111");
      root.style.setProperty("--base-300", "#222222");
      root.style.setProperty("--base-400", "#a3a3a3");
      root.style.setProperty("--base-500", "#d4d4d4");
      root.style.setProperty("--base-600", "#ffffff");
      root.style.setProperty("--base-700", "#ffffff");
    }
  }, [theme]);

  const cycleTheme = () => {
    audioSystem.playClick(700);
    if (theme === "noir") setTheme("mono");
    else if (theme === "mono") setTheme("charcoal");
    else setTheme("noir");
  };

  return (
    <button
      onClick={cycleTheme}
      className="font-mono-technical text-[10px] sm:text-xs uppercase tracking-widest bg-white/10 hover:bg-white text-white hover:text-black px-3 py-1 rounded-full border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
      title="Switch Noir Monochrome Colorway"
    >
      <Palette className="h-3 w-3 text-neutral-300" />
      <span>
        {theme === "noir" ? "[ NOIR: PURE BLACK ]" : theme === "mono" ? "[ MONO: PURE WHITE ]" : "[ NOIR: OBSIDIAN ]"}
      </span>
    </button>
  );
}

