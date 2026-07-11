import { NextResponse } from "next/server";
import { calculateMastery } from "@/lib/mastery";
import { isDemoMode } from "@/lib/env";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const previousMastery = Number(payload.previousMastery ?? 68);
  const result = calculateMastery({
    previousMastery,
    correct: Boolean(payload.correct),
    hintsUsed: Number(payload.hintsUsed ?? 0),
    attempts: Number(payload.attempts ?? 1),
    difficulty: payload.difficulty === 3 || payload.difficulty === 2 ? payload.difficulty : 1
  });

  return NextResponse.json({
    concept: String(payload.concept ?? "Human Heart"),
    previousMastery,
    ...result,
    demoMode: isDemoMode()
  });
}
