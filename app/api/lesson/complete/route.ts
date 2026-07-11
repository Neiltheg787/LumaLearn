import { NextResponse } from "next/server";
import { completeLesson } from "@/lib/butterbase";
import { saveLessonMemory } from "@/lib/everos";
import { demoAnalysis } from "@/lib/demo-data";
import type { LessonProgress, PageAnalysis, TutorResponse } from "@/lib/types";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const studentId = String(payload.studentId ?? "demo-student");
  const analysis = (payload.analysis ?? demoAnalysis) as PageAnalysis;
  const progress = payload.progress as LessonProgress | undefined;
  const tutorResponse = payload.tutorResponse as TutorResponse | undefined;

  if (!progress) {
    return NextResponse.json({ saved: false, demoMode: true, warning: "No progress payload supplied." }, { status: 400 });
  }

  const [butterbase, everos] = await Promise.allSettled([
    completeLesson({
      studentId,
      name: String(payload.name ?? "Thaddeus"),
      analysis,
      progress,
      answer: String(payload.answer ?? ""),
      evaluation: tutorResponse?.evaluation,
      misconception: tutorResponse?.misconception,
      hintsUsed: Number(payload.hintsUsed ?? 0),
      attempts: Number(payload.attempts ?? 1)
    }),
    saveLessonMemory({
      studentId,
      analysis,
      tutorResponse,
      progress,
      answer: String(payload.answer ?? "")
    })
  ]);

  return NextResponse.json({
    saved: butterbase.status === "fulfilled" ? butterbase.value.saved : false,
    memoryUpdated: everos.status === "fulfilled" && Boolean(everos.value),
    demoMode: butterbase.status === "fulfilled" ? butterbase.value.demoMode : true
  });
}
