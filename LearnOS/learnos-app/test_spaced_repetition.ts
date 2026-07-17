import { calculateSpacedRepetition, SpacedRepetitionInput } from "./src/lib/algorithms/spacedRepetition.ts"

function test() {
  console.log("--- Testing SM-2 Spaced Repetition Algorithm ---")

  let state: SpacedRepetitionInput = {
    currentProbability: 0,
    evidenceCount: 0,
    easeFactor: 2.5,
    interval: 0,
    consecutiveCorrect: 0,
    scorePercentage: 80 // First attempt: good score
  }

  console.log("Initial state:", state)
  
  // Day 1
  let result = calculateSpacedRepetition(state)
  console.log("After Day 1 (Score 80):", result)

  // Update state for next day
  state = {
    currentProbability: result.probability,
    evidenceCount: result.evidenceCount,
    easeFactor: result.easeFactor,
    interval: result.interval,
    consecutiveCorrect: result.consecutiveCorrect,
    scorePercentage: 90
  }

  // Day 2
  result = calculateSpacedRepetition(state)
  console.log("\nAfter Day 2 (Score 90):", result)

  // Update state for next day
  state = {
    currentProbability: result.probability,
    evidenceCount: result.evidenceCount,
    easeFactor: result.easeFactor,
    interval: result.interval,
    consecutiveCorrect: result.consecutiveCorrect,
    scorePercentage: 40 // Bad score
  }

  // Day 3
  result = calculateSpacedRepetition(state)
  console.log("\nAfter Day 3 (Score 40 - Incorrect):", result)
  
  // Day 4 (Recovery)
  state = {
    currentProbability: result.probability,
    evidenceCount: result.evidenceCount,
    easeFactor: result.easeFactor,
    interval: result.interval,
    consecutiveCorrect: result.consecutiveCorrect,
    scorePercentage: 100 // Perfect score
  }
  
  result = calculateSpacedRepetition(state)
  console.log("\nAfter Day 4 (Score 100 - Recovery):", result)
}

test()
