import { NextResponse } from "next/server";
import { demoMemory } from "@/lib/demo-data";
import { retrieveRelevantMemories } from "@/lib/everos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") ?? "demo-student";
  const query = url.searchParams.get("query") ?? "student learning profile";
  const memory = await Promise.race([
    retrieveRelevantMemories(studentId, query),
    new Promise<typeof demoMemory>((resolve) => {
      setTimeout(() => resolve({ ...demoMemory, studentId, demoMode: true }), 2500);
    })
  ]);

  return NextResponse.json(memory);
}
