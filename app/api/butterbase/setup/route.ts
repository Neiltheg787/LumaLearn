import { NextResponse } from "next/server";
import { BUTTERBASE_RESOURCES, BUTTERBASE_TABLES, ensureButterbaseCollections } from "@/lib/butterbase";

export async function POST() {
  const result = await ensureButterbaseCollections();

  return NextResponse.json({
    ...result,
    tables: BUTTERBASE_TABLES,
    resources: BUTTERBASE_RESOURCES
  });
}
