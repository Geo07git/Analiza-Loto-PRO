/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LotoType,
  LotoConfig,
  Draw,
  NumberStat,
  PredictionResult,
  ComboResult,
  DrawAnalysisRow,
  GeneralStats,
  BacktestRow
} from "../types";
import { trainAndPredict } from "../ml";

export const LOTO_CONFIGS: Record<LotoType, LotoConfig> = {
  "Romania 6/49": { name: "Romania 6/49", nums: 6, maxNum: 49 },
  "Romania - Joker": { name: "Romania - Joker", nums: 5, maxNum: 45 },
  "Romania 5/40": { name: "Romania 5/40", nums: 5, maxNum: 40 }
};

/**
 * Romanian group label helper matching Streamlit's get_group_label
 */
export function getGroupLabel(n: number, step = 10): string {
  const lower = Math.floor((n - 1) / step) * step + 1;
  return `${lower}-${lower + step - 1}`;
}

/**
 * Calculates global frequency counters for each number.
 */
export function calculateFrequencies(draws: Draw[], maxNum: number): Record<number, number> {
  const frequencies: Record<number, number> = {};
  for (let n = 1; n <= maxNum; n++) {
    frequencies[n] = 0;
  }
  for (const draw of draws) {
    for (const num of draw.numbers) {
      if (num >= 1 && num <= maxNum) {
        frequencies[num] = (frequencies[num] || 0) + 1;
      }
    }
  }
  return frequencies;
}

/**
 * Computes individual number stats, including current Gap (number of draws since last seen).
 */
export function calculateNumberStats(draws: Draw[], maxNum: number): NumberStat[] {
  const frequencies = calculateFrequencies(draws, maxNum);
  const stats: NumberStat[] = [];

  for (let n = 1; n <= maxNum; n++) {
    // Calculate gap
    let gap = draws.length;
    for (let i = draws.length - 1; i >= 0; i--) {
      if (draws[i].numbers.includes(n)) {
        gap = draws.length - 1 - i;
        break;
      }
    }

    stats.push({
      num: n,
      appearances: frequencies[n] || 0,
      gap,
      parity: n % 2 === 0 ? "Par" : "Impar",
      size: n <= maxNum / 2 ? "Mic" : "Mare",
      group: getGroupLabel(n)
    });
  }

  return stats;
}

/**
 * Performs ML hybrid predictions matching the Streamlit's RF + Frequency logic
 */
export function getMLPredictions(draws: Draw[], maxNum: number): PredictionResult[] {
  const frequencies = calculateFrequencies(draws, maxNum);

  // 1. Calculate current gap and average gap for each number to find overdue ratio
  const currentGaps: Record<number, number> = {};
  const avgGaps: Record<number, number> = {};
  const overdueRatios: Record<number, number> = {};

  for (let n = 1; n <= maxNum; n++) {
    const hitIndices: number[] = [];
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(n)) {
        hitIndices.push(i);
      }
    }

    // Current gap (draws elapsed since the last hit)
    const currentGap = hitIndices.length > 0 
      ? (draws.length - 1 - hitIndices[hitIndices.length - 1]) 
      : draws.length;
    currentGaps[n] = currentGap;

    // Average gap between consecutive hits
    let avgGap = 0;
    if (hitIndices.length > 1) {
      let sumGap = 0;
      for (let j = 1; j < hitIndices.length; j++) {
        sumGap += (hitIndices[j] - hitIndices[j - 1] - 1);
      }
      avgGap = sumGap / (hitIndices.length - 1);
    } else {
      // Theoretical average gap based on probability if we have <= 1 hit
      // E.g. Romania 6/49: (49 - 6) / 6 = 7.16 draws
      const numsPerDraw = draws[0]?.numbers.length || 6;
      avgGap = (maxNum - numsPerDraw) / numsPerDraw;
    }
    avgGaps[n] = Math.max(avgGap, 1);
    overdueRatios[n] = currentGap / avgGaps[n];
  }

  const maxOverdueRatio = Math.max(...Object.values(overdueRatios), 1);

  // 2. Calculate recent frequency score (past 30 draws)
  const recentDraws = draws.slice(-30);
  const recentFreqs: Record<number, number> = {};
  for (let n = 1; n <= maxNum; n++) {
    recentFreqs[n] = 0;
  }
  for (const draw of recentDraws) {
    for (const num of draw.numbers) {
      if (num >= 1 && num <= maxNum) {
        recentFreqs[num] = (recentFreqs[num] || 0) + 1;
      }
    }
  }
  const maxRecentFreq = Math.max(...Object.values(recentFreqs), 1);

  // 3. Train ML model and get raw probabilities
  const mlProbs = trainAndPredict(draws.map(d => d.numbers), maxNum);
  const results: PredictionResult[] = [];

  for (let n = 1; n <= maxNum; n++) {
    const mlProb = mlProbs.find(p => p.num === n)?.prob ?? 0;
    const freq = frequencies[n] || 0;
    
    // Normalized overdueRatio score
    const gapScore = overdueRatios[n] / maxOverdueRatio;

    const recentFreq = recentFreqs[n] || 0;
    const recentFreqScore = recentFreq / maxRecentFreq;

    // Advanced score model proposed by user:
    // score = 0.45 * mlProb + 0.35 * gapScore + 0.20 * recentFreqScore
    const hybridScore = 0.45 * mlProb + 0.35 * gapScore + 0.20 * recentFreqScore;

    results.push({
      num: n,
      mlProb,
      frequency: freq,
      hybridScore,
      parity: n % 2 === 0 ? "Par" : "Impar",
      group: getGroupLabel(n)
    });
  }

  // Sort by Hybrid Score descending
  return results.sort((a, b) => b.hybridScore - a.hybridScore);
}

/**
 * Trains ML and calculates hybrid statistics specifically for the Joker bonus ball (1 to 20).
 */
export function getJokerPredictions(draws: Draw[]): PredictionResult[] {
  const jokerDraws = draws.filter(d => d.joker !== undefined);
  if (jokerDraws.length === 0) return [];

  const maxJoker = 20;
  const frequencies: Record<number, number> = {};
  for (let n = 1; n <= maxJoker; n++) {
    frequencies[n] = 0;
  }
  for (const draw of jokerDraws) {
    if (draw.joker !== undefined) {
      frequencies[draw.joker] = (frequencies[draw.joker] || 0) + 1;
    }
  }

  // Current gaps and average gaps for Joker
  const currentGaps: Record<number, number> = {};
  const avgGaps: Record<number, number> = {};
  const overdueRatios: Record<number, number> = {};

  for (let n = 1; n <= maxJoker; n++) {
    const hitIndices: number[] = [];
    for (let i = 0; i < jokerDraws.length; i++) {
      if (jokerDraws[i].joker === n) {
        hitIndices.push(i);
      }
    }

    const currentGap = hitIndices.length > 0
      ? (jokerDraws.length - 1 - hitIndices[hitIndices.length - 1])
      : jokerDraws.length;
    currentGaps[n] = currentGap;

    let avgGap = 0;
    if (hitIndices.length > 1) {
      let sumGap = 0;
      for (let j = 1; j < hitIndices.length; j++) {
        sumGap += (hitIndices[j] - hitIndices[j - 1] - 1);
      }
      avgGap = sumGap / (hitIndices.length - 1);
    } else {
      avgGap = 19; // 20 - 1
    }
    avgGaps[n] = Math.max(avgGap, 1);
    overdueRatios[n] = currentGap / avgGaps[n];
  }

  const maxOverdueRatio = Math.max(...Object.values(overdueRatios), 1);

  // Train ML for Joker (as a single sequence of 1-element draws)
  const trainingDraws = jokerDraws.map(d => [d.joker!]);
  const mlProbs = trainAndPredict(trainingDraws, maxJoker);

  // Recent frequency score (past 30 draws) for Joker
  const recentJokerDraws = jokerDraws.slice(-30);
  const recentFreqs: Record<number, number> = {};
  for (let n = 1; n <= maxJoker; n++) {
    recentFreqs[n] = 0;
  }
  for (const draw of recentJokerDraws) {
    if (draw.joker !== undefined) {
      recentFreqs[draw.joker] = (recentFreqs[draw.joker] || 0) + 1;
    }
  }
  const maxRecentFreqVal = Math.max(...Object.values(recentFreqs), 1);

  const results: PredictionResult[] = [];
  for (let n = 1; n <= maxJoker; n++) {
    const mlProb = mlProbs.find(p => p.num === n)?.prob ?? 0;
    const freq = frequencies[n] || 0;
    const gapScore = overdueRatios[n] / maxOverdueRatio;
    const recentFreqScore = (recentFreqs[n] || 0) / maxRecentFreqVal;

    // Standard scoring model for Joker:
    // score = 0.45 * mlProb + 0.35 * gapScore + 0.20 * recentFreqScore
    const hybridScore = 0.45 * mlProb + 0.35 * gapScore + 0.20 * recentFreqScore;

    results.push({
      num: n,
      mlProb,
      frequency: freq,
      hybridScore,
      parity: n % 2 === 0 ? "Par" : "Impar",
      group: getGroupLabel(n, 5) // Joker groups of 5: 1-5, 6-10, etc.
    });
  }

  return results.sort((a, b) => b.hybridScore - a.hybridScore);
}

/**
 * Analyzes each draw for Evens/Odds, Small/High, and Group distributions
 */
export function analyzeDraws(draws: Draw[], maxNum: number): DrawAnalysisRow[] {
  return draws.map((draw, idx) => {
    let pare = 0;
    let impare = 0;
    let mici = 0;
    let mari = 0;
    const groups: Record<string, number> = {};

    for (const n of draw.numbers) {
      if (n % 2 === 0) pare++;
      else impare++;

      if (n <= maxNum / 2) mici++;
      else mari++;

      const grp = getGroupLabel(n);
      groups[grp] = (groups[grp] || 0) + 1;
    }

    return {
      index: idx + 1,
      drawId: draw.id,
      numbers: draw.numbers,
      pare,
      impare,
      mici,
      mari,
      groups
    };
  });
}

/**
 * Computes general stats across all draws
 */
export function getGeneralStats(draws: Draw[], maxNum: number): GeneralStats {
  const analysis = analyzeDraws(draws, maxNum);
  let totalPare = 0;
  let totalImpare = 0;
  let totalMici = 0;
  let totalMari = 0;
  const groupCounter: Record<string, number> = {};

  for (const row of analysis) {
    totalPare += row.pare;
    totalImpare += row.impare;
    totalMici += row.mici;
    totalMari += row.mari;

    for (const [grp, count] of Object.entries(row.groups)) {
      groupCounter[grp] = (groupCounter[grp] || 0) + count;
    }
  }

  let dominantGroup = "N/A";
  let maxGrpCount = -1;
  for (const [grp, count] of Object.entries(groupCounter)) {
    if (count > maxGrpCount) {
      maxGrpCount = count;
      dominantGroup = grp;
    }
  }

  return {
    totalDraws: draws.length,
    totalPare,
    totalImpare,
    totalMici,
    totalMari,
    dominantGroup
  };
}

/**
 * Highly optimized combination generator
 */
export function getCombinations(
  draws: Draw[],
  maxNum: number,
  comboSize: number,
  minFreq: number
): { comboList: ComboResult[]; bestCombo: ComboResult | null; worstCombo: ComboResult | null } {
  const frequencies = calculateFrequencies(draws, maxNum);
  const comboCounter: Record<string, number> = {};

  // Calculate hybrid predictions for individual numbers to score combinations
  const predictions = getMLPredictions(draws, maxNum);
  const scoresByNum: Record<number, number> = {};
  for (const pred of predictions) {
    scoresByNum[pred.num] = pred.hybridScore;
  }

  // Generate combinations of size K for each draw's numbers
  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    if (nums.length < comboSize) continue;

    // Standard recursive combination helper
    const combine = (start: number, activeCombo: number[]) => {
      if (activeCombo.length === comboSize) {
        const key = activeCombo.join(", ");
        comboCounter[key] = (comboCounter[key] || 0) + 1;
        return;
      }
      for (let i = start; i < nums.length; i++) {
        activeCombo.push(nums[i]);
        combine(i + 1, activeCombo);
        activeCombo.pop();
      }
    };

    combine(0, []);
  }

  const comboList: ComboResult[] = [];
  for (const [comboStr, freq] of Object.entries(comboCounter)) {
    if (freq >= minFreq) {
      const numbers = comboStr.split(", ").map(Number);
      const totalScore = numbers.reduce((sum, n) => sum + (scoresByNum[n] || 0), 0);
      comboList.push({
        combo: comboStr,
        frequency: freq,
        totalScore
      });
    }
  }

  // Sort by frequency descending
  comboList.sort((a, b) => b.frequency - a.frequency);

  // Find extreme combinations across ALL combinations (even those below minFreq)
  let bestCombo: ComboResult | null = null;
  let worstCombo: ComboResult | null = null;

  const allCombos = Object.entries(comboCounter).map(([comboStr, freq]) => {
    const numbers = comboStr.split(", ").map(Number);
    const totalScore = numbers.reduce((sum, n) => sum + (scoresByNum[n] || 0), 0);
    return { combo: comboStr, frequency: freq, totalScore };
  });

  if (allCombos.length > 0) {
    // Best: highest total score based on hybrid predictions
    allCombos.sort((a, b) => b.totalScore - a.totalScore);
    bestCombo = allCombos[0];

    // Worst: lowest total score based on hybrid predictions
    allCombos.sort((a, b) => a.totalScore - b.totalScore);
    worstCombo = allCombos[0];
  }

  return {
    comboList: comboList.slice(0, 15), // keep top 15 as in Python
    bestCombo,
    worstCombo
  };
}

/**
 * Historical Backtesting Simulator
 */
export function runBacktest(
  draws: Draw[],
  maxNum: number,
  nTest: number,
  topK: number,
  onProgress?: (progress: number) => void
): { backtestRows: BacktestRow[]; avgHits: number; randomExpected: number } {
  const backtestRows: BacktestRow[] = [];
  const totalSteps = nTest;

  // We test on the last `nTest` draws.
  // For each test draw, we train the model on all draws up to its index, then predict and check hits.
  const startIndex = draws.length - nTest;

  for (let step = 0; step < nTest; step++) {
    const currentTestIdx = startIndex + step;
    if (currentTestIdx < 10) continue; // need at least some training data

    // Training set: everything up to currentTestIdx
    const trainingDraws = draws.slice(0, currentTestIdx);
    const actualNumbers = draws[currentTestIdx].numbers;

    // Train ML and get hybrid predictions
    const predictions = getMLPredictions(trainingDraws, maxNum);
    // Get top K predicted numbers based on hybridScore
    const predictedNumbers = predictions
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, topK)
      .map(p => p.num)
      .sort((a, b) => a - b);

    // Count hits
    const actualSet = new Set(actualNumbers);
    const hitsList = predictedNumbers.filter(n => actualSet.has(n));
    const hits = hitsList.length;

    backtestRows.push({
      drawIndex: currentTestIdx + 1,
      drawId: draws[currentTestIdx].id,
      predicted: predictedNumbers,
      actual: actualNumbers,
      hits,
      total: topK
    });

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((step + 1) / totalSteps) * 100)));
    }
  }

  const avgHits = backtestRows.length > 0
    ? backtestRows.reduce((sum, r) => sum + r.hits, 0) / backtestRows.length
    : 0;

  // expected random hits: top_k * (numbers_drawn / max_numbers)
  // Romania 6/49 has 6 drawn. Romania Joker has 5. Romania 5/40 has 5.
  const numbersDrawnCount = draws[0]?.numbers.length || 6;
  const randomExpected = topK * (numbersDrawnCount / maxNum);

  return {
    backtestRows,
    avgHits,
    randomExpected
  };
}

/**
 * Helper to parse uploaded CSV text content
 */
export function parseCSVData(text: string, lotoType?: LotoType): Draw[] {
  const lines = text.split(/\r?\n/);
  const parsedDraws: Draw[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Support commas, semicolons, and tabs as separators
    const parts = line.split(/[;,\t]/);
    if (parts.length < 2) continue;

    // Clean strings helper (removes surrounding quotes/whitespace)
    const cleanStr = (s: string) => s.trim().replace(/^["']|["']$/g, "").trim();

    const drawId = cleanStr(parts[0]);
    // Skip if this is a header line (e.g. starts with "Date", "Data", "Round", "Nr.", etc.)
    const lowerDrawId = drawId.toLowerCase();
    if (
      lowerDrawId === "date" ||
      lowerDrawId === "data" ||
      lowerDrawId === "id" ||
      lowerDrawId === "draw" ||
      lowerDrawId === "drawid" ||
      lowerDrawId === "numar" ||
      lowerDrawId === "număr" ||
      lowerDrawId === "round" ||
      lowerDrawId === "rând" ||
      lowerDrawId === "rand" ||
      lowerDrawId === "nr" ||
      lowerDrawId.startsWith("nr.") ||
      lowerDrawId.startsWith("num")
    ) {
      continue;
    }

    const numbers: number[] = [];
    for (let j = 1; j < parts.length; j++) {
      const cleanedPart = cleanStr(parts[j]);
      if (cleanedPart === "") continue;

      const val = parseInt(cleanedPart, 10);
      if (!isNaN(val)) {
        numbers.push(val);
      }
    }

    if (numbers.length >= 3) {
      let mainNumbers = [...numbers];
      let jokerVal: number | undefined;

      // In Romania - Joker, if we have 6 numbers, the last one is the Joker bonus ball (1 to 20)
      if (lotoType === "Romania - Joker" && numbers.length >= 6) {
        mainNumbers = numbers.slice(0, 5);
        jokerVal = numbers[5];
      } else if (lotoType === "Romania - Joker" && numbers.length === 5) {
        // If we only have 5, let's assign a deterministic joker just to keep it valid
        jokerVal = ((numbers[0] + numbers[4]) % 20) + 1;
      }

      parsedDraws.push({
         id: drawId,
         numbers: mainNumbers.sort((a, b) => a - b),
         ...(jokerVal !== undefined ? { joker: jokerVal } : {})
      });
    }
  }

  return parsedDraws;
}
