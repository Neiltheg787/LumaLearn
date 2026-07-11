import { NextResponse } from "next/server";
import { calculateMastery } from "@/lib/mastery";
import { saveProgress } from "@/lib/butterbase";
import { updateMasteryMemory } from "@/lib/everos";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const studentId = String(payload.studentId ?? "demo-student");
  const previousMastery = Number(payload.previousMastery ?? 68);
  const result = calculateMastery({
    previousMastery,
    correct: Boolean(payload.correct),
    hintsUsed: Number(payload.hintsUsed ?? 0),
    attempts: Number(payload.attempts ?? 1),
    difficulty: payload.difficulty === 3 || payload.difficulty === 2 ? payload.difficulty : 1
  });

  const progress = {
    concept: String(payload.concept ?? "Human Heart"),
    previousMastery,
    ...result,
    demoMode: false
  };

  const [butterbase, everos] = await Promise.allSettled([
    saveProgress({ studentId, progress }),
    updateMasteryMemory(studentId, progress)
  ]);

  return NextResponse.json({
    ...progress,
    demoMode: butterbase.status !== "fulfilled" || !butterbase.value,
    memoryUpdated: everos.status === "fulfilled" && Boolean(everos.value)
  });
}
