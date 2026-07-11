export type ModelId =
  | "heart"
  | "bunsen_burner"
  | "sodium"
  | "lithium"
  | "newtons_cradle"
  | "periodic_table"
  | "sodium_chloride"
  | "helium"
  | "carbon";

export type PageAnalysis = {
  subject: string;
  topic: string;
  learningObjective: string;
  modelId: ModelId;
  confidence: number;
  keyConcepts: string[];
  openingQuestion: string;
  demoMode: boolean;
};

export type TutorResponse = {
  message: string;
  question: string;
  hint?: string;
  evaluation?: "correct" | "partial" | "misconception" | "not_answered";
  misconception?: string;
  nextAction: "ask" | "hint" | "complete";
  demoMode: boolean;
  source?: "openai" | "fallback";
  model?: string;
  warning?: string;
  memoryUsed?: boolean;
  memorySummary?: string;
};

export type LessonProgress = {
  concept: string;
  previousMastery: number;
  mastery: number;
  pointsEarned: number;
  completed: boolean;
  explanation: string;
  demoMode: boolean;
};

export type RecentLesson = {
  title: string;
  subject: string;
  mastery: number;
  points: number;
};

export type DashboardData = {
  studentId: string;
  studentName: string;
  streak: number;
  points: number;
  lessonsCompleted: number;
  weeklyActivity: number[];
  savedScans: string[];
  recentLessons: RecentLesson[];
  recommendations: string[];
  mastery: Record<string, number>;
  leaderboard: Array<{ name: string; points: number }>;
  demoMode: boolean;
  warning?: string;
};

export type StudentMemory = {
  studentId: string;
  conceptsStudied: string[];
  correctAnswers: number;
  incorrectAnswers: number;
  misconceptions: string[];
  mastery: Record<string, number>;
  preferredExplanationStyle: string;
  completedLessons: string[];
  recommendedNextLesson: string;
  demoMode: boolean;
  observations?: string[];
};
