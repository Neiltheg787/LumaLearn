import { NextResponse } from "next/server";
import { demoAnalysis } from "@/lib/demo-data";
import { hasGemini } from "@/lib/env";
import { saveScan } from "@/lib/butterbase";
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

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...(image instanceof File
              ? [
                  {
                    inline_data: {
                      mime_type: image.type || "image/png",
                      data: Buffer.from(await image.arrayBuffer()).toString("base64")
                    }
                  }
                ]
              : [])
          ]
        }
      ],
      generationConfig: { response_mime_type: "application/json" }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      return NextResponse.json({ ...demoAnalysis, demoMode: true, warning: "Gemini unavailable; using demo analysis." });
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = analysisSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ ...demoAnalysis, demoMode: true, warning: "Invalid Gemini JSON; using demo analysis." });
    }

    const result: PageAnalysis = { ...parsed.data, demoMode: false } as PageAnalysis;
    await saveScan({ studentId, analysis: result, imageName: image instanceof File ? image.name : undefined });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ...demoAnalysis, demoMode: true, warning: "Analysis failed; using demo analysis." });
  }
}
