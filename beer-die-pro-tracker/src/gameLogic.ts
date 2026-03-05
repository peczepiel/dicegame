/**
 * Beer Die Game Logic Functions
 */

/**
 * Checks if redemption mode should be triggered at the end of a possession.
 * Rule: leaderScore >= targetScore AND leaderScore >= trailerScore + 2
 */
export const shouldTriggerRedemption = (
  scoreA: number,
  scoreB: number,
  targetScore: number
): { trigger: boolean; leader: 'A' | 'B' | null; trailer: 'A' | 'B' | null } => {
  if (scoreA >= targetScore && scoreA >= scoreB + 2) {
    return { trigger: true, leader: 'A', trailer: 'B' };
  }
  if (scoreB >= targetScore && scoreB >= scoreA + 2) {
    return { trigger: true, leader: 'B', trailer: 'A' };
  }
  return { trigger: false, leader: null, trailer: null };
};

/**
 * Evaluates the outcome after a redemption possession.
 * Rule: gap = leaderScore - trailerScore. If gap >= 2 AND leaderScore >= targetScore -> Game Over.
 */
export const resolveRedemptionOutcome = (
  scoreA: number,
  scoreB: number,
  targetScore: number,
  leader: 'A' | 'B',
  trailer: 'A' | 'B'
): { gameOver: boolean; winner: 'A' | 'B' | null } => {
  const leaderScore = leader === 'A' ? scoreA : scoreB;
  const trailerScore = trailer === 'A' ? scoreA : scoreB;
  const gap = leaderScore - trailerScore;

  if (gap >= 2 && leaderScore >= targetScore) {
    return { gameOver: true, winner: leader };
  }
  return { gameOver: false, winner: null };
};

/**
 * TEST CASES (Pseudo-tests)
 * 
 * 1. shouldTriggerRedemption(11, 8, 11) -> { trigger: true, leader: 'A', trailer: 'B' }
 * 2. shouldTriggerRedemption(10, 10, 11) -> { trigger: false }
 * 3. shouldTriggerRedemption(11, 10, 11) -> { trigger: false }
 * 
 * 4. resolveRedemptionOutcome(11, 8, 11, 'A', 'B') -> { gameOver: true, winner: 'A' } (Gap 3)
 * 5. resolveRedemptionOutcome(11, 9, 11, 'A', 'B') -> { gameOver: true, winner: 'A' } (Gap 2)
 * 6. resolveRedemptionOutcome(11, 10, 11, 'A', 'B') -> { gameOver: false } (Gap 1)
 * 7. resolveRedemptionOutcome(11, 11, 11, 'A', 'B') -> { gameOver: false } (Gap 0)
 * 8. resolveRedemptionOutcome(11, 12, 11, 'A', 'B') -> { gameOver: false } (Trailer leads)
 * 
 * 9. resolveRedemptionOutcome(12, 10, 11, 'A', 'B') -> { gameOver: true, winner: 'A' } (Gap 2)
 */
