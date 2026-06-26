/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Draw, PredictionResult } from "../../types";
import {
  calculateNumberStats,
  analyzeDraws,
  getGeneralStats,
  getCombinations
} from "../../utils/calculations";
import * as XLSX from "xlsx";
import { FileDown, CheckCircle, Info, FileSpreadsheet } from "lucide-react";

interface ExportProps {
  draws: Draw[];
  maxNum: number;
  numsReq: number;
  predictions: PredictionResult[];
  topNums: number[];
  selectedLoto: string;
}

export default function Export({
  draws,
  maxNum,
  numsReq,
  predictions,
  topNums,
  selectedLoto
}: ExportProps) {
  const [exporting, setExporting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleExportExcel = () => {
    setExporting(true);
    setSuccess(false);

    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet "Top Recomandări"
      const recommendationsData = topNums.map((num, i) => ({
        Rank: i + 1,
        "Număr Recomandat": num,
        Loterie: selectedLoto
      }));
      const wsRec = XLSX.utils.json_to_sheet(recommendationsData);
      XLSX.utils.book_append_sheet(wb, wsRec, "Top Recomandări");

      // 2. Sheet "Predicție ML"
      const predictionData = predictions.map((p, i) => ({
        Rang: i + 1,
        "Număr": p.num,
        "Probabilitate ML": p.mlProb,
        "Frecvență Istorică": p.frequency,
        "Scor Hibrid": p.hybridScore,
        Paritate: p.parity,
        "Grupă Interval": p.group
      }));
      const wsPred = XLSX.utils.json_to_sheet(predictionData);
      XLSX.utils.book_append_sheet(wb, wsPred, "Predicție ML");

      // 3. Sheet "Top Combinații" (using size 3 and min frequency 2 as base for export)
      const comboStats = getCombinations(draws, maxNum, 3, 2);
      const comboData = comboStats.comboList.map((c, i) => ({
        Rang: i + 1,
        "Combinație": c.combo,
        "Frecvență Apariție": c.frequency,
        "Scor Global Cumulat": c.totalScore
      }));
      const wsCombo = XLSX.utils.json_to_sheet(comboData);
      XLSX.utils.book_append_sheet(wb, wsCombo, "Top Combinații");

      // 4. Sheet "Analiză Extrageri"
      const drawsAnalysis = analyzeDraws(draws, maxNum);
      const drawData = drawsAnalysis.map((row) => {
        const flatRow: Record<string, any> = {
          "ID Extragere": row.drawId,
          "Numere Extrase": row.numbers.join(", "),
          Pare: row.pare,
          Impare: row.impare,
          Mici: row.mici,
          Mari: row.mari
        };
        // Add groups counts dynamically
        for (const [grp, val] of Object.entries(row.groups)) {
          flatRow[`Grupă ${grp}`] = val;
        }
        return flatRow;
      });
      const wsDraw = XLSX.utils.json_to_sheet(drawData);
      XLSX.utils.book_append_sheet(wb, wsDraw, "Analiză Extrageri");

      // 5. Sheet "Tendințe Generale"
      const general = getGeneralStats(draws, maxNum);
      const trendsData = [
        {
          "Total Extrageri": general.totalDraws,
          "Total Pare": general.totalPare,
          "Total Impare": general.totalImpare,
          "Total Mici": general.totalMici,
          "Total Mari": general.totalMari,
          "Grupă Dominantă": general.dominantGroup
        }
      ];
      const wsTrends = XLSX.utils.json_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(wb, wsTrends, "Tendințe Generale");

      // 6. Sheet "Numere Individuale"
      const numberStats = calculateNumberStats(draws, maxNum);
      const numStatsData = numberStats.map((s) => ({
        "Număr": s.num,
        "Apariții Totale": s.appearances,
        "Gap Curent (Restante)": s.gap,
        Paritate: s.parity,
        Mărime: s.size,
        Grupă: s.group
      }));
      const wsNumStats = XLSX.utils.json_to_sheet(numStatsData);
      XLSX.utils.book_append_sheet(wb, wsNumStats, "Numere Individuale");

      // Set column widths auto-fit
      const sheetsList = [
        { ws: wsRec, data: recommendationsData },
        { ws: wsPred, data: predictionData },
        { ws: wsCombo, data: comboData },
        { ws: wsDraw, data: drawData },
        { ws: wsTrends, data: trendsData },
        { ws: wsNumStats, data: numStatsData }
      ];

      for (const item of sheetsList) {
        if (!item.data || item.data.length === 0) continue;
        const keys = Object.keys(item.data[0]);
        item.ws["!cols"] = keys.map((key) => {
          let maxLen = key.length;
          for (let r = 0; r < item.data.length; r++) {
            const val = (item.data[r] as any)[key];
            if (val !== undefined && val !== null) {
              maxLen = Math.max(maxLen, val.toString().length);
            }
          }
          return { wch: Math.min(maxLen + 3, 35) };
        });
      }

      // Download file
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const cleanLabel = selectedLoto.replace(/\s+/g, "_").toLowerCase();
      XLSX.writeFile(wb, `Analiza_loto_extinsa_pro_${cleanLabel}_${timestamp}.xlsx`);

      setSuccess(true);
    } catch (err) {
      console.error("Export Error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="export-tab-container">
      <div className="glass-panel rounded-2xl p-6 shadow-xl" id="export-card">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            Exportă Rezultatele Complete în Excel
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Descarcă un registru de calcul complet structurat în format **Microsoft Excel (.xlsx)**. Acest document integrează toate matricile statistice și predictive calculate pe baza bazei de date active. Ideal pentru stocare locală sau analiză secundară în alte programe.
        </p>

        {/* List of tabs description */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-white/10 space-y-4 mb-8" id="export-sheets-list">
          <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            Documentul Excel va conține următoarele 6 sheet-uri:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">1</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Top Recomandări</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Cele mai sigure numere recomandate bazate pe topul Scorului Hibrid.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">2</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Predicție ML</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Tabelul complet al probabilităților ML, frecvențelor și scorului hibrid.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">3</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Top Combinații</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Cele mai frecvente perechi și triplete identificate istoric.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">4</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Analiză Extrageri</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Fiecare tragere analizată după paritate, mărime și interval.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">5</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Tendințe Generale</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Sinteza globală a distribuției sferelor pe parcursul întregului istoric.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex items-center justify-center font-mono font-black text-[11px] shrink-0 mt-0.5">6</span>
              <div>
                <span className="font-extrabold text-slate-100 block uppercase tracking-wide text-[11px]">Numere Individuale</span>
                <span className="text-slate-500 text-[11px] leading-normal block mt-0.5">Statistici amănunțite pentru fiecare număr în parte (Apariții, Gap).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-yellow-400/10 border-none ${
            exporting
              ? "bg-slate-800 text-slate-400"
              : "bg-yellow-400 hover:bg-yellow-350 text-black hover:shadow-yellow-400/20"
          }`}
          id="export-action-btn"
        >
          <FileDown className={`w-5 h-5 ${exporting ? "animate-bounce text-black" : "text-black"}`} />
          {exporting ? "Se compilează fișierul Excel..." : "Descarcă Excel Complet"}
        </button>

        {success && (
          <div className="mt-5 p-4 bg-green-500/10 border border-green-500/25 rounded-xl flex items-center gap-3 text-green-400 text-xs animate-slide-up" id="export-success-alert">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block text-slate-100 uppercase tracking-wider text-[10px] mb-1">Export Finalizat cu Succes!</span>
              Fișierul a fost generat și descărcat în folderul dvs. de descărcări.
            </div>
          </div>
        )}
      </div>

      {/* Interactive Guidance */}
      <div className="glass-panel border border-white/5 rounded-2xl p-4 flex gap-3 text-xs text-slate-400 leading-normal">
        <Info className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">Sfat de Utilizare</span> Formatul fișierului exportat este complet compatibil cu **Microsoft Excel 2007+**, **Google Sheets** și **LibreOffice Calc**. Coloanele sunt pre-ajustate automat pentru o lizibilitate impecabilă a numerelor.
        </div>
      </div>
    </div>
  );
}
