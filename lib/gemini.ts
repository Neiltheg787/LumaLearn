import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./env";

export const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

let loggedModel = false;

export function logGeminiModel() {
  if (loggedModel) return;
  loggedModel = true;
  console.info(`[LumaLearn] Gemini model selected: ${MODEL}`);
}

export function getGeminiClient() {
  logGeminiModel();
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateGeminiText(contents: string) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents
  });
  return response.text ?? "";
}

export async function generateGeminiJson(contents: unknown) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      responseMimeType: "application/json"
    }
  });
  return response.text ?? "{}";
}

export function googleErrorPayload(error: unknown) {
  if (error instanceof Error) {
    const extra = Object.fromEntries(
      Object.getOwnPropertyNames(error)
        .filter((key) => !["name", "message", "stack"].includes(key))
        .map((key) => [key, (error as unknown as Record<string, unknown>)[key]])
    );

    return {
      name: error.name,
      message: error.message,
      ...extra,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack
    };
  }

  return error;
}

logGeminiModel();
