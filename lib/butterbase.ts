import { dashboard } from "./demo-data";
import { hasButterbase } from "./env";
import type { DashboardData, LessonProgress, PageAnalysis, StudentMemory } from "./types";

const BUTTERBASE_BASE_URL = process.env.BUTTERBASE_API_BASE_URL ?? "https://api.butterbase.app/v1";

export const BUTTERBASE_COLLECTIONS = [
  "Students",
  "Lessons",
  "Progress",
  "QuizAttempts",
  "Scans",
  "Achievements",
  "Leaderboard"
] as const;

type CollectionName = (typeof BUTTERBASE_COLLECTIONS)[number];

function butterbaseHeaders() {
  return {
    Authorization: `Bearer ${process.env.BUTTERBASE_API_KEY}`,
    "Content-Type": "application/json",
    "X-Butterbase-Project": process.env.BUTTERBASE_PROJECT_ID ?? ""
  };
}

async function butterbaseFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!hasButterbase()) return null;

  try {
    const response = await fetch(`${BUTTERBASE_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...butterbaseHeaders(),
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

function collectionPath(collection: CollectionName) {
  return `/projects/${process.env.BUTTERBASE_PROJECT_ID}/collections/${collection}/records`;
}

export async function ensureButterbaseCollections() {
  if (!hasButterbase()) return { ok: false, demoMode: true };

  const results = await Promise.all(
    BUTTERBASE_COLLECTIONS.map((name) =>
      butterbaseFetch(`/projects/${process.env.BUTTERBASE_PROJECT_ID}/collections`, {
        method: "POST",
        body: JSON.stringify({
          name,
          fields: [
            { name: "studentId", type: "text" },
            { name: "payload", type: "json" },
            { name: "createdAt", type: "datetime" },
            { name: "updatedAt", type: "datetime" }
          ]
        })
      })
    )
  );

  return {
    ok: results.some(Boolean),
    demoMode: false,
    collections: BUTTERBASE_COLLECTIONS
  };
}

export async function upsertStudentProfile(studentId: string, profile: Partial<StudentMemory>) {
  return butterbaseFetch(collectionPath("Students"), {
    method: "POST",
    body: JSON.stringify({
      studentId,
      payload: profile,
      updatedAt: new Date().toISOString()
    })
  });
}

export async function saveScan(args: { studentId: string; analysis: PageAnalysis; imageName?: string }) {
  return butterbaseFetch(collectionPath("Scans"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: {
        imageName: args.imageName,
        subject: args.analysis.subject,
        topic: args.analysis.topic,
        modelId: args.analysis.modelId,
        confidence: args.analysis.confidence,
        learningObjective: args.analysis.learningObjective
      },
      createdAt: new Date().toISOString()
    })
  });
}

export async function saveLesson(args: { studentId: string; analysis: PageAnalysis; progress?: LessonProgress }) {
  return butterbaseFetch(collectionPath("Lessons"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: {
        title: args.analysis.topic,
        subject: args.analysis.subject,
        objective: args.analysis.learningObjective,
        modelId: args.analysis.modelId,
        progress: args.progress
      },
      createdAt: new Date().toISOString()
    })
  });
}

export async function saveQuizAttempt(args: {
  studentId: string;
  topic: string;
  answer: string;
  evaluation?: string;
  misconception?: string;
  hintsUsed: number;
  attempts: number;
}) {
  return butterbaseFetch(collectionPath("QuizAttempts"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: args,
      createdAt: new Date().toISOString()
    })
  });
}

export async function saveProgress(args: { studentId: string; progress: LessonProgress }) {
  return butterbaseFetch(collectionPath("Progress"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: args.progress,
      updatedAt: new Date().toISOString()
    })
  });
}

export async function saveAchievement(args: { studentId: string; title: string; points: number; reason: string }) {
  return butterbaseFetch(collectionPath("Achievements"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: args,
      createdAt: new Date().toISOString()
    })
  });
}

export async function updateLeaderboard(args: { studentId: string; name: string; points: number }) {
  return butterbaseFetch(collectionPath("Leaderboard"), {
    method: "POST",
    body: JSON.stringify({
      studentId: args.studentId,
      payload: args,
      updatedAt: new Date().toISOString()
    })
  });
}

function normalizeDashboard(input: unknown, studentId: string): DashboardData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<DashboardData> & { data?: Partial<DashboardData>; payload?: Partial<DashboardData> };
  const value = raw.data ?? raw.payload ?? raw;

  return {
    ...dashboard,
    ...value,
    studentId,
    demoMode: false,
    mastery: value.mastery ?? dashboard.mastery,
    recentLessons: value.recentLessons ?? dashboard.recentLessons,
    recommendations: value.recommendations ?? dashboard.recommendations,
    savedScans: value.savedScans ?? dashboard.savedScans,
    weeklyActivity: value.weeklyActivity ?? dashboard.weeklyActivity,
    leaderboard: value.leaderboard ?? dashboard.leaderboard
  };
}

export async function getDashboardData(studentId: string): Promise<DashboardData> {
  const result =
    (await butterbaseFetch<unknown>(`/projects/${process.env.BUTTERBASE_PROJECT_ID}/dashboard?studentId=${encodeURIComponent(studentId)}`)) ??
    (await butterbaseFetch<unknown>(`${collectionPath("Students")}?studentId=${encodeURIComponent(studentId)}`));

  return (
    normalizeDashboard(result, studentId) ?? {
      ...dashboard,
      studentId,
      demoMode: true,
      warning: "Butterbase unavailable; using cached demo data."
    }
  );
}

export async function completeLesson(args: {
  studentId: string;
  name: string;
  analysis: PageAnalysis;
  progress: LessonProgress;
  answer?: string;
  evaluation?: string;
  misconception?: string;
  hintsUsed: number;
  attempts: number;
}) {
  const writes = await Promise.allSettled([
    saveLesson(args),
    saveProgress({ studentId: args.studentId, progress: args.progress }),
    saveQuizAttempt({
      studentId: args.studentId,
      topic: args.analysis.topic,
      answer: args.answer ?? "",
      evaluation: args.evaluation,
      misconception: args.misconception,
      hintsUsed: args.hintsUsed,
      attempts: args.attempts
    }),
    saveAchievement({
      studentId: args.studentId,
      title: `${args.analysis.topic} completed`,
      points: args.progress.pointsEarned,
      reason: args.progress.explanation
    }),
    updateLeaderboard({ studentId: args.studentId, name: args.name, points: args.progress.pointsEarned })
  ]);

  return {
    saved: writes.some((write) => write.status === "fulfilled" && write.value),
    demoMode: !hasButterbase(),
    writes
  };
}
