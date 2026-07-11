import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

let loggedModel = false;

export function logOpenAIModel() {
  if (loggedModel) return;
  loggedModel = true;
  console.info(`[LumaLearn] OpenAI model selected: ${MODEL}`);
}

export function getOpenAIClient() {
  logOpenAIModel();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateOpenAIText(input: string | unknown[]) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: MODEL,
    input: input as never
  });
  return response.output_text ?? "";
}

export async function generateOpenAIJson(input: string | unknown[]) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: MODEL,
    input: input as never,
    text: {
      format: {
        type: "json_object"
      }
    }
  });
  return response.output_text ?? "{}";
}

export function openAIErrorPayload(error: unknown) {
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

logOpenAIModel();
