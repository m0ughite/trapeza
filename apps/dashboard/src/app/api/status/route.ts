import { NextResponse } from "next/server";
import { solverHealthy } from "@trapeza/clearinghouse";
import { dbPath } from "@/lib/db";

export async function GET() {
  const solver = await solverHealthy();
  return NextResponse.json({
    solver,
    db: dbPath(),
    mode: process.env.TRAPEZA_MODE ?? "mock",
    calibration: process.env.TRAPEZA_CALIBRATION ?? "on",
  });
}
