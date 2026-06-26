/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LotoType = "Romania 6/49" | "Romania - Joker" | "Romania 5/40";

export interface LotoConfig {
  name: LotoType;
  nums: number;
  maxNum: number;
}

export interface Draw {
  id: string | number; // Date or ID
  numbers: number[];
  joker?: number; // Optional Joker bonus ball (1 to 20)
}

export interface NumberStat {
  num: number;
  appearances: number;
  gap: number;
  parity: "Par" | "Impar";
  size: "Mic" | "Mare";
  group: string;
}

export interface PredictionResult {
  num: number;
  mlProb: number;
  frequency: number;
  hybridScore: number;
  parity: "Par" | "Impar";
  group: string;
}

export interface ComboResult {
  combo: string; // e.g. "1, 2, 3"
  frequency: number;
  totalScore: number;
}

export interface DrawAnalysisRow {
  index: number;
  drawId: string | number;
  numbers: number[];
  pare: number;
  impare: number;
  mici: number;
  mari: number;
  groups: Record<string, number>;
}

export interface GeneralStats {
  totalDraws: number;
  totalPare: number;
  totalImpare: number;
  totalMici: number;
  totalMari: number;
  dominantGroup: string;
}

export interface BacktestRow {
  drawIndex: number;
  drawId: string | number;
  predicted: number[];
  actual: number[];
  hits: number;
  total: number;
}
