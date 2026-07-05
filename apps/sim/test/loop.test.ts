import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assemble } from "@trapeza/runtime";
import {
  lemonWinShare,
  runSingleTaskLoop,
  seedProviders,
} from "../src/loop.js";

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "trapeza-sim-"));
  return { path: join(dir, "sim.db"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("seeded loop", () => {
  it("is deterministic for the same seed", async () => {
    const { path, cleanup } = tempDb();
    const rt1 = assemble({ mode: "mock", dbPath: path });
    const roster1 = await seedProviders(rt1);
    const a = await runSingleTaskLoop(rt1, roster1, { seed: 99, iterations: 8, useCalibration: true });
    rt1.store.close();

    const rt2 = assemble({ mode: "mock", dbPath: path });
    const roster2 = await seedProviders(rt2);
    const b = await runSingleTaskLoop(rt2, roster2, { seed: 99, iterations: 8, useCalibration: true });
    rt2.store.close();
    cleanup();

    expect(a.allocations.map((x) => x.providerId)).toEqual(
      b.allocations.map((x) => x.providerId),
    );
  });

  it("CALIBRATION ON reduces lemon win share vs OFF", async () => {
    const { path: pOn, cleanup: cOn } = tempDb();
    const rtOn = assemble({ mode: "mock", dbPath: pOn });
    const rosterOn = await seedProviders(rtOn);
    const on = await runSingleTaskLoop(rtOn, rosterOn, {
      seed: 7,
      iterations: 30,
      useCalibration: true,
    });
    rtOn.store.close();
    cOn();

    const { path: pOff, cleanup: cOff } = tempDb();
    const rtOff = assemble({ mode: "mock", dbPath: pOff });
    const rosterOff = await seedProviders(rtOff);
    const off = await runSingleTaskLoop(rtOff, rosterOff, {
      seed: 7,
      iterations: 30,
      useCalibration: false,
    });
    rtOff.store.close();
    cOff();

    expect(lemonWinShare(on)).toBeLessThan(lemonWinShare(off));
  });
});
