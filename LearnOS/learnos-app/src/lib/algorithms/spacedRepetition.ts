export interface SpacedRepetitionInput {
  currentProbability: number;
  evidenceCount: number;
  easeFactor: number;
  interval: number;
  consecutiveCorrect: number;
  scorePercentage: number;
}

export interface SpacedRepetitionOutput {
  probability: number;
  evidenceCount: number;
  easeFactor: number;
  interval: number;
  consecutiveCorrect: number;
  nextReviewDate: Date;
}

export function calculateSpacedRepetition(
  input: SpacedRepetitionInput
): SpacedRepetitionOutput {
  const {
    currentProbability,
    evidenceCount,
    easeFactor,
    interval,
    consecutiveCorrect,
    scorePercentage
  } = input;

  // 1. Update Bayesian-like Probability
  let newProbability = currentProbability;
  
  if (evidenceCount === 0) {
    // First attempt: jump straight to the score
    newProbability = scorePercentage;
  } else {
    // Basic Elo/Weighted average logic for MVP
    if (scorePercentage > currentProbability) {
      newProbability = currentProbability + ((scorePercentage - currentProbability) * 0.5);
    } else {
      newProbability = currentProbability - ((currentProbability - scorePercentage) * 0.2);
    }
  }

  // Cap between 0 and 100
  newProbability = Math.max(0, Math.min(100, newProbability));

  // 2. SM-2 Algorithm Updates
  // Map score (0-100) to SM-2 quality scale (0-5)
  // < 60 = 0-2 (incorrect/hard)
  // >= 60 = 3-5 (correct/easy)
  let quality = Math.round(scorePercentage / 20);
  quality = Math.max(0, Math.min(5, quality));

  let newConsecutiveCorrect = consecutiveCorrect;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (quality < 3) {
    // Incorrect or very hard
    newConsecutiveCorrect = 0;
    newInterval = 1;
  } else {
    // Correct
    newConsecutiveCorrect += 1;
    if (newConsecutiveCorrect === 1) {
      newInterval = 1;
    } else if (newConsecutiveCorrect === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.ceil(newInterval * easeFactor);
    }
  }

  // Update ease factor based on quality
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Floor at 1.3 to prevent interval from shrinking indefinitely for correct answers
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    probability: newProbability,
    evidenceCount: evidenceCount + 1,
    easeFactor: newEaseFactor,
    interval: newInterval,
    consecutiveCorrect: newConsecutiveCorrect,
    nextReviewDate
  };
}
