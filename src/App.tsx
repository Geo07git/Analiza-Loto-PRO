/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { LotoType, Draw } from "./types";
import { LOTO_CONFIGS, getMLPredictions, parseCSVData, getJokerPredictions } from "./utils/calculations";
import { generateDefaultDraws } from "./data/lotoData";
import LotoHeader from "./components/LotoHeader";
import FileUpload from "./components/FileUpload";

// Tab Components
import PredictieML from "./components/Tabs/PredictieML";
import Combinatii from "./components/Tabs/Combinatii";
import Statistici from "./components/Tabs/Statistici";
import Backtest from "./components/Tabs/Backtest";
import Export from "./components/Tabs/Export";

// Icons
import {
  BrainCircuit,
  Hash,
  Grid,
  Activity,
  FileSpreadsheet,
  Coins,
  Cpu
} from "lucide-react";

type TabId = "ml" | "combos" | "stats" | "backtest" | "export";

export default function App() {
  const [selectedLoto, setSelectedLoto] = useState<LotoType>("Romania 6/49");
  const [loadedData, setLoadedData] = useState<Draw[] | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("ml");
  const [topNums, setTopNums] = useState<number[]>([]);

  // Implicitly load the corresponding static CSV file on selection or mount
  useEffect(() => {
    let csvPath = "";
    if (selectedLoto === "Romania 6/49") {
      csvPath = "/lot649.csv";
    } else if (selectedLoto === "Romania - Joker") {
      csvPath = "/LotoJoker.csv";
    } else if (selectedLoto === "Romania 5/40") {
      csvPath = "/Loto540.csv";
    }

    if (csvPath) {
      fetch(csvPath)
        .then((res) => {
          if (!res.ok) throw new Error(`Could not load ${csvPath}`);
          return res.text();
        })
        .then((text) => {
          const parsed = parseCSVData(text, selectedLoto);
          if (parsed && parsed.length > 0) {
            setLoadedData(parsed);
            setActiveFileName(csvPath.replace("/", ""));
          }
        })
        .catch((err) => {
          console.warn("Implicit CSV load failed, falling back to generated defaults:", err);
          setLoadedData(null);
          setActiveFileName(null);
        });
    }
  }, [selectedLoto]);

  // 1. Get the drawing history (uploaded or generated default)
  const activeDraws = useMemo(() => {
    if (loadedData) {
      return loadedData;
    }
    return generateDefaultDraws(selectedLoto);
  }, [loadedData, selectedLoto]);

  // 2. Load lottery properties (nums, maxNum)
  const config = useMemo(() => {
    return LOTO_CONFIGS[selectedLoto];
  }, [selectedLoto]);

  // 3. Last drawing details
  const lastDraw = useMemo(() => {
    if (activeDraws.length === 0) return null;
    return activeDraws[activeDraws.length - 1];
  }, [activeDraws]);

  // 4. Calculate ML predictions
  const predictions = useMemo(() => {
    return getMLPredictions(activeDraws, config.maxNum);
  }, [activeDraws, config]);

  const jokerPredictions = useMemo(() => {
    return getJokerPredictions(activeDraws);
  }, [activeDraws]);

  // Tab definitions
  const tabs = [
    { id: "ml", label: "🤖 Predicție AI", icon: BrainCircuit, component: () => <PredictieML predictions={predictions} jokerPredictions={jokerPredictions} onTopNumsChange={setTopNums} /> },
    { id: "combos", label: "🔢 Combinații", icon: Hash, component: () => <Combinatii draws={activeDraws} maxNum={config.maxNum} numsReq={config.nums} /> },
    { id: "stats", label: "📊 Statistici", icon: Grid, component: () => <Statistici draws={activeDraws} maxNum={config.maxNum} /> },
    { id: "backtest", label: "🔁 Backtest", icon: Activity, component: () => <Backtest draws={activeDraws} maxNum={config.maxNum} /> },
    { id: "export", label: "📤 Export", icon: FileSpreadsheet, component: () => <Export draws={activeDraws} maxNum={config.maxNum} numsReq={config.nums} predictions={predictions} topNums={topNums} selectedLoto={selectedLoto} /> }
  ] as const;

  const handleDataLoaded = (draws: Draw[], fileName: string) => {
    setLoadedData(draws);
    setActiveFileName(fileName);
  };

  const handleClearLoadedData = () => {
    setLoadedData(null);
    setActiveFileName(null);
  };

  const handleLotoChange = (loto: LotoType) => {
    setSelectedLoto(loto);
    // If we had custom loaded data, we clear it or keep it depending on whether the user wants to re-upload.
    // To match streamlit, changing the selector should recalculate on default data if the loaded data was for a different game.
    setLoadedData(null);
    setActiveFileName(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E2E8F0] flex flex-col font-sans" id="app-root-container">
      {/* Top Professional Navigation Bar with glass style */}
      <header className="border-b border-white/10 bg-[#0A0B0E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <Coins className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-black tracking-tighter text-slate-100 text-sm block uppercase">ANALIZĂ LOTO</span>
              <span className="text-[9px] font-mono text-yellow-400 font-extrabold uppercase tracking-widest block -mt-1">PRO PREDICTOR</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>Sistem de calcul: local (Browser TS-RF)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span className="text-[11px] font-mono font-extrabold text-yellow-400">AI ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Block */}
        <LotoHeader
          selectedLoto={selectedLoto}
          onLotoChange={handleLotoChange}
          lastDraw={lastDraw}
        />

        {/* Database Upload section */}
        <FileUpload
          onDataLoaded={handleDataLoaded}
          onClearLoadedData={handleClearLoadedData}
          activeFileName={activeFileName}
          defaultDrawsCount={generateDefaultDraws(selectedLoto).length}
          selectedLoto={selectedLoto}
        />

        {/* Dynamic Tabs Navigation Bar - Styled according to Bold Typography theme */}
        <div className="p-1.5 glass-panel rounded-2xl" id="tabs-navigation-panel">
          <nav className="flex flex-wrap md:flex-nowrap gap-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-grow flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-yellow-400 underline underline-offset-8 decoration-2"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 opacity-60 hover:opacity-100"
                  }`}
                  id={`tab-${tab.id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label.replace(/^[^\s]+\s+/, '')}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Tab Panel View */}
        <div className="py-2" id="active-tab-panel">
          {tabs.find((tab) => tab.id === activeTab)?.component()}
        </div>
      </main>

      {/* Clean Aesthetic Footer */}
      <footer className="border-t border-white/10 bg-[#0A0B0E] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>© 2026</span>
            <span className="font-extrabold text-slate-200 uppercase tracking-wider">Analiză Loto Extinsă Pro</span>
            <span className="opacity-50">| Toate drepturile rezervate.</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Sistem: ML Hybrid Engine</span>
            <span className="text-yellow-400">•</span>
            <span>Versiune: 2.5.0-TS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
