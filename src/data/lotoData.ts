/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LotoType, Draw } from "../types";

// Seeded random number generator for consistent default datasets
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Generates an array of Draw objects deterministically for the selected lottery type.
 */
export function generateDefaultDraws(type: LotoType): Draw[] {
  const draws: Draw[] = [];
  
  let nums = 6;
  let maxNum = 49;
  let seed = 12345;

  if (type === "Romania 6/49") {
    nums = 6;
    maxNum = 49;
    seed = 6492026;
  } else if (type === "Romania - Joker") {
    nums = 5;
    maxNum = 45;
    seed = 5452026;
  } else if (type === "Romania 5/40") {
    nums = 5;
    maxNum = 40;
    seed = 5402026;
  }

  const rand = createSeededRandom(seed);

  // Generate starting from Jan 4, 2024 (Thursday)
  // Romania Loto drawings happen on Thursdays (4) and Sundays (7)
  let currentDate = new Date(2024, 0, 4); // Jan 4, 2024
  
  // We generate around 180 draws, taking us up to mid-2025/2026
  for (let i = 1; i <= 180; i++) {
    const numbersSet = new Set<number>();
    
    // Generate valid distinct numbers
    while (numbersSet.size < nums) {
      const val = Math.floor(rand() * maxNum) + 1;
      numbersSet.add(val);
    }
    
    const sortedNumbers = Array.from(numbersSet).sort((a, b) => a - b);
    
    // Generate deterministic Joker ball (1 to 20) for Romania - Joker
    let jokerVal: number | undefined;
    if (type === "Romania - Joker") {
      jokerVal = Math.floor(rand() * 20) + 1;
    }
    
    // Format Romanian Date
    const day = currentDate.getDate();
    const months = [
      "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
      "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
    ];
    const monthStr = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const dateLabel = `Extragerea #${i} (${day} ${monthStr} ${year})`;
    
    draws.push({
      id: dateLabel,
      numbers: sortedNumbers,
      ...(jokerVal !== undefined ? { joker: jokerVal } : {})
    });

    // Advance to next draw day (Thursday -> Sunday is 3 days, Sunday -> Thursday is 4 days)
    const currentDayOfWeek = currentDate.getDay(); // 4 = Thursday, 0 = Sunday
    if (currentDayOfWeek === 4) {
      currentDate.setDate(currentDate.getDate() + 3); // Advance 3 days to Sunday
    } else {
      currentDate.setDate(currentDate.getDate() + 4); // Advance 4 days to Thursday
    }
  }

  return draws;
}
