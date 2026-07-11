import { NextResponse } from "next/server";
import { demoAnalysis } from "@/lib/demo-data";
import { hasOpenAI } from "@/lib/env";
import { saveScan } from "@/lib/butterbase";
import { MODEL, generateOpenAIJson, openAIErrorPayload } from "@/lib/openai";
import { analysisSchema } from "@/lib/validators";
import type { PageAnalysis } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const studentId = String(formData.get("studentId") ?? "demo-student");

    if (!hasOpenAI()) {
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
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                {
                  type: "input_image",
                  image_url: `data:${image.type || "image/png"};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`
                }
              ]
            }
          ]
        : prompt;

    const text = await generateOpenAIJson(contents);
    const parsed = analysisSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ ...demoAnalysis, demoMode: true, warning: "Invalid OpenAI JSON; using demo analysis." });
    }

    const result: PageAnalysis = { ...parsed.data, demoMode: false } as PageAnalysis;
    await saveScan({ studentId, analysis: result, imageName: image instanceof File ? image.name : undefined });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ...demoAnalysis,
      demoMode: true,
      warning: `OpenAI analysis failed for ${MODEL}; using demo analysis.`,
      openAIError: openAIErrorPayload(error)
    });
  }
}
