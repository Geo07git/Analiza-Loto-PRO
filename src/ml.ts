/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A highly optimized Decision Tree Classifier in TypeScript
 * designed for binary features (lottery number appearances).
 */
export class DecisionTreeClassifier {
  maxDepth: number;
  minSamplesSplit: number;
  root: any = null;

  constructor(maxDepth = 3, minSamplesSplit = 4) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]) {
    this.root = this.buildTree(X, y, 0);
  }

  private gini(y: number[]): number {
    const len = y.length;
    if (len === 0) return 0;
    const ones = y.reduce((sum, val) => sum + val, 0);
    const p1 = ones / len;
    const p0 = 1 - p1;
    return 1 - p0 * p0 - p1 * p1;
  }

  private buildTree(X: number[][], y: number[], depth: number): any {
    const numSamples = X.length;
    const numOnes = y.reduce((sum, v) => sum + v, 0);
    const p = numSamples > 0 ? numOnes / numSamples : 0;

    // Base cases
    if (
      depth >= this.maxDepth ||
      numSamples < this.minSamplesSplit ||
      numOnes === 0 ||
      numOnes === numSamples
    ) {
      return { isLeaf: true, prob: p };
    }

    let bestGain = -1;
    let bestFeature = -1;
    const numFeatures = X[0]?.length || 0;

    // Check a subset of features for random forest variation
    // Feature bagging: we check a random subset of sqrt(numFeatures) features
    const featuresToTry: number[] = [];
    const numSubset = Math.max(1, Math.floor(Math.sqrt(numFeatures)));
    while (featuresToTry.length < numSubset) {
      const idx = Math.floor(Math.random() * numFeatures);
      if (!featuresToTry.includes(idx)) {
        featuresToTry.push(idx);
      }
    }

    for (const f of featuresToTry) {
      const leftY: number[] = [];
      const rightY: number[] = [];

      for (let i = 0; i < numSamples; i++) {
        if (X[i][f] === 1) {
          leftY.push(y[i]);
        } else {
          rightY.push(y[i]);
        }
      }

      if (leftY.length === 0 || rightY.length === 0) continue;

      const gBase = this.gini(y);
      const gLeft = this.gini(leftY);
      const gRight = this.gini(rightY);

      const gain =
        gBase -
        (leftY.length / numSamples) * gLeft -
        (rightY.length / numSamples) * gRight;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = f;
      }
    }

    if (bestFeature === -1 || bestGain <= 1e-5) {
      return { isLeaf: true, prob: p };
    }

    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < numSamples; i++) {
      if (X[i][bestFeature] === 1) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      isLeaf: false,
      feature: bestFeature,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1),
      prob: p,
    };
  }

  predictProb(x: number[]): number {
    let node = this.root;
    while (node && !node.isLeaf) {
      if (x[node.feature] === 1) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    return node ? node.prob : 0.05; // small default prior
  }
}

/**
 * A Multi-output Random Forest Ensemble
 * matching sklearn's RandomForestClassifier(n_estimators=100) behavior.
 */
export class RandomForestClassifierTS {
  nEstimators: number;
  maxDepth: number;
  trees: DecisionTreeClassifier[][] = []; // trees[targetIndex][treeIndex]
  numTargets = 0;

  constructor(nEstimators = 40, maxDepth = 5) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[][]) {
    const numSamples = X.length;
    if (numSamples === 0) return;
    this.numTargets = y[0].length;

    this.trees = [];
    for (let t = 0; t < this.numTargets; t++) {
      const targetTrees: DecisionTreeClassifier[] = [];
      const singleTargetY = y.map(row => row[t]);

      for (let treeIdx = 0; treeIdx < this.nEstimators; treeIdx++) {
        // Bootstrap sample (sampling with replacement)
        const bootX: number[][] = [];
        const bootY: number[] = [];
        for (let i = 0; i < numSamples; i++) {
          const randIdx = Math.floor(Math.random() * numSamples);
          bootX.push(X[randIdx]);
          bootY.push(singleTargetY[randIdx]);
        }

        const dt = new DecisionTreeClassifier(this.maxDepth);
        dt.fit(bootX, bootY);
        targetTrees.push(dt);
      }
      this.trees.push(targetTrees);
    }
  }

  /**
   * Predicts probabilities for each target, given a single input feature vector.
   * Returns an array of size `numTargets` containing probabilities.
   */
  predictProba(x: number[]): number[] {
    const probabilities: number[] = [];

    for (let t = 0; t < this.numTargets; t++) {
      const targetTrees = this.trees[t];
      if (!targetTrees || targetTrees.length === 0) {
        probabilities.push(0);
        continue;
      }

      let sumProb = 0;
      for (const tree of targetTrees) {
        sumProb += tree.predictProb(x);
      }
      probabilities.push(sumProb / targetTrees.length);
    }

    return probabilities;
  }
}

/**
 * Convenience utility to train ML model on draw history and predict next probabilities
 */
export function trainAndPredict(
  draws: number[][],
  maxNum: number
): { num: number; prob: number }[] {
  if (draws.length < 5) {
    // If we don't have enough data, fall back to simple default frequency
    const results = [];
    for (let n = 1; n <= maxNum; n++) {
      results.push({ num: n, prob: 1 / maxNum });
    }
    return results;
  }

  // Prepare binary representations
  // index 0 -> number 1, index maxNum-1 -> number maxNum
  const binaryDraws: number[][] = draws.map(draw => {
    const vector = Array(maxNum).fill(0);
    for (const num of draw) {
      if (num >= 1 && num <= maxNum) {
        vector[num - 1] = 1;
      }
    }
    return vector;
  });

  // X is draws[:-1], y is draws[1:]
  const X = binaryDraws.slice(0, -1);
  const y = binaryDraws.slice(1);

  // Train Random Forest
  const rf = new RandomForestClassifierTS(40, 5); // 40 estimators, maxDepth=5 is robust & fast
  rf.fit(X, y);

  // Predict on last draw vector
  const lastDrawVec = binaryDraws[binaryDraws.length - 1];
  const predictedProbas = rf.predictProba(lastDrawVec);

  return predictedProbas.map((prob, idx) => ({
    num: idx + 1,
    prob: prob,
  }));
}
