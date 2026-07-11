export type MasteryInput = {
  previousMastery: number;
  correct: boolean;
  hintsUsed: number;
  attempts: number;
  difficulty: 1 | 2 | 3;
};

export function calculateMastery(input: MasteryInput) {
  const base = input.correct ? 10 + input.difficulty * 4 : -4;
  const hintPenalty = Math.min(input.hintsUsed * 3, 9);
  const attemptPenalty = Math.min(Math.max(input.attempts - 1, 0) * 2, 8);
  const delta = base - hintPenalty - attemptPenalty;
  const mastery = Math.max(0, Math.min(100, Math.round(input.previousMastery + delta)));
  const pointsEarned = Math.max(5, (input.correct ? 30 : 10) + (input.hintsUsed === 0 && input.correct ? 10 : 0) - attemptPenalty);

  return {
    mastery,
    pointsEarned,
    completed: mastery >= 72 || input.correct,
    explanation: input.correct
      ? `Mastery improved by ${Math.max(0, mastery - input.previousMastery)} based on correctness, hints, attempts, and difficulty.`
      : "Mastery was held back because the answer still shows a misconception."
  };
}
