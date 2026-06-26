/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Draw, LotoType } from "../types";
import { parseCSVData } from "../utils/calculations";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, AlertCircle, FileCode2, Trash2 } from "lucide-react";

interface FileUploadProps {
  onDataLoaded: (draws: Draw[], fileName: string) => void;
  onClearLoadedData: () => void;
  activeFileName: string | null;
  defaultDrawsCount: number;
  selectedLoto: LotoType;
}

export default function FileUpload({
  onDataLoaded,
  onClearLoadedData,
  activeFileName,
  defaultDrawsCount,
  selectedLoto
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const fileName = file.name;
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCsv = file.name.endsWith(".csv");

    if (!isExcel && !isCsv) {
      setError("Format neacceptat. Vă rugăm încărcați un fișier .csv sau .xlsx.");
      return;
    }

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const parsedDraws: Draw[] = [];
          for (const row of jsonRows) {
            if (!row || row.length < 2) continue;
            const drawId = row[0]?.toString() || "";
            if (!drawId) continue;

            const numbers: number[] = [];
            for (let j = 1; j < row.length; j++) {
              const val = parseInt(row[j], 10);
              if (!isNaN(val)) {
                numbers.push(val);
              }
            }

            if (numbers.length >= 3) {
              let mainNumbers = [...numbers];
              let jokerVal: number | undefined;

              if (selectedLoto === "Romania - Joker" && numbers.length >= 6) {
                mainNumbers = numbers.slice(0, 5);
                jokerVal = numbers[5];
              } else if (selectedLoto === "Romania - Joker" && numbers.length === 5) {
                jokerVal = ((numbers[0] + numbers[4]) % 20) + 1;
              }

              parsedDraws.push({
                id: drawId,
                numbers: mainNumbers.sort((a, b) => a - b),
                ...(jokerVal !== undefined ? { joker: jokerVal } : {})
              });
            }
          }

          if (parsedDraws.length === 0) {
            setError("Nu s-au putut extrage numere din sheet-ul Excel. Verificați structura.");
            return;
          }

          onDataLoaded(parsedDraws, fileName);
        } catch (err) {
          console.error(err);
          setError("Eroare la procesarea fișierului Excel.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV Text Parse
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedDraws = parseCSVData(text, selectedLoto);

          if (parsedDraws.length === 0) {
            setError("Nu s-au putut extrage numere din fișierul CSV. Verificați delimitatorii.");
            return;
          }

          onDataLoaded(parsedDraws, fileName);
        } catch (err) {
          console.error(err);
          setError("Eroare la procesarea fișierului CSV.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4" id="uploader-container">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
            Baza de Date Extrageri Loto
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeFileName
              ? `Activ: ${activeFileName}`
              : `Se folosește setul de date implicit (${defaultDrawsCount} extrageri generate)`}
          </p>
        </div>
        {activeFileName && (
          <button
            onClick={onClearLoadedData}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 font-extrabold font-mono text-[10px] uppercase tracking-wider rounded-xl border border-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Revenire la setul implicit"
            id="clear-data-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Șterge Datele
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragActive
            ? "border-yellow-400 bg-yellow-400/5 scale-[1.01]"
            : activeFileName
            ? "border-green-500/30 bg-green-500/5"
            : "border-white/10 hover:border-white/20 bg-slate-950/40 hover:bg-slate-950/70"
        }`}
        id="drag-and-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
        />

        {activeFileName ? (
          <div className="space-y-2 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-100 uppercase tracking-wider">Date Încărcate cu Succes!</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeFileName}</p>
            </div>
            <p className="text-[10px] text-slate-400 bg-slate-900 border border-white/10 px-3 py-1 rounded-md inline-block">
              Faceți click sau glisați un alt fișier pentru a-l înlocui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-300">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-100 uppercase tracking-widest">
                Încarcă propria bază de date (.csv sau .xlsx)
              </p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                Format recomandat: Prima coloană cu ID/Dată extragere, urmată de numerele extrase în coloane adiacente.
              </p>
            </div>
            <button
              type="button"
              className="py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-yellow-400/10"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Alege Fișier
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center gap-2.5 text-red-400 text-xs animate-shake" id="upload-error-alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
