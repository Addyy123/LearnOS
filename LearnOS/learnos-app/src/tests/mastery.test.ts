import test from "node:test";
import assert from "node:assert/strict";
import { calculateSpacedRepetition } from "../lib/algorithms/spacedRepetition.ts";

test("calculateSpacedRepetition - first attempt jumps to score percentage", () => {
  const result = calculateSpacedRepetition({
    currentProbability: 0,
    evidenceCount: 0,
    easeFactor: 2.5,
    interval: 0,
    consecutiveCorrect: 0,
    scorePercentage: 80,
  });

  assert.equal(result.probability, 80);
  assert.equal(result.evidenceCount, 1);
  assert.equal(result.consecutiveCorrect, 1);
  assert.equal(result.interval, 1); // SM-2 first correct interval
});

test("calculateSpacedRepetition - subsequent correct answer increases probability", () => {
  const result = calculateSpacedRepetition({
    currentProbability: 60,
    evidenceCount: 1,
    easeFactor: 2.5,
    interval: 1,
    consecutiveCorrect: 1,
    scorePercentage: 100,
  });

  // 60 + ((100 - 60) * 0.5) = 80
  assert.equal(result.probability, 80);
  assert.equal(result.evidenceCount, 2);
  assert.equal(result.consecutiveCorrect, 2);
  assert.equal(result.interval, 6); // SM-2 second correct interval
});

test("calculateSpacedRepetition - incorrect answer decreases probability and resets interval", () => {
  const result = calculateSpacedRepetition({
    currentProbability: 80,
    evidenceCount: 5,
    easeFactor: 2.5,
    interval: 12,
    consecutiveCorrect: 3,
    scorePercentage: 0,
  });

  // 80 - ((80 - 0) * 0.2) = 64
  assert.equal(result.probability, 64);
  assert.equal(result.evidenceCount, 6);
  assert.equal(result.consecutiveCorrect, 0);
  assert.equal(result.interval, 1); // Reset SM-2 interval
});

test("calculateSpacedRepetition - caps probability at 100", () => {
  const result = calculateSpacedRepetition({
    currentProbability: 95,
    evidenceCount: 10,
    easeFactor: 2.5,
    interval: 10,
    consecutiveCorrect: 5,
    scorePercentage: 120, // Should be capped conceptually, but algorithm itself caps at 100
  });

  assert.equal(result.probability, 100);
});
