import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/butterbase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") ?? "demo-student";
  const dashboard = await getDashboardData(studentId);

  return NextResponse.json(dashboard);
}
