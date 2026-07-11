import { NextResponse } from "next/server";
import { demoMemory } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoMemory);
  }

  return NextResponse.json({
    ...demoMemory,
    demoMode: true,
    warning: "EverOS adapter is ready for credentials; returning demo memory until configured."
  });
}
