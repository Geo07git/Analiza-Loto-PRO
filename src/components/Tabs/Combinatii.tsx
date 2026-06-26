/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Draw, ComboResult } from "../../types";
import { getCombinations } from "../../utils/calculations";
import { Copy, Check, Hash, Award, HelpCircle, TriangleAlert } from "lucide-react";

interface CombinatiiProps {
  draws: Draw[];
  maxNum: number;
  numsReq: number; // e.g. 5 or 6
}

export default function Combinatii({ draws, maxNum, numsReq }: CombinatiiProps) {
  const [comboSize, setComboSize] = useState<number>(3);
  const [minFreq, setMinFreq] = useState<number>(2);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Dynamically bound combination size to the lottery size (e.g., max 6 for 6/49, max 5 for Joker)
  const maxComboSize = useMemo(() => {
    return Math.min(numsReq, 6); // Cap at 6 to prevent high CPU calculation times
  }, [numsReq]);

  // Adjust combo size if it exceeds the new limit
  React.useEffect(() => {
    if (comboSize > maxComboSize) {
      setComboSize(maxComboSize);
    }
  }, [maxComboSize, comboSize]);

  // Calculate combinations based on user criteria
  const { comboList, bestCombo, worstCombo } = useMemo(() => {
    return getCombinations(draws, maxNum, comboSize, minFreq);
  }, [draws, maxNum, comboSize, minFreq]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const isSlowWarning = comboSize >= 5 && draws.length > 250;

  return (
    <div className="space-y-6 animate-fade-in" id="combinations-tab-container">
      {/* Configuration Panel with Glass Styling */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="combo-config">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            Setări Căutare Combinații Frecvente
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Combo Size */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Dimensiune Combinație (K numere)
              </label>
              <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded font-mono font-extrabold uppercase tracking-wide">
                {comboSize} din {numsReq}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max={maxComboSize}
              value={comboSize}
              onChange={(e) => setComboSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400 mt-2"
              id="combo-size-slider"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider mt-1.5">
              <span>Perechi (2)</span>
              <span>Triplete (3)</span>
              {maxComboSize >= 4 && <span>Cvartete (4)</span>}
              {maxComboSize >= 5 && <span>Chinte (5)</span>}
              {maxComboSize >= 6 && <span>Sextete (6)</span>}
            </div>
          </div>

          {/* Min Frequency */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Frecvență Minimă Apariții
              </label>
              <span className="text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded font-mono font-extrabold uppercase tracking-wide">
                ≥ {minFreq} ori
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="number"
                min="1"
                max="50"
                value={minFreq}
                onChange={(e) => setMinFreq(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3.5 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-yellow-400/50"
              />
              <span className="text-[11px] text-slate-400">
                Afișează doar combinațiile care au apărut în istoric de cel puțin {minFreq} ori.
              </span>
            </div>
          </div>
        </div>

        {isSlowWarning && (
          <div className="mt-4 p-3.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs rounded-xl flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] block mb-0.5">Avertisment Performanță:</span> Dimensiunile mari de combinații (≥ 5) analizate pe un istoric vast de extrageri pot crește timpul de calcul pe browser. Vă sugerăm să păstrați dimensiunea sub 6 pentru un răspuns instant.
            </div>
          </div>
        )}
      </div>

      {/* Extremes Section (Probable vs Improbable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="combination-extremes">
        {/* Most Probable */}
        <div className="glass-panel rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-mono font-extrabold text-green-400 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                Algoritm Scor Global
              </span>
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider mt-2.5 flex items-center gap-1.5 font-mono">
                <Award className="w-4 h-4 text-green-400" />
                Cea Mai Probabilă Combinație
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Combinația cu cel mai mare scor cumulat de frecvență a numerelor individuale.
              </p>
            </div>
          </div>

          {bestCombo ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 items-center mb-4 bg-slate-950 p-4 rounded-xl border border-white/5">
                {bestCombo.combo.split(", ").map((num, idx) => (
                  <span
                    key={`${num}-${idx}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black font-mono text-sm bg-gradient-to-br from-green-500/20 to-green-950/40 text-green-400 border border-green-500/30 shadow-md shadow-green-500/5"
                  >
                    {num}
                  </span>
                ))}
                <button
                  onClick={() => handleCopy(bestCombo.combo)}
                  className="ml-auto text-slate-400 hover:text-slate-200 transition-colors p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                  title="Copiază numerele"
                >
                  {copiedText === bestCombo.combo ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40 p-3 rounded-lg">
                <div>
                  Frecvență: <span className="text-green-400 font-black">{bestCombo.frequency} ori</span>
                </div>
                <div>
                  Scor Total: <span className="text-green-400 font-black">{bestCombo.totalScore}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic mt-6">Nicio combinație identificată în istoric.</p>
          )}
        </div>

        {/* Most Improbable */}
        <div className="glass-panel rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-mono font-extrabold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                Evitarea Zilei Slabe
              </span>
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider mt-2.5 flex items-center gap-1.5 font-mono">
                <TriangleAlert className="w-4 h-4 text-red-400" />
                Cea Mai Improbabilă Combinație
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Combinația istorică având cel mai mic scor total de frecvență a componentelor.
              </p>
            </div>
          </div>

          {worstCombo ? (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 items-center mb-4 bg-slate-950 p-4 rounded-xl border border-white/5">
                {worstCombo.combo.split(", ").map((num, idx) => (
                  <span
                    key={`${num}-${idx}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black font-mono text-sm bg-gradient-to-br from-red-500/20 to-red-950/40 text-red-400 border border-red-500/30 shadow-md shadow-red-500/5"
                  >
                    {num}
                  </span>
                ))}
                <button
                  onClick={() => handleCopy(worstCombo.combo)}
                  className="ml-auto text-slate-400 hover:text-slate-200 transition-colors p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                  title="Copiază numerele"
                >
                  {copiedText === worstCombo.combo ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40 p-3 rounded-lg">
                <div>
                  Frecvență: <span className="text-red-400 font-black">{worstCombo.frequency} ori</span>
                </div>
                <div>
                  Scor Total: <span className="text-red-400 font-black">{worstCombo.totalScore}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic mt-6">Nicio combinație identificată în istoric.</p>
          )}
        </div>
      </div>

      {/* Main Table Panel with Glass Styling */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="combinations-results-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
              Top 15 Combinații de Dimensiune {comboSize}
            </h4>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-950 px-3.5 py-1.5 rounded-xl border border-white/10">
            Filtru: Frecvență ≥ {minFreq}
          </span>
        </div>

        {comboList.length > 0 ? (
          <div className="overflow-x-auto border border-white/10 rounded-xl bg-slate-950/40" id="combo-scroll-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <th className="py-3 px-4 text-center">Rang</th>
                  <th className="py-3 px-4">Combinație Numere</th>
                  <th className="py-3 px-4 text-center">Apariții în Istoric (Frecvență)</th>
                  <th className="py-3 px-4 text-center text-yellow-400">Scor Global Cumulat</th>
                  <th className="py-3 px-4 text-right">Copiază</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {comboList.map((row, index) => (
                  <tr key={row.combo} className="data-row hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex gap-1.5 flex-wrap">
                        {row.combo.split(", ").map((n, i) => (
                          <span key={`${n}-${i}`} className="inline-block bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded font-black text-yellow-400 text-[11px]">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-cyan-400">
                      {row.frequency} ori
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-yellow-400">
                      {row.totalScore}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleCopy(row.combo)}
                        className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Copiază combinația"
                      >
                        {copiedText === row.combo ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center rounded-xl bg-slate-950/20 border border-white/10 border-dashed" id="no-combos-found">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Nicio combinație găsită</h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Nu s-au găsit combinații de dimensiune {comboSize} cu o frecvență de cel puțin {minFreq}. Încercați să micșorați frecvența minimă sau dimensiunea combinației.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
