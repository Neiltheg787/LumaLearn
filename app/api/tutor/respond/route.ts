import { NextResponse } from "next/server";
import { demoMemory } from "@/lib/demo-data";
import { hasGemini } from "@/lib/env";
import { retrieveRelevantMemories, memoryContextForGemini } from "@/lib/everos";
import { MODEL, generateGeminiJson } from "@/lib/gemini";
import { tutorSchema } from "@/lib/validators";
import type { StudentMemory, TutorResponse } from "@/lib/types";

function demoTutor(answer: string, hintRequested: boolean, topic = "Human Heart", selectedObject?: { label?: string; purpose?: string }): TutorResponse {
  const normalized = answer.toLowerCase();
  const selectedName = selectedObject?.label ?? topic;
  const selectedPurpose = selectedObject?.purpose;
  const isQuestion =
    normalized.includes("?") ||
    /^(what|why|how|where|when|which|can|could|show|explain|replay|watch)\b/.test(normalized.trim());

  if (topic.toLowerCase().includes("cradle")) {
    if (isQuestion && !hintRequested) {
      return {
        message: normalized.includes("last ball")
          ? "The last ball moves because the incoming ball sends a pulse of momentum and energy through the touching balls. The middle balls mostly transmit that impulse, so the far ball swings out."
          : `In the real Newton's cradle model, ${selectedName.toLowerCase()} helps you see momentum transfer through an almost-elastic collision.${selectedPurpose ? ` ${selectedPurpose}` : ""}`,
        question: "Try pulling one ball, then two. What pattern do you see on the far side?",
        hint: "Count how many balls leave compared with how many were released.",
        evaluation: "partial",
        nextAction: "ask",
        demoMode: true
      };
    }

    return {
      message: hintRequested
        ? "Watch the row during impact: the middle balls mostly transmit the impulse, while the far ball carries the motion out."
        : `In the Newton's cradle model, ${selectedName.toLowerCase()} shows conservation by passing momentum and energy through the collision sequence.${selectedPurpose ? ` ${selectedPurpose}` : ""}`,
      question: "If two balls are pulled back, how many should swing out on the opposite side?",
      hint: "Match the number of balls leaving to the number released.",
      evaluation: normalized.includes("two") || normalized.includes("2") ? "correct" : hintRequested ? "not_answered" : "partial",
      nextAction: normalized.includes("two") || normalized.includes("2") ? "complete" : "ask",
      demoMode: true
    };
  }

  if (topic.toLowerCase().includes("chemistry") || topic.toLowerCase().includes("lab")) {
    if (isQuestion && !hintRequested) {
      return {
        message: normalized.includes("flame")
          ? "Increasing the flame transfers heat into the beaker faster, so the liquid particles move faster. In the model, watch the heat column and steam overlay intensify."
          : `In this lab model, ${selectedName.toLowerCase()} is part of the heat-transfer story.${selectedPurpose ? ` ${selectedPurpose}` : ""}`,
        question: "What visual change would tell you the liquid gained more thermal energy?",
        hint: "Look for faster bubbling, more steam, or a color shift.",
        evaluation: "partial",
        nextAction: "ask",
        demoMode: true
      };
    }

    return {
      message: hintRequested
        ? "Use the flame as your visual clue: a larger flame transfers thermal energy into the beaker faster."
        : `In this lab, ${selectedName.toLowerCase()} helps show heat transfer and particle energy.${selectedPurpose ? ` ${selectedPurpose}` : ""}`,
      question: "What changes first when the flame size increases?",
      hint: "Look for faster bubbling, steam, or color change.",
      evaluation: normalized.includes("heat") || normalized.includes("temperature") || normalized.includes("boil") ? "correct" : hintRequested ? "not_answered" : "partial",
      nextAction: normalized.includes("heat") || normalized.includes("temperature") || normalized.includes("boil") ? "complete" : "ask",
      demoMode: true
    };
  }

  const hasRightAtrium = normalized.includes("right atrium") || normalized.includes("right atria");
  const mentionsVenaCava = normalized.includes("vena cava");
  const correct = hasRightAtrium || mentionsVenaCava;

  if (isQuestion && !hintRequested) {
    if (normalized.includes("right atrium")) {
      return {
        message: "The right atrium is the upper-right chamber of the heart. It receives deoxygenated blood returning from the body through the vena cava, then passes it through a valve into the right ventricle.",
        question: "After the right atrium, which chamber should the blue blood enter next?",
        hint: "Follow the blue flow downward into the pumping chamber.",
        evaluation: "partial",
        nextAction: "ask",
        demoMode: true
      };
    }

    if (normalized.includes("red") || normalized.includes("oxygen")) {
      return {
        message: "Blood appears red when hemoglobin is carrying oxygen. In this lesson, red flow means oxygen-rich blood returning from the lungs and leaving the left ventricle through the aorta.",
        question: "Which large vessel carries that red, oxygenated blood out to the body?",
        hint: "Look for the vessel leaving the left ventricle.",
        evaluation: "partial",
        nextAction: "ask",
        demoMode: true
      };
    }

    if (normalized.includes("replay") || normalized.includes("flow") || normalized.includes("watch")) {
      return {
        message: "Watch the blue path first: vena cava to right atrium, right ventricle, then pulmonary artery. Then watch the red path: pulmonary veins to left atrium, left ventricle, then aorta.",
        question: "Where does oxygenated blood leave the heart?",
        hint: "Follow the red path out of the left ventricle.",
        evaluation: "partial",
        nextAction: "ask",
        demoMode: true
      };
    }
  }

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

async function retrieveMemoryFast(studentId: string, query: string) {
  return Promise.race([
    retrieveRelevantMemories(studentId, query),
    new Promise<typeof demoMemory>((resolve) => {
      setTimeout(() => resolve({ ...demoMemory, studentId, demoMode: true }), 2500);
    })
  ]);
}

function parseGeminiJson(text: string) {
  const trimmed = text.trim();
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");
  const candidate = firstBrace >= 0 && lastBrace > firstBrace ? unfenced.slice(firstBrace, lastBrace + 1) : unfenced;
  return JSON.parse(candidate);
}

function fallbackResponse(
  answer: string,
  hintRequested: boolean,
  topic: string,
  selectedObject: { label?: string; purpose?: string } | undefined,
  memory: StudentMemory,
  warning: string
) {
  const demo = demoTutor(answer, hintRequested, topic, selectedObject);
  return NextResponse.json({
    ...demo,
    source: "fallback",
    warning,
    memoryUsed: !memory.demoMode,
    memorySummary: memory.recommendedNextLesson
  });
}

export async function POST(request: Request) {
  const {
    answer = "",
    hintRequested = false,
    topic = "Human Heart",
    studentId = "demo-student",
    analysis,
    selectedObject,
    conversation = [],
    mastery,
    animationState
  } = await request.json().catch(() => ({}));
  const memory = await retrieveMemoryFast(String(studentId), `${topic} ${String(answer)}`);

  if (!hasGemini()) {
    return fallbackResponse(String(answer), Boolean(hintRequested), String(topic), selectedObject, memory, "Gemini API key is not configured on the server.");
  }

  try {
    const prompt = [
      `You are the live Gemini tutor inside LumaLearn's interactive ${topic} workspace.`,
      "The student is learning through a visual model, not a text-only chat. Never answer generically when lesson context exists.",
      analysis ? `Textbook analysis: ${JSON.stringify(analysis)}` : "",
      selectedObject ? `Currently selected object: ${JSON.stringify(selectedObject)}` : "",
      animationState ? `Current animation/camera state: ${JSON.stringify(animationState)}` : "",
      typeof mastery === "number" ? `Current mastery score: ${mastery}` : "",
      Array.isArray(conversation) ? `Recent conversation: ${JSON.stringify(conversation).slice(0, 3000)}` : "",
      `Previous learning history from EverOS:\n${memoryContextForGemini(memory)}`,
      "Personalize the explanation based on the memory, but do not reveal private implementation details.",
      "Reference the selected object and current animation when answering.",
      "If the student asks what to watch, name the path, chamber, ball, flame, or liquid that should be highlighted.",
      "If the student asks a question, answer it directly first. Do not praise it as a correct quiz answer.",
      "Only evaluate as correct when the student is actually answering a prompt or making a claim.",
      "Evaluate the student answer or question. For open follow-up questions, use evaluation partial unless clearly correct.",
      "Return only strict JSON with these fields: message, question, hint, evaluation, misconception, nextAction.",
      "Allowed evaluation values: correct, partial, misconception, not_answered. Allowed nextAction values: ask, hint, complete.",
      `Student answer: ${String(answer)}`
    ].join("\n\n");
    const text = await Promise.race([
      generateGeminiJson(prompt),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Gemini tutor timed out.")), 8000))
    ]);
    const parsed = tutorSchema.safeParse(parseGeminiJson(text));
    if (!parsed.success) {
      return fallbackResponse(String(answer), Boolean(hintRequested), String(topic), selectedObject, memory, "Gemini returned an unexpected tutor shape.");
    }

    return NextResponse.json({
      ...parsed.data,
      demoMode: false,
      source: "gemini",
      model: MODEL,
      memoryUsed: !memory.demoMode,
      memorySummary: memory.recommendedNextLesson
    });
  } catch (error) {
    return fallbackResponse(
      String(answer),
      Boolean(hintRequested),
      String(topic),
      selectedObject,
      memory,
      `Gemini is unavailable for ${MODEL}. Check /api/health/gemini for the full Google error.`
    );
  }
}
