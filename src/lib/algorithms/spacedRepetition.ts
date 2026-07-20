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

  // 1. Deep Knowledge Tracing (BKT Model)
  let newProbability = currentProbability;
  
  if (evidenceCount === 0) {
    // First attempt: jump straight to the score
    newProbability = scorePercentage;
  } else {
    // Bayesian Knowledge Tracing parameters
    const P_T = 0.1;  // Probability of transitioning from unlearned to learned state
    const P_S = 0.2;  // Probability of slipping (making a mistake despite knowing)
    const P_G = 0.25; // Probability of guessing correctly
    
    // Normalize to 0.0 - 1.0
    let p_L = currentProbability / 100;
    
    // Determine observation (correct if >= 60%)
    const isCorrect = scorePercentage >= 60;
    
    // Calculate posterior probability of learning state given the observation
    let p_L_given_obs;
    if (isCorrect) {
      p_L_given_obs = (p_L * (1 - P_S)) / (p_L * (1 - P_S) + (1 - p_L) * P_G);
    } else {
      p_L_given_obs = (p_L * P_S) / (p_L * P_S + (1 - p_L) * (1 - P_G));
    }
    
    // Apply learning transition (chance they learned it after answering)
    p_L = p_L_given_obs + (1 - p_L_given_obs) * P_T;
    
    // Convert back to 0-100 scale
    newProbability = p_L * 100;
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
