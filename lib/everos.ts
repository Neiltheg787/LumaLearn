import { demoMemory } from "./demo-data";
import { hasEverOS } from "./env";
import type { LessonProgress, PageAnalysis, StudentMemory, TutorResponse } from "./types";

const EVEROS_BASE_URL = process.env.EVEROS_API_BASE_URL ?? "https://api.evermind.ai/everos/v1";

type EverOSMemoryPayload = {
  studentId: string;
  content: string;
  metadata?: Record<string, unknown>;
};

function everosHeaders() {
  return {
    Authorization: `Bearer ${process.env.EVEROS_API_KEY}`,
    "Content-Type": "application/json"
  };
}

async function everosFetch<T>(path: string, init: RequestInit): Promise<T | null> {
  if (!hasEverOS()) return null;

  try {
    const response = await fetch(`${EVEROS_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...everosHeaders(),
        ...(init.headers ?? {})
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeMemory(input: unknown, studentId: string): StudentMemory | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<StudentMemory> & { memories?: unknown[]; results?: unknown[] };
  const memoryItems = [...(value.memories ?? []), ...(value.results ?? [])].map((item) => JSON.stringify(item));

  return {
    studentId,
    conceptsStudied: value.conceptsStudied ?? demoMemory.conceptsStudied,
    correctAnswers: value.correctAnswers ?? demoMemory.correctAnswers,
    incorrectAnswers: value.incorrectAnswers ?? demoMemory.incorrectAnswers,
    misconceptions: value.misconceptions ?? demoMemory.misconceptions,
    mastery: value.mastery ?? demoMemory.mastery,
    preferredExplanationStyle: value.preferredExplanationStyle ?? demoMemory.preferredExplanationStyle,
    completedLessons: value.completedLessons ?? demoMemory.completedLessons,
    recommendedNextLesson: value.recommendedNextLesson ?? demoMemory.recommendedNextLesson,
    observations: value.observations ?? memoryItems.slice(0, 3),
    demoMode: false
  };
}

export async function createStudentMemory(studentId: string, profile: Partial<StudentMemory> = {}) {
  const content = [
    `Student ${studentId} learning profile created.`,
    profile.preferredExplanationStyle ? `Preferred style: ${profile.preferredExplanationStyle}` : undefined,
    profile.recommendedNextLesson ? `Recommended next lesson: ${profile.recommendedNextLesson}` : undefined
  ]
    .filter(Boolean)
    .join("\n");

  const payload: EverOSMemoryPayload = {
    studentId,
    content,
    metadata: {
      type: "student_profile",
      studentId,
      profile
    }
  };

  return everosFetch("/memories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function retrieveRelevantMemories(studentId: string, query = "current STEM lesson"): Promise<StudentMemory> {
  const result =
    (await everosFetch<unknown>("/memories/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        user_id: studentId,
        studentId,
        limit: 8,
        filters: { studentId }
      })
    })) ??
    (await everosFetch<unknown>(`/memories?studentId=${encodeURIComponent(studentId)}&query=${encodeURIComponent(query)}`, {
      method: "GET"
    }));

  return normalizeMemory(result, studentId) ?? { ...demoMemory, studentId, demoMode: true };
}

export async function saveLessonMemory(args: {
  studentId: string;
  analysis: PageAnalysis;
  tutorResponse?: TutorResponse;
  progress?: LessonProgress;
  answer?: string;
}) {
  const misconception = args.tutorResponse?.misconception;
  const content = [
    `Completed lesson memory for ${args.analysis.topic}.`,
    `Concepts: ${args.analysis.keyConcepts.join(", ")}.`,
    args.answer ? `Student answer: ${args.answer}` : undefined,
    args.tutorResponse?.evaluation ? `Tutor evaluation: ${args.tutorResponse.evaluation}.` : undefined,
    misconception ? `Misconception: ${misconception}.` : undefined,
    args.progress ? `Mastery moved from ${args.progress.previousMastery} to ${args.progress.mastery}.` : undefined,
    `Recommended next lesson: ${args.tutorResponse?.question ?? args.analysis.openingQuestion}`
  ]
    .filter(Boolean)
    .join("\n");

  return everosFetch("/memories", {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      user_id: args.studentId,
      content,
      metadata: {
        type: "lesson_memory",
        studentId: args.studentId,
        topic: args.analysis.topic,
        modelId: args.analysis.modelId,
        progress: args.progress,
        misconception
      }
    })
  });
}

export async function updateMasteryMemory(studentId: string, progress: LessonProgress) {
  return everosFetch("/memories", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      user_id: studentId,
      content: `Mastery update for ${progress.concept}: ${progress.previousMastery} -> ${progress.mastery}. ${progress.explanation}`,
      metadata: {
        type: "mastery_change",
        studentId,
        concept: progress.concept,
        mastery: progress.mastery,
        pointsEarned: progress.pointsEarned,
        completed: progress.completed
      }
    })
  });
}

export function memoryContextForGemini(memory: StudentMemory) {
  return [
    `Preferred learning style: ${memory.preferredExplanationStyle}`,
    `Concepts learned: ${memory.conceptsStudied.join(", ")}`,
    `Completed topics: ${memory.completedLessons.join(", ")}`,
    `Incorrect answers: ${memory.incorrectAnswers}`,
    `Misconceptions: ${memory.misconceptions.join("; ")}`,
    `Mastery scores: ${Object.entries(memory.mastery)
      .map(([concept, score]) => `${concept} ${score}%`)
      .join(", ")}`,
    `Tutor observations: ${(memory.observations ?? []).join("; ")}`,
    `Recommended next lesson: ${memory.recommendedNextLesson}`
  ].join("\n");
}
