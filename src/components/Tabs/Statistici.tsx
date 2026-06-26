/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Draw, NumberStat } from "../../types";
import {
  calculateNumberStats,
  analyzeDraws,
  getGeneralStats
} from "../../utils/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { BarChart3, PieChartIcon, TrendingUp, Grid, Info, ListOrdered } from "lucide-react";

interface StatisticiProps {
  draws: Draw[];
  maxNum: number;
}

export default function Statistici({ draws, maxNum }: StatisticiProps) {
  const [statsSearch, setStatsSearch] = useState<string>("");
  const [statSort, setStatSort] = useState<"num" | "appearances" | "gap">("num");

  // Core calculations
  const numberStats = useMemo(() => {
    return calculateNumberStats(draws, maxNum);
  }, [draws, maxNum]);

  const drawAnalysis = useMemo(() => {
    return analyzeDraws(draws, maxNum);
  }, [draws, maxNum]);

  const generalStats = useMemo(() => {
    return getGeneralStats(draws, maxNum);
  }, [draws, maxNum]);

  // Sorting and filtering number stats
  const filteredNumberStats = useMemo(() => {
    let list = [...numberStats];
    
    // Search filter
    if (statsSearch.trim()) {
      list = list.filter(
        (s) =>
          s.num.toString() === statsSearch.trim() ||
          s.group.includes(statsSearch) ||
          s.parity.toLowerCase().includes(statsSearch.toLowerCase())
      );
    }

    // Sort
    list.sort((a, b) => {
      if (statSort === "num") return a.num - b.num;
      if (statSort === "appearances") return b.appearances - a.appearances; // descending appearances
      if (statSort === "gap") return b.gap - a.gap; // descending gap (most remaining)
      return 0;
    });

    return list;
  }, [numberStats, statsSearch, statSort]);

  // Chart data: Distribution - Conformed to Yellow / White / High Contrast aesthetic
  const distributionData = useMemo(() => {
    return [
      { name: "Pare (Even)", value: generalStats.totalPare, fill: "#FFFF00" },
      { name: "Impare (Odds)", value: generalStats.totalImpare, fill: "#E2E8F0" },
      { name: "Mici (Low)", value: generalStats.totalMici, fill: "#38BDF8" },
      { name: "Mari (High)", value: generalStats.totalMari, fill: "#A855F7" }
    ];
  }, [generalStats]);

  // Chart data: Top 20 biggest gap (most remaining)
  const topGapsData = useMemo(() => {
    return [...numberStats]
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 20)
      .map((s) => ({
        name: `Nr. ${s.num}`,
        "Gap Curent": s.gap,
        num: s.num
      }));
  }, [numberStats]);

  // Gather unique groups represented in draws
  const allGroups = useMemo(() => {
    const groupsSet = new Set<string>();
    numberStats.forEach((s) => groupsSet.add(s.group));
    return Array.from(groupsSet).sort();
  }, [numberStats]);

  return (
    <div className="space-y-8 animate-fade-in" id="statistics-tab-container">
      {/* 1. General Trends Summary Cards with Glass Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5" id="trends-cards-grid">
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Istoric</span>
          <h4 className="text-2xl font-black text-white font-mono mt-1">{generalStats.totalDraws}</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Extrageri Analizate</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest">Raport Paritate</span>
          <h4 className="text-2xl font-black text-yellow-400 font-mono mt-1">
            {generalStats.totalPare} <span className="text-slate-500 text-sm font-medium">vs</span> {generalStats.totalImpare}
          </h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Numere Pare vs Impare</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest">Raport Mărime</span>
          <h4 className="text-2xl font-black text-yellow-400 font-mono mt-1">
            {generalStats.totalMici} <span className="text-slate-500 text-sm font-medium">vs</span> {generalStats.totalMari}
          </h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1 font-sans">Numere Mici (≤{Math.floor(maxNum/2)}) vs Mari</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden border border-yellow-400/20">
          <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest">Grupă Dominantă</span>
          <h4 className="text-2xl font-black text-yellow-400 font-mono mt-1">{generalStats.dominantGroup}</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Intervalul cel mai frecvent</p>
        </div>
      </div>

      {/* 2. Charts: Distribution Comparison with Glass Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="stats-charts">
        {/* Pie Distribution */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
              Proporție Generală Categorii
            </h3>
          </div>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0B0E",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ fontSize: "11px", color: "#FFFF00" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "1px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 20 Biggest Gap (Gaps / Restante) */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
              Top 20 Numere Restante (Gap Curent)
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGapsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0B0E",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ fontSize: "11px", color: "#FFFF00" }}
                />
                <Bar dataKey="Gap Curent" radius={[4, 4, 0, 0]}>
                  {topGapsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="#FFFF00"
                      fillOpacity={1.0 - index * 0.04}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-500 font-mono text-center mt-2 uppercase tracking-widest">
            Note: Gap-ul indică numărul de extrageri consecutive scurse de la ultima apariție.
          </p>
        </div>
      </div>

      {/* 3. General Statistics of Every Single Number */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="individual-number-stats">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
              Analiză Detaliată per Număr Individual
            </h3>
          </div>

          {/* Search and Sort controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Caută nr. sau grup..."
              value={statsSearch}
              onChange={(e) => setStatsSearch(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/50"
            />

            {/* Sort Dropdown */}
            <div className="flex bg-slate-950 border border-white/10 rounded-xl p-0.5">
              {(["num", "appearances", "gap"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setStatSort(mode)}
                  className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    statSort === mode
                      ? "bg-yellow-400 text-black shadow-sm font-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "num" ? "Index" : mode === "appearances" ? "Frecvență" : "Gap Curent"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Number Stats Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl max-h-[380px] custom-scrollbar bg-slate-950/40" id="individual-stats-scroll-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 sticky top-0 z-10">
                <th className="py-3 px-4">Număr</th>
                <th className="py-3 px-4 text-center">Apariții (Frecvență)</th>
                <th className="py-3 px-4 text-center">Gap Curent (Restant)</th>
                <th className="py-3 px-4 text-center">Paritate</th>
                <th className="py-3 px-4 text-center">Mărime</th>
                <th className="py-3 px-4">Grupă</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredNumberStats.map((s) => {
                const isHighlyDelayed = s.gap > 15;
                return (
                  <tr key={s.num} className="data-row hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-black bg-slate-900 border border-white/10 text-slate-200">
                        {s.num}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                      {s.appearances} ori
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded font-mono font-extrabold text-[10px] uppercase tracking-wide border ${
                        isHighlyDelayed
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : s.gap === 0
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-900 text-slate-400 border-white/5"
                      }`}>
                        {s.gap === 0 ? "A apărut azi" : `${s.gap} extrageri`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        s.parity === "Par" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {s.parity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        s.size === "Mic" ? "bg-yellow-400/10 text-yellow-400" : "bg-fuchsia-500/10 text-fuchsia-400"
                      }`}>
                        {s.size}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {s.group}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Draw-by-Draw Structural Analysis */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="historical-draws-stats-panel">
        <div className="flex items-center gap-2 mb-6">
          <Grid className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            Analiză Paritate, Mărime și Distribuție pe Grupe per Extragere
          </h3>
        </div>

        <div className="overflow-x-auto border border-white/10 rounded-xl max-h-[380px] custom-scrollbar bg-slate-950/40" id="historical-draws-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 sticky top-0 z-10">
                <th className="py-3 px-4">Extragere</th>
                <th className="py-3 px-4">Numere Extrase</th>
                <th className="py-3 px-4 text-center">Pare</th>
                <th className="py-3 px-4 text-center">Impare</th>
                <th className="py-3 px-4 text-center">Mici</th>
                <th className="py-3 px-4 text-center">Mari</th>
                {/* Dynamically render headers for each group interval */}
                {allGroups.map(grp => (
                  <th key={grp} className="py-3 px-4 text-center">Grup {grp}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono text-slate-300">
              {drawAnalysis.slice().reverse().map((row) => (
                <tr key={row.index} className="data-row hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 font-bold whitespace-nowrap">
                    {row.drawId}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1.5">
                      {row.numbers.map((n, idx) => (
                        <span key={`${n}-${idx}`} className="inline-block bg-slate-900 px-2 py-0.5 rounded border border-white/5 text-[11px] font-black text-yellow-400">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center text-green-400 font-bold bg-green-500/[0.01]">
                    {row.pare}
                  </td>
                  <td className="py-2.5 px-4 text-center text-purple-400 font-bold">
                    {row.impare}
                  </td>
                  <td className="py-2.5 px-4 text-center text-yellow-400 font-bold bg-yellow-400/[0.01]">
                    {row.mici}
                  </td>
                  <td className="py-2.5 px-4 text-center text-fuchsia-400 font-bold">
                    {row.mari}
                  </td>
                  {allGroups.map((grp) => {
                    const count = row.groups[grp] || 0;
                    return (
                      <td
                        key={grp}
                        className={`py-2.5 px-4 text-center font-bold ${
                          count > 0 ? "text-sky-400 bg-sky-500/[0.02]" : "text-slate-600"
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
