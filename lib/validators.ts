import { z } from "zod";
import { MODEL_IDS } from "./models";

export const analysisSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  learningObjective: z.string(),
  modelId: z.enum(MODEL_IDS as [string, ...string[]]),
  confidence: z.number().min(0).max(1),
  keyConcepts: z.array(z.string()).min(1),
  openingQuestion: z.string()
});

export const tutorSchema = z.object({
  message: z.string(),
  question: z.string(),
  hint: z.string().optional(),
  evaluation: z.enum(["correct", "partial", "misconception", "not_answered"]).optional(),
  misconception: z.string().optional(),
  nextAction: z.enum(["ask", "hint", "complete"])
});
