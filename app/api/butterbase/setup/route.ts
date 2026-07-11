import { NextResponse } from "next/server";
import { BUTTERBASE_COLLECTIONS, ensureButterbaseCollections } from "@/lib/butterbase";

export async function POST() {
  const result = await ensureButterbaseCollections();

  return NextResponse.json({
    ...result,
    collections: BUTTERBASE_COLLECTIONS
  });
}
