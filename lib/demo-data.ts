import type { DashboardData, PageAnalysis, StudentMemory } from "./types";

export const demoAnalysis: PageAnalysis = {
  subject: "Biology",
  topic: "Human Heart",
  learningObjective: "Trace the flow of blood through the heart and distinguish oxygenated from deoxygenated blood.",
  modelId: "heart",
  confidence: 0.96,
  keyConcepts: ["atria", "ventricles", "oxygenated blood", "deoxygenated blood"],
  openingQuestion: "Where does deoxygenated blood enter the heart first?",
  demoMode: true
};

export const demoMemory: StudentMemory = {
  studentId: "demo-student",
  conceptsStudied: ["Heart chambers", "Blood flow", "Atomic structure"],
  correctAnswers: 7,
  incorrectAnswers: 3,
  misconceptions: ["Mixes up pulmonary artery and pulmonary vein"],
  mastery: {
    "Human Heart": 68,
    "Atomic Structure": 74,
    "Forces and Motion": 52
  },
  preferredExplanationStyle: "Short visual prompts followed by one guiding question.",
  completedLessons: ["Heart anatomy intro", "Sodium atom structure"],
  recommendedNextLesson: "Trace blood from the right atrium to the lungs",
  demoMode: true,
  observations: ["Student benefits from tracing the path aloud before naming vessels."]
};

export const dashboard: DashboardData = {
  studentId: "demo-student",
  studentName: "Thaddeus",
  streak: 5,
  points: 23430,
  lessonsCompleted: 12,
  weeklyActivity: [20, 45, 30, 60, 75, 55, 90],
  savedScans: ["Heart textbook diagram", "Periodic table page", "Newton's cradle lab sheet"],
  recentLessons: [
    { title: "Heart anatomy intro", subject: "Biology", mastery: 68, points: 40 },
    { title: "Sodium atom structure", subject: "Chemistry", mastery: 74, points: 30 },
    { title: "Momentum in collisions", subject: "Physics", mastery: 52, points: 20 }
  ],
  recommendations: [
    "Trace blood from the right atrium to the lungs",
    "Compare sodium and lithium valence electrons",
    "Explain energy transfer in Newton's cradle"
  ],
  mastery: demoMemory.mastery,
  leaderboard: [
    { name: "Megan", points: 25420 },
    { name: "Thaddeus", points: 23430 },
    { name: "Jiayi", points: 21980 }
  ],
  demoMode: true
};
