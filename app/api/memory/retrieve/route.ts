import { NextResponse } from "next/server";
import { retrieveRelevantMemories } from "@/lib/everos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") ?? "demo-student";
  const query = url.searchParams.get("query") ?? "student learning profile";
  const memory = await retrieveRelevantMemories(studentId, query);

  return NextResponse.json(memory);
}
