/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useTransition, useMemo } from "react";
import { Draw, BacktestRow } from "../../types";
import { runBacktest } from "../../utils/calculations";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Play, Activity, Award, HelpCircle, RefreshCw } from "lucide-react";

interface BacktestProps {
  draws: Draw[];
  maxNum: number;
}

export default function Backtest({ draws, maxNum }: BacktestProps) {
  const [nTest, setNTest] = useState<number>(5);
  const [topK, setTopK] = useState<number>(5);
  const [backtestData, setBacktestData] = useState<{
    rows: BacktestRow[];
    avgHits: number;
    randomExpected: number;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number>(0);

  // Maximum testable draws bounded by dataset size
  const maxTestDraws = useMemo(() => {
    return Math.max(5, Math.min(60, draws.length - 12));
  }, [draws]);

  // Adjust sliders if they exceed bounds
  React.useEffect(() => {
    if (nTest > maxTestDraws) {
      setNTest(maxTestDraws);
    }
  }, [maxTestDraws, nTest]);

  const handleStartBacktest = () => {
    setProgress(0);
    startTransition(() => {
      // Run backtest in a transition to avoid blocking UI main thread completely
      const result = runBacktest(draws, maxNum, nTest, topK, (prog) => {
        setProgress(prog);
      });
      setBacktestData({
        rows: result.backtestRows,
        avgHits: result.avgHits,
        randomExpected: result.randomExpected
      });
    });
  };

  // Prepare line chart data
  const chartData = useMemo(() => {
    if (!backtestData) return [];
    return backtestData.rows.map((r) => ({
      name: `Ex. ${r.drawIndex}`,
      "Nimeriri": r.hits,
      drawId: r.drawId
    }));
  }, [backtestData]);

  const advantage = backtestData ? backtestData.avgHits - backtestData.randomExpected : 0;

  return (
    <div className="space-y-6 animate-fade-in" id="backtest-tab-container">
      {/* Configuration Controls with Glass Styling */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="backtest-config">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            Simulator de Backtest pe Extrageri Istorice
          </h3>
        </div>

        <p className="text-xs text-slate-400 mb-6 max-w-2xl leading-normal">
          Backtestul antrenează în mod repetat modelul ML pe un sub-set istoric (de exemplu, extragerile 1 la T) și evaluează capacitatea sa de a prezice rezultatele extragerii imediat următoare (T+1). Aceasta este singura metodă științifică de validare a algoritmilor predictivi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Slider 1: N_TEST */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Număr trageri testate
              </label>
              <span className="text-xs font-mono font-black text-yellow-400">{nTest}</span>
            </div>
            <input
              type="range"
              min="5"
              max={maxTestDraws}
              value={nTest}
              onChange={(e) => setNTest(parseInt(e.target.value))}
              disabled={isPending}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400 mt-2"
              id="backtest-test-slider"
            />
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block mt-1.5">
              Min 5 / Max {maxTestDraws} extrageri
            </span>
          </div>

          {/* Slider 2: TOP_K */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Numere prezise per tragere
              </label>
              <span className="text-xs font-mono font-black text-cyan-400">{topK}</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              disabled={isPending}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
              id="backtest-topk-slider"
            />
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block mt-1.5">
              Selecție top recomandări (3 - 15)
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartBacktest}
            disabled={isPending}
            className={`w-full py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-400/10 border-none ${
              isPending
                ? "bg-slate-800 text-slate-400"
                : "bg-yellow-400 hover:bg-yellow-350 text-black hover:shadow-yellow-400/20"
            }`}
            id="start-backtest-btn"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                Se rulează ({progress}%) ...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-black" />
                Rulează Backtest
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isPending && (
          <div className="mt-6">
            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 font-mono mb-1.5 tracking-wider">
              <span>Se antrenează {nTest} modele RandomForest successive...</span>
              <span className="font-black text-yellow-400">{progress}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {backtestData ? (
        <div className="space-y-6 animate-fade-in" id="backtest-results">
          {/* Metrics Panel with Glass Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="backtest-metrics-grid">
            {/* Media ML */}
            <div className="glass-panel p-5 rounded-2xl shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shrink-0">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Nimeriri Medii ML
                </span>
                <h4 className="text-2xl font-black text-slate-100 font-mono mt-0.5">
                  {backtestData.avgHits.toFixed(2)}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Numere ghicite corect de model</p>
              </div>
            </div>

            {/* Random Expected */}
            <div className="glass-panel p-5 rounded-2xl shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                <HelpCircle className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Așteptat Aleator (Șansă)
                </span>
                <h4 className="text-2xl font-black text-slate-400 font-mono mt-0.5">
                  {backtestData.randomExpected.toFixed(2)}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Speranța matematică chioară</p>
              </div>
            </div>

            {/* Advantage */}
            <div className={`glass-panel p-5 rounded-2xl shadow-lg flex items-center gap-4 border ${
              advantage >= 0 ? "border-green-500/25 bg-green-500/[0.01]" : "border-red-500/25 bg-red-500/[0.01]"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                advantage >= 0 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Avantaj față de aleator
                </span>
                <h4 className={`text-2xl font-black font-mono mt-0.5 ${
                  advantage >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {advantage >= 0 ? "+" : ""}{advantage.toFixed(2)}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Marginea predictivă a algoritmului</p>
              </div>
            </div>
          </div>

          {/* Graphical Representation */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col" id="backtest-linechart-panel">
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono mb-6">
              Nimeriri per Extragere Istorică (Top {topK} numere)
            </h4>

            <div className="h-[280px] w-full" id="backtest-recharts-line">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
                  <YAxis stroke="#64748B" fontSize={9} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0B0E",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ fontSize: "11px", color: "#FFFF00" }}
                    labelStyle={{ fontSize: "11px", color: "#94a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Nimeriri"
                    stroke="#FFFF00"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4 }}
                  />
                  {/* ML Average baseline */}
                  <ReferenceLine
                    y={backtestData.avgHits}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Medie ML: ${backtestData.avgHits.toFixed(2)}`,
                      fill: "#10b981",
                      fontSize: 9,
                      position: "top"
                    }}
                  />
                  {/* Random baseline */}
                  <ReferenceLine
                    y={backtestData.randomExpected}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: `Aleator: ${backtestData.randomExpected.toFixed(2)}`,
                      fill: "#ef4444",
                      fontSize: 9,
                      position: "bottom"
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Raw backtest comparison spreadsheet */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl" id="backtest-results-sheet">
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono mb-4">
              Registru Rezultate Backtest
            </h4>

            <div className="overflow-x-auto border border-white/10 rounded-xl max-h-[300px] custom-scrollbar bg-slate-950/40" id="backtest-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 sticky top-0 z-10">
                    <th className="py-3 px-4">Extragere</th>
                    <th className="py-3 px-4">Numere Prezise de ML</th>
                    <th className="py-3 px-4">Numere Extrase Real</th>
                    <th className="py-3 px-4 text-center">Nimeriri</th>
                    <th className="py-3 px-4 text-center">Fidelitate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono text-slate-300">
                  {backtestData.rows.slice().reverse().map((row) => (
                    <tr key={row.drawIndex} className="data-row hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-bold whitespace-nowrap">
                        {row.drawId}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {row.predicted.map((n, idx) => {
                            const isHit = row.actual.includes(n);
                            return (
                              <span
                                key={`${n}-${idx}`}
                                className={`inline-block px-1.5 py-0.5 rounded border text-[11px] font-black ${
                                  isHit
                                    ? "bg-green-500/15 border-green-500 text-green-400 scale-105 shadow-[0_0_8px_rgba(34,197,94,0.15)]"
                                    : "bg-slate-900 border-white/5 text-slate-400 font-medium"
                                }`}
                              >
                                {n}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        <div className="flex gap-1.5 flex-wrap">
                          {row.actual.map((n, idx) => {
                            const isPredicted = row.predicted.includes(n);
                            return (
                              <span
                                key={`${n}-${idx}`}
                                className={`inline-block px-1.5 py-0.5 rounded border text-[11px] font-black ${
                                  isPredicted
                                    ? "bg-green-500/15 border-green-500 text-green-400"
                                    : "bg-slate-900 border-white/5 text-slate-400 font-medium"
                                }`}
                              >
                                {n}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-black text-green-400 bg-green-500/[0.01] text-sm">
                        {row.hits} <span className="text-slate-500 font-bold text-xs">din {row.total}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded font-extrabold text-[10px] uppercase tracking-wide border ${
                          row.hits >= 3
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : row.hits >= 1
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : "bg-slate-900 text-slate-500 border-white/5"
                        }`}>
                          {((row.hits / row.total) * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl bg-slate-950/20 border border-white/10 border-dashed" id="no-backtest">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Backtest Netestat</h5>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-normal">
            Apăsați butonul „Rulează Backtest” de mai sus pentru a simula eficiența modelului predictiv RandomForest pe date istorice.
          </p>
          <button
            onClick={handleStartBacktest}
            className="py-2.5 px-5 bg-yellow-400 hover:bg-yellow-350 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-400/10 border-none"
          >
            Rulează Acum
          </button>
        </div>
      )}
    </div>
  );
}
