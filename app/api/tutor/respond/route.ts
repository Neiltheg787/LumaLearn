import { NextResponse } from "next/server";
import { hasGemini } from "@/lib/env";
import { retrieveRelevantMemories, memoryContextForGemini } from "@/lib/everos";
import { tutorSchema } from "@/lib/validators";
import type { TutorResponse } from "@/lib/types";

function demoTutor(answer: string, hintRequested: boolean): TutorResponse {
  const normalized = answer.toLowerCase();
  const hasRightAtrium = normalized.includes("right atrium") || normalized.includes("right atria");
  const mentionsVenaCava = normalized.includes("vena cava");
  const correct = hasRightAtrium || mentionsVenaCava;

  if (hintRequested) {
    return {
      message: "Look for the chamber that receives blood returning from the body before it moves toward the lungs.",
      question: "Which chamber receives deoxygenated blood from the vena cava?",
      hint: "It is on the right side of the heart and is an upper chamber.",
      evaluation: "not_answered",
      nextAction: "hint",
      demoMode: true
    };
  }

  return {
    message: correct
      ? "Good reasoning. Deoxygenated blood returns through the vena cava and enters the right atrium before moving to the right ventricle."
      : "You are close, but check whether the blood is entering the heart or leaving it. The first receiving chamber matters here.",
    question: correct
      ? "Now trace the next two stops after the right atrium."
      : "What clue tells you this blood is returning from the body rather than going to the body?",
    hint: correct ? "Think valve, ventricle, then pulmonary artery." : "Start with the vena cava.",
    evaluation: correct ? "correct" : "misconception",
    misconception: correct ? undefined : "Confuses the heart chamber where blood enters with a vessel where blood exits.",
    nextAction: correct ? "complete" : "ask",
    demoMode: true
  };
}

export async function POST(request: Request) {
  const { answer = "", hintRequested = false, topic = "Human Heart", studentId = "demo-student", analysis } = await request.json().catch(() => ({}));
  const memory = await retrieveRelevantMemories(String(studentId), `${topic} ${String(answer)}`);

  if (!hasGemini()) {
    const demo = demoTutor(String(answer), Boolean(hintRequested));
    return NextResponse.json({
      ...demo,
      memoryUsed: !memory.demoMode,
      memorySummary: memory.recommendedNextLesson
    });
  }

  try {
    const prompt = [
      `You are a Socratic visual learning tutor for ${topic}.`,
      analysis ? `Textbook analysis: ${JSON.stringify(analysis)}` : "",
      `Previous learning history from EverOS:\n${memoryContextForGemini(memory)}`,
      "Personalize the explanation based on the memory, but do not reveal private implementation details.",
      "Evaluate the student answer without immediately revealing the full solution.",
      "Return strict JSON with message, question, hint, evaluation, misconception, nextAction.",
      `Student answer: ${String(answer)}`
    ].join("\n\n");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      }
    );

    if (!response.ok) {
      const demo = demoTutor(String(answer), Boolean(hintRequested));
      return NextResponse.json({ ...demo, memoryUsed: !memory.demoMode });
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = tutorSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      const demo = demoTutor(String(answer), Boolean(hintRequested));
      return NextResponse.json({ ...demo, memoryUsed: !memory.demoMode });
    }

    return NextResponse.json({ ...parsed.data, demoMode: false, memoryUsed: !memory.demoMode });
  } catch {
    const demo = demoTutor(String(answer), Boolean(hintRequested));
    return NextResponse.json({ ...demo, memoryUsed: !memory.demoMode });
  }
}
