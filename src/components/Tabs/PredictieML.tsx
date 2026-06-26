/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { PredictionResult } from "../../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BrainCircuit, Sparkles, Sliders, ListFilter } from "lucide-react";

interface PredictieMLProps {
  predictions: PredictionResult[];
  jokerPredictions?: PredictionResult[];
  onTopNumsChange?: (nums: number[]) => void;
}

export default function PredictieML({ predictions, jokerPredictions, onTopNumsChange }: PredictieMLProps) {
  const [topK, setTopK] = useState<number>(12);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [parityFilter, setParityFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"main" | "joker">("main");

  // Determine active predictions list
  const activePredictions = useMemo(() => {
    return viewMode === "joker" && jokerPredictions && jokerPredictions.length > 0
      ? jokerPredictions
      : predictions;
  }, [viewMode, predictions, jokerPredictions]);

  // Get recommended numbers (top K sorted by hybrid score)
  const topRecommended = useMemo(() => {
    const nums = predictions.slice(0, topK).map(p => p.num);
    if (onTopNumsChange) {
      // Safely pass to parent
      setTimeout(() => onTopNumsChange(nums), 0);
    }
    return nums;
  }, [predictions, topK, onTopNumsChange]);

  // Chart data: top 10 numbers
  const chartData = useMemo(() => {
    return activePredictions.slice(0, 10).map(p => ({
      name: viewMode === "joker" ? `Joker ${p.num}` : `Nr. ${p.num}`,
      "Scor Hibrid": parseFloat(p.hybridScore.toFixed(4)),
      num: p.num
    }));
  }, [activePredictions, viewMode]);

  // Filtering table
  const filteredPredictions = useMemo(() => {
    return activePredictions.filter(p => {
      const matchesSearch = p.num.toString() === searchTerm.trim() || p.group.includes(searchTerm);
      const matchesParity = parityFilter === "All" || p.parity === parityFilter;
      return matchesSearch && matchesParity;
    });
  }, [activePredictions, searchTerm, parityFilter]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="ml-prediction-container">
      {/* Recommended Numbers Panel with Glass Styling */}
      <div className="lg:col-span-3 glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden" id="recommended-panel">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest font-mono">
                Top Numere Recomandate (Scor Hibrid)
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Modelul ML antrenat analizează tranziția istorică dintre extrageri.
              Scorul hibrid combină probabilitatea prezisă (60%) cu frecvența istorică normalized (40%).
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Dimensiune set:</span>
            </div>
            <input
              type="range"
              min="3"
              max="24"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-32 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              id="top-k-slider"
            />
            <span className="font-mono text-xs font-black text-yellow-400 w-6 text-center">{topK}</span>
          </div>
        </div>

        {/* Displaying numbers in gorgeous lottery balls conforming to Theme */}
        <div className="mt-6 flex flex-wrap gap-3 items-center justify-center bg-slate-950/40 p-5 rounded-xl border border-white/5" id="ball-recommendations">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mr-2">Top {topK} recomandări:</span>
          {topRecommended.map((num, i) => (
            <div
              key={`${num}-${i}`}
              className={`lotto-number ${i < 6 ? "active" : ""} transform hover:scale-115 cursor-default select-none shadow-md text-sm`}
              title={`Recomandarea #${i + 1}`}
            >
              {num}
            </div>
          ))}
        </div>

        {jokerPredictions && jokerPredictions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 items-center justify-center bg-slate-950/60 p-4 rounded-xl border border-red-500/10" id="joker-ball-recommendations">
            <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mr-2">Top Joker (Bila Bonus 1-20):</span>
            {jokerPredictions.slice(0, 5).map((p, i) => (
              <div className="flex items-center gap-1.5 animate-fade-in" key={`joker-rec-${p.num}`}>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-800 text-white font-black text-[11px] flex items-center justify-center border border-red-400 shadow-lg shadow-red-500/20 transform hover:scale-115 cursor-default select-none"
                  title={`Joker recomandat #${i + 1} (Scor: ${p.hybridScore.toFixed(3)})`}
                >
                  {p.num}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mr-2">#{i+1} ({(p.hybridScore * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main ML probability table in Glass Styling */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-xl flex flex-col" id="predictions-table-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-yellow-400" />
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
                Probabilități Detaliate
              </h4>
            </div>

            {/* Toggle between Main and Joker if Joker predictions exist */}
            {jokerPredictions && jokerPredictions.length > 0 && (
              <div className="flex bg-slate-950/80 border border-white/15 rounded-xl p-0.5 shadow-inner">
                <button
                  onClick={() => setViewMode("main")}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    viewMode === "main"
                      ? "bg-yellow-400 text-black shadow-sm animate-fade-in"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Numere Principale
                </button>
                <button
                  onClick={() => setViewMode("joker")}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    viewMode === "joker"
                      ? "bg-red-500 text-white shadow-sm shadow-red-500/25 animate-fade-in"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Bilă Joker (1-20)
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Caută număr sau grup..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/50"
              />
            </div>
            
            {/* Parity selector */}
            <div className="flex bg-slate-950 border border-white/10 rounded-xl p-0.5">
              {["All", "Par", "Impar"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setParityFilter(mode)}
                  className={`px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    parityFilter === mode
                      ? "bg-yellow-400 text-black shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "All" ? "Toate" : mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto flex-grow max-h-[460px] custom-scrollbar border border-white/10 rounded-xl bg-slate-950/40" id="predictions-scroll-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10">
                <th className="py-3 px-4 text-center">Rang</th>
                <th className="py-3 px-4">Număr</th>
                <th className="py-3 px-4">Probabilitate ML</th>
                <th className="py-3 px-4">Frecvență</th>
                <th className="py-3 px-4 text-yellow-400">Scor Hibrid</th>
                <th className="py-3 px-4 text-center">Paritate</th>
                <th className="py-3 px-4">Grupă</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPredictions.map((row, index) => {
                const globalIndex = activePredictions.findIndex(p => p.num === row.num) + 1;
                const isRecommended = viewMode === "main" ? topRecommended.includes(row.num) : (index < 5);
                return (
                  <tr
                    key={row.num}
                    className={`text-xs data-row transition-colors ${
                      isRecommended
                        ? viewMode === "joker"
                          ? "bg-red-500/[0.02]"
                          : "bg-yellow-400/[0.02]"
                        : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-400">
                      {globalIndex}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono font-black border text-xs ${
                        viewMode === "joker"
                          ? isRecommended
                            ? "bg-red-500/15 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                            : "bg-slate-900 border-white/10 text-slate-300"
                          : isRecommended
                          ? "bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_8px_rgba(255,255,0,0.15)]"
                          : "bg-slate-900 border-white/10 text-slate-300"
                      }`}>
                        {row.num}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200 text-right w-10">
                          {(row.mlProb * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full ${viewMode === "joker" ? "bg-red-500" : "bg-yellow-400"}`}
                            style={{ width: `${Math.min(100, row.mlProb * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {row.frequency} trageri
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-black text-sm ${viewMode === "joker" ? "text-red-400" : "text-yellow-400"}`}>
                        {row.hybridScore.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono uppercase font-extrabold tracking-wider ${
                        row.parity === "Par"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {row.parity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {row.group}
                    </td>
                  </tr>
                );
              })}
              {filteredPredictions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                    Nu s-au găsit numere pentru filtrele selectate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          <span>Afișate: {filteredPredictions.length} din {activePredictions.length} numere</span>
          {searchTerm && <span>Filtru: "{searchTerm}"</span>}
        </div>
      </div>

      {/* Chart Panel with Glass Styling */}
      <div className="lg:col-span-1 glass-panel rounded-2xl p-6 shadow-xl flex flex-col" id="chart-panel">
        <div className="flex items-center gap-2 mb-6">
          <ListFilter className={`w-5 h-5 ${viewMode === "joker" ? "text-red-400" : "text-yellow-400"}`} />
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            {viewMode === "joker" ? "Top 10 Joker Scor Hibrid" : "Top 10 Scor Hibrid"}
          </h4>
        </div>

        <div className="flex-grow flex items-center justify-center h-[340px] w-full" id="hybrid-score-barchart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis type="number" stroke="#475569" fontSize={10} domain={[0, "auto"]} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#475569"
                fontSize={10}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0B0E",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: viewMode === "joker" ? "#EF4444" : "#FFFF00", fontWeight: "bold", fontSize: "11px" }}
                itemStyle={{ color: viewMode === "joker" ? "#EF4444" : "#FFFF00", fontSize: "11px" }}
              />
              <Bar dataKey="Scor Hibrid" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => {
                  const isTopPick = index < 3;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isTopPick ? (viewMode === "joker" ? "#EF4444" : "#FFFF00") : "#475569"}
                      fillOpacity={0.95 - index * 0.05}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/10">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Legendă Scor Hibrid</h5>
          <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${viewMode === "joker" ? "bg-red-500" : "bg-yellow-400"}`} />
              <span>Top 3 Scoruri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-600" />
              <span>Alte Recomandări</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
