/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LotoType, Draw } from "../types";
import { Sparkles, Dice5, Milestone } from "lucide-react";

interface LotoHeaderProps {
  selectedLoto: LotoType;
  onLotoChange: (loto: LotoType) => void;
  lastDraw: Draw | null;
}

const LOTO_LABELS: Record<LotoType, { desc: string; colors: string }> = {
  "Romania 6/49": {
    desc: "Extragere clasică unde se selectează 6 numere unice dintr-un total de 49.",
    colors: "from-amber-500 to-amber-600"
  },
  "Romania - Joker": {
    desc: "Extragere de tip Joker bazată pe selectarea a 5 numere dintr-un set de 45, plus o bilă Joker bonus din intervalul 1-20.",
    colors: "from-sky-500 to-indigo-600"
  },
  "Romania 5/40": {
    desc: "Extragere de mare precizie cu 6 numere extrase dintr-o urnă de 40, castiguri cu 5 numere",
    colors: "from-emerald-500 to-teal-600"
  }
};

export default function LotoHeader({
  selectedLoto,
  onLotoChange,
  lastDraw
}: LotoHeaderProps) {
  const currentDetails = LOTO_LABELS[selectedLoto];

  // Map Selected Loto to a simple display label for watermark (e.g. 6/49, Joker, 5/40)
  const watermarkText = selectedLoto.includes("6/49") 
    ? "6/49" 
    : selectedLoto.includes("Joker") 
    ? "JOKER" 
    : "5/40";

  return (
    <div className="space-y-6" id="loto-header-container">
      {/* Visual Title Header in Bold Typography styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Playfair Display Watermark on Background */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl md:text-9xl font-serif font-black italic text-white/[0.03] select-none pointer-events-none tracking-tighter uppercase">
          {watermarkText}
        </div>

        <div className="space-y-3.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-[10px] font-bold font-mono tracking-widest text-yellow-400 uppercase">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            ENGINE v2.5 — Machine Learning Active
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4.5xl font-black text-slate-100 tracking-tighter uppercase leading-none font-sans">
              Analiză Loto <span className="text-yellow-400 neon-text">Pro</span>
            </h1>
            <div className="flex items-center gap-2 pt-1.5">
              <div className="accent-bar" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                Sistem matematic de analiză predictivă
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Utilizează rețele de decizie hibride (Random Forest TS) și matrici de tranziție Markoviene pentru calcul probabilistic avansat al jocurilor loto din România.
          </p>
        </div>

        {/* Lottery Selection Selector */}
        <div className="relative z-10 bg-slate-950/85 p-5 rounded-2xl border border-white/10 min-w-[260px] shadow-2xl">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 font-sans">
            Selectare Loterie Activă
          </label>
          <div className="relative">
            <select
              value={selectedLoto}
              onChange={(e) => onLotoChange(e.target.value as LotoType)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold tracking-tight focus:outline-none focus:border-yellow-400 cursor-pointer appearance-none"
              id="loto-select-box"
            >
              <option value="Romania 6/49">România 6/49</option>
              <option value="Romania - Joker">România - Joker (5/45)</option>
              <option value="Romania 5/40">România 5/40</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Dice5 className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 leading-normal">
            {currentDetails.desc}
          </p>
        </div>
      </div>

      {/* Glowing banner displaying the last draw with Bold Typography styling */}
      {lastDraw && (
        <div
          className="glass-panel rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden"
          id="last-draw-banner"
          style={{
            boxShadow: "0 4px 20px rgba(255, 255, 0, 0.04)",
          }}
        >
          {/* Subtle gold grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,0,0.015)_1px,transparent_1px)] bg-[size:14px_14px]" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shrink-0">
                <Milestone className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  Ultima Extragere Istorică Înregistrată
                </span>
                <span className="text-sm font-black text-slate-100 tracking-tight">
                  Extragerea ID {lastDraw.id}
                </span>
              </div>
            </div>

            {/* Winning Balls list with the style of active lotto-number */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-yellow-400 font-extrabold uppercase tracking-widest mr-1">
                NUMERE EXTRASE:
              </span>
              <div className="flex items-center gap-2">
                {lastDraw.numbers.map((num, idx) => (
                  <div
                    key={`${num}-${idx}`}
                    className="lotto-number active transform hover:scale-110 cursor-default select-none shadow-lg text-sm"
                  >
                    {num}
                  </div>
                ))}
                
                {lastDraw.joker !== undefined && (
                  <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
                    <span className="text-[10px] font-mono text-red-400 font-extrabold uppercase tracking-widest">
                      JOKER:
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-800 text-white font-black text-xs flex items-center justify-center border border-red-400 shadow-lg shadow-red-500/20 transform hover:scale-110 cursor-default select-none">
                      {lastDraw.joker}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
