import { NextResponse } from "next/server";
import { openStore } from "@/lib/db";

export async function GET() {
  const store = openStore();
  try {
    const events = await store.listEvents(200);
    return NextResponse.json({ events });
  } finally {
    store.close();
  }
}
