import { NextResponse } from "next/server";
import { createPartFromBase64 } from "@google/genai";
import { demoAnalysis } from "@/lib/demo-data";
import { hasGemini } from "@/lib/env";
import { saveScan } from "@/lib/butterbase";
import { MODEL, generateGeminiJson, googleErrorPayload } from "@/lib/gemini";
import { analysisSchema } from "@/lib/validators";
import type { PageAnalysis } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const studentId = String(formData.get("studentId") ?? "demo-student");

    if (!hasGemini()) {
      await saveScan({ studentId, analysis: demoAnalysis, imageName: image instanceof File ? image.name : undefined });
      return NextResponse.json({ ...demoAnalysis, demoMode: true });
    }

    const prompt = [
      "Analyze this STEM textbook page.",
      "Return strict JSON with subject, topic, learningObjective, modelId, confidence, keyConcepts, openingQuestion.",
      "modelId must be one of: heart, bunsen_burner, sodium, lithium, newtons_cradle, periodic_table, sodium_chloride, helium, carbon.",
      "For heart or circulatory content, choose modelId heart."
    ].join(" ");

    const contents =
      image instanceof File
        ? [
            prompt,
            createPartFromBase64(
              Buffer.from(await image.arrayBuffer()).toString("base64"),
              image.type || "image/png"
            )
          ]
        : prompt;

    const text = await generateGeminiJson(contents);
    const parsed = analysisSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ ...demoAnalysis, demoMode: true, warning: "Invalid Gemini JSON; using demo analysis." });
    }

    const result: PageAnalysis = { ...parsed.data, demoMode: false } as PageAnalysis;
    await saveScan({ studentId, analysis: result, imageName: image instanceof File ? image.name : undefined });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ...demoAnalysis,
      demoMode: true,
      warning: `Gemini analysis failed for ${MODEL}; using demo analysis.`,
      googleError: googleErrorPayload(error)
    });
  }
}
