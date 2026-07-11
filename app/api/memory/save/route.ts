import { NextResponse } from "next/server";
import { createStudentMemory, saveLessonMemory } from "@/lib/everos";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const studentId = String(payload.studentId ?? "demo-student");
  const result = payload.analysis
    ? await saveLessonMemory({
        studentId,
        analysis: payload.analysis,
        tutorResponse: payload.tutorResponse,
        progress: payload.progress,
        answer: payload.answer
      })
    : await createStudentMemory(studentId, payload.profile ?? {});

  return NextResponse.json({
    saved: true,
    memoryUpdated: Boolean(result),
    demoMode: !result,
    storedFields: Object.keys(payload).filter((key) => !["email", "name", "password"].includes(key.toLowerCase()))
  });
}
