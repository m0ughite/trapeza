import { NextResponse } from "next/server";
import { openStore } from "@/lib/db";

export async function GET() {
  const store = openStore();
  try {
    const outcomes = await store.listOutcomes();
    const calibrations = await store.listAllCalibrations();
    const providers = await store.listAllProviders();
    return NextResponse.json({ outcomes, calibrations, providers });
  } finally {
    store.close();
  }
}
