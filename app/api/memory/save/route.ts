import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  return NextResponse.json({
    saved: true,
    demoMode: isDemoMode(),
    storedFields: Object.keys(payload).filter((key) => !["email", "name", "password"].includes(key.toLowerCase()))
  });
}
