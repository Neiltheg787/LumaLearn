import { randomUUID } from "crypto";
import { dashboard } from "./demo-data";
import { hasButterbase } from "./env";
import type { DashboardData, LessonProgress, PageAnalysis, StudentMemory } from "./types";

const DEFAULT_APP_ID = process.env.BUTTERBASE_APP_ID ?? process.env.BUTTERBASE_PROJECT_ID ?? "";
const DEFAULT_API_BASE = DEFAULT_APP_ID ? `https://api.butterbase.ai/v1/${DEFAULT_APP_ID}` : "";
const BUTTERBASE_API_BASE_URL = (process.env.BUTTERBASE_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/$/, "");
const DEMO_STUDENT_ID = "demo-student";

export const BUTTERBASE_TABLES = [
  "students",
  "lessons",
  "progress",
  "quiz_attempts",
  "scans",
  "achievements",
  "leaderboard"
] as const;

export const BUTTERBASE_RESOURCES = {
  Students: "students",
  Lessons: "lessons",
  Progress: "progress",
  QuizAttempts: "quiz_attempts",
  Scans: "scans",
  Achievements: "achievements",
  Leaderboard: "leaderboard"
} as const;

type TableName = (typeof BUTTERBASE_TABLES)[number];

type StudentRow = {
  id: string;
  display_name: string;
  email: string;
  points: number;
  current_streak: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
};

type ProgressRow = {
  id: string;
  student_id: string;
  lesson_id: string;
  subject: string;
  topic: string;
  mastery_score: number;
  attempts: number;
  hints_used: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

type ScanRow = {
  id: string;
  student_id: string;
  subject: string;
  topic: string;
  model_id: string;
  confidence: number;
  image_metadata: Record<string, unknown>;
  created_at: string;
};

type LeaderboardRow = {
  id: string;
  student_id: string;
  display_name: string;
  points: number;
  updated_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function lessonIdFor(input: Pick<PageAnalysis, "subject" | "topic" | "modelId"> | { concept: string }) {
  if ("concept" in input) return `lesson-${slug(`Biology-${input.concept || "stem-lesson"}-heart`)}`;
  return `lesson-${slug(`${input.subject}-${input.topic}-${input.modelId}`)}`;
}

function progressIdFor(studentId: string, lessonId: string) {
  return `${studentId}:${lessonId}`;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.BUTTERBASE_API_KEY}`,
    "Content-Type": "application/json"
  };
}

function tablePath(table: TableName, id?: string) {
  return `/${table}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

async function butterbaseFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!hasButterbase() || !BUTTERBASE_API_BASE_URL) return null;

  try {
    const response = await fetch(`${BUTTERBASE_API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...authHeaders(),
        ...(init.headers ?? {})
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return null;
    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function listRows<T>(table: TableName, params: Record<string, string | number | undefined> = {}) {
  return (await butterbaseFetch<T[]>(`${tablePath(table)}${query(params)}`)) ?? [];
}

async function getRow<T>(table: TableName, id: string) {
  return butterbaseFetch<T>(tablePath(table, id));
}

async function insertRow<T>(table: TableName, data: Record<string, unknown>) {
  return butterbaseFetch<T>(tablePath(table), {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function patchRow<T>(table: TableName, id: string, data: Record<string, unknown>) {
  return butterbaseFetch<T>(tablePath(table, id), {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

async function upsertById<T>(table: TableName, id: string, data: Record<string, unknown>) {
  const patched = await patchRow<T>(table, id, data);
  if (patched) return patched;
  return insertRow<T>(table, { id, ...data });
}

async function ensureStudent(studentId = DEMO_STUDENT_ID, displayName = "Thaddeus") {
  return upsertById<StudentRow>("students", studentId, {
    display_name: displayName,
    email: `${studentId}@lumalearn.local`,
    last_active_at: nowIso(),
    updated_at: nowIso()
  });
}

async function ensureLesson(analysis: PageAnalysis, difficulty = 2) {
  const id = lessonIdFor(analysis);
  return upsertById("lessons", id, {
    subject: analysis.subject,
    topic: analysis.topic,
    learning_objective: analysis.learningObjective,
    model_id: analysis.modelId,
    difficulty
  });
}

async function ensureConceptLesson(concept: string) {
  const id = lessonIdFor({ concept });
  return upsertById("lessons", id, {
    subject: "STEM",
    topic: concept,
    learning_objective: `Build mastery for ${concept}.`,
    model_id: "heart",
    difficulty: 2
  });
}

async function addStudentPoints(studentId: string, displayName: string, pointsToAdd: number) {
  const current = await getRow<StudentRow>("students", studentId);
  const nextPoints = Math.max(0, (current?.points ?? 0) + pointsToAdd);
  const updated = await upsertById<StudentRow>("students", studentId, {
    display_name: displayName,
    email: current?.email ?? `${studentId}@lumalearn.local`,
    points: nextPoints,
    current_streak: Math.max(current?.current_streak ?? 1, 1),
    last_active_at: nowIso(),
    updated_at: nowIso()
  });

  await upsertById<LeaderboardRow>("leaderboard", `leaderboard-${studentId}`, {
    student_id: studentId,
    display_name: displayName,
    points: updated?.points ?? nextPoints,
    updated_at: nowIso()
  });

  return updated?.points ?? nextPoints;
}

export async function ensureButterbaseCollections() {
  return {
    ok: hasButterbase(),
    demoMode: !hasButterbase(),
    appId: DEFAULT_APP_ID,
    apiBase: BUTTERBASE_API_BASE_URL,
    tables: BUTTERBASE_TABLES,
    resources: BUTTERBASE_RESOURCES
  };
}

export async function upsertStudentProfile(studentId: string, profile: Partial<StudentMemory>) {
  return upsertById<StudentRow>("students", studentId, {
    display_name: profile.studentId === studentId ? "Thaddeus" : studentId,
    email: `${studentId}@lumalearn.local`,
    points: profile.correctAnswers ?? 0,
    current_streak: 1,
    last_active_at: nowIso(),
    updated_at: nowIso()
  });
}

export async function saveScan(args: { studentId: string; analysis: PageAnalysis; imageName?: string }) {
  await ensureStudent(args.studentId);
  return insertRow<ScanRow>("scans", {
    id: `scan-${randomUUID()}`,
    student_id: args.studentId,
    subject: args.analysis.subject,
    topic: args.analysis.topic,
    model_id: args.analysis.modelId,
    confidence: args.analysis.confidence,
    image_metadata: {
      imageName: args.imageName,
      learningObjective: args.analysis.learningObjective,
      keyConcepts: args.analysis.keyConcepts
    }
  });
}

export async function saveLesson(args: { studentId: string; analysis: PageAnalysis; progress?: LessonProgress }) {
  await ensureStudent(args.studentId);
  return ensureLesson(args.analysis);
}

export async function saveQuizAttempt(args: {
  studentId: string;
  lessonId?: string;
  topic: string;
  question?: string;
  answer: string;
  evaluation?: string;
  misconception?: string;
  hintsUsed: number;
  attempts: number;
  difficulty?: number;
}) {
  const lessonId = args.lessonId ?? lessonIdFor({ concept: args.topic });
  return insertRow("quiz_attempts", {
    id: `quiz-${randomUUID()}`,
    student_id: args.studentId,
    lesson_id: lessonId,
    question: args.question ?? args.topic,
    student_answer: args.answer,
    correctness: args.evaluation ?? "not_answered",
    hints_used: args.hintsUsed,
    difficulty: args.difficulty ?? 2
  });
}

export async function saveProgress(args: { studentId: string; progress: LessonProgress }) {
  await ensureStudent(args.studentId);
  await ensureConceptLesson(args.progress.concept);
  const lessonId = lessonIdFor({ concept: args.progress.concept });
  const id = progressIdFor(args.studentId, lessonId);
  const current = await getRow<ProgressRow>("progress", id);

  return upsertById<ProgressRow>("progress", id, {
    student_id: args.studentId,
    lesson_id: lessonId,
    subject: "STEM",
    topic: args.progress.concept,
    mastery_score: args.progress.mastery,
    attempts: Math.max(current?.attempts ?? 0, 1),
    hints_used: current?.hints_used ?? 0,
    completed: current?.completed ?? false,
    completed_at: current?.completed_at ?? null,
    updated_at: nowIso()
  });
}

export async function saveAchievement(args: { studentId: string; title: string; points: number; reason: string }) {
  return upsertById("achievements", `achievement-${args.studentId}-${slug(args.title)}`, {
    student_id: args.studentId,
    achievement_type: slug(args.title),
    title: args.title,
    earned_at: nowIso()
  });
}

export async function updateLeaderboard(args: { studentId: string; name: string; points: number }) {
  return upsertById<LeaderboardRow>("leaderboard", `leaderboard-${args.studentId}`, {
    student_id: args.studentId,
    display_name: args.name,
    points: args.points,
    updated_at: nowIso()
  });
}

function fallbackDashboard(studentId: string, warning: string): DashboardData {
  return {
    ...dashboard,
    studentId,
    demoMode: true,
    warning
  };
}

export async function getDashboardData(studentId: string): Promise<DashboardData> {
  if (!hasButterbase()) return fallbackDashboard(studentId, "Butterbase unavailable; using cached demo data.");

  const [student, progressRows, scanRows, leaderboardRows] = await Promise.all([
    getRow<StudentRow>("students", studentId),
    listRows<ProgressRow>("progress", {
      student_id: `eq.${studentId}`,
      order: "updated_at.desc",
      limit: 8
    }),
    listRows<ScanRow>("scans", {
      student_id: `eq.${studentId}`,
      order: "created_at.desc",
      limit: 6
    }),
    listRows<LeaderboardRow>("leaderboard", {
      order: "points.desc",
      limit: 5
    })
  ]);

  if (!student) return fallbackDashboard(studentId, "Butterbase student profile is missing; using cached demo data.");

  const completedRows = progressRows.filter((row) => row.completed);
  const mastery = progressRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.topic] = row.mastery_score;
    return acc;
  }, {});

  return {
    ...dashboard,
    studentId,
    studentName: student.display_name,
    streak: student.current_streak,
    points: student.points,
    lessonsCompleted: completedRows.length,
    mastery: Object.keys(mastery).length ? mastery : dashboard.mastery,
    recentLessons: progressRows.length
      ? progressRows.map((row) => ({
          title: row.topic,
          subject: row.subject,
          mastery: row.mastery_score,
          points: row.completed ? Math.max(5, Math.round(row.mastery_score / 2)) : 0
        }))
      : dashboard.recentLessons,
    recommendations: progressRows[0]?.topic ? [`Continue ${progressRows[0].topic}`] : dashboard.recommendations,
    savedScans: scanRows.length ? scanRows.map((scan) => `${scan.topic} (${scan.subject})`) : dashboard.savedScans,
    weeklyActivity: dashboard.weeklyActivity,
    leaderboard: leaderboardRows.length
      ? leaderboardRows.map((row) => ({ name: row.display_name, points: row.points }))
      : dashboard.leaderboard,
    demoMode: false
  };
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
  if (!hasButterbase()) return { saved: false, demoMode: true, duplicate: false };

  await ensureStudent(args.studentId, args.name);
  await ensureLesson(args.analysis, 2);

  const lessonId = lessonIdFor(args.analysis);
  const progressId = progressIdFor(args.studentId, lessonId);
  const current = await getRow<ProgressRow>("progress", progressId);
  const duplicate = Boolean(current?.completed);
  const completedAt = current?.completed_at ?? nowIso();

  const progressRow = await upsertById<ProgressRow>("progress", progressId, {
    student_id: args.studentId,
    lesson_id: lessonId,
    subject: args.analysis.subject,
    topic: args.analysis.topic,
    mastery_score: args.progress.mastery,
    attempts: Math.max(args.attempts, current?.attempts ?? 0),
    hints_used: Math.max(args.hintsUsed, current?.hints_used ?? 0),
    completed: true,
    completed_at: completedAt,
    updated_at: nowIso()
  });

  if (!duplicate) {
    await Promise.allSettled([
      saveQuizAttempt({
        studentId: args.studentId,
        lessonId,
        topic: args.analysis.topic,
        question: args.analysis.openingQuestion,
        answer: args.answer ?? "",
        evaluation: args.evaluation,
        misconception: args.misconception,
        hintsUsed: args.hintsUsed,
        attempts: args.attempts,
        difficulty: 2
      }),
      saveAchievement({
        studentId: args.studentId,
        title: `${args.analysis.topic} completed`,
        points: args.progress.pointsEarned,
        reason: args.progress.explanation
      }),
      addStudentPoints(args.studentId, args.name, args.progress.pointsEarned)
    ]);
  }

  return {
    saved: Boolean(progressRow),
    demoMode: false,
    duplicate,
    pointsAwarded: duplicate ? 0 : args.progress.pointsEarned
  };
}
