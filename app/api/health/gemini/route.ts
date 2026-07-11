import { NextResponse } from "next/server";
import { MODEL, generateGeminiText, googleErrorPayload } from "@/lib/gemini";

export async function GET() {
  try {
    const text = await generateGeminiText("Hello");
    return NextResponse.json({
      ok: true,
      model: MODEL,
      response: text
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        model: MODEL,
        error: googleErrorPayload(error)
      },
      { status: 500 }
    );
  }
}
