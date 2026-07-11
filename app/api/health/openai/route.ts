import { NextResponse } from "next/server";
import { MODEL, generateOpenAIText, openAIErrorPayload } from "@/lib/openai";

export async function GET() {
  const startedAt = Date.now();

  try {
    const response = await generateOpenAIText("Hello");
    return NextResponse.json({
      ok: true,
      model: MODEL,
      latencyMs: Date.now() - startedAt,
      response
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        model: MODEL,
        latencyMs: Date.now() - startedAt,
        error: openAIErrorPayload(error)
      },
      { status: 500 }
    );
  }
}
