/** Shared live-mode env checks for ArcTask dashboard API routes. */

export function keyConfigured(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && !v.startsWith("0xYOUR"));
}

export interface ArcTaskEnvChecks {
  trapezaLiveOnchain: boolean;
  arctaskLiveMode: boolean;
  buyerKey: boolean;
  validatorKey: boolean;
  registryAddress?: string;
  escrowAddress?: string;
  arctaskApiBase: string;
}

export function readArcTaskEnvChecks(): ArcTaskEnvChecks {
  return {
    trapezaLiveOnchain: process.env.TRAPEZA_LIVE_ONCHAIN === "1",
    arctaskLiveMode: process.env.ARCTASK_SIMULATED === "false",
    buyerKey: keyConfigured("BUYER_PRIVATE_KEY"),
    validatorKey: keyConfigured("VALIDATOR_PRIVATE_KEY"),
    registryAddress: process.env.ARCTASK_REGISTRY_ADDRESS,
    escrowAddress: process.env.ARCTASK_ESCROW_ADDRESS,
    arctaskApiBase: process.env.ARCTASK_API_BASE ?? "https://arctask.xyz",
  };
}

export function liveReadyFromChecks(checks: ArcTaskEnvChecks): boolean {
  return (
    checks.trapezaLiveOnchain &&
    checks.arctaskLiveMode &&
    checks.buyerKey &&
    checks.validatorKey &&
    Boolean(checks.registryAddress) &&
    Boolean(checks.escrowAddress)
  );
}

export function liveEnabled(): boolean {
  return liveReadyFromChecks(readArcTaskEnvChecks());
}

export function liveMissingReasons(checks: ArcTaskEnvChecks): string[] {
  const missing: string[] = [];
  if (!checks.trapezaLiveOnchain) missing.push("TRAPEZA_LIVE_ONCHAIN=1");
  if (!checks.arctaskLiveMode) missing.push("ARCTASK_SIMULATED=false");
  if (!checks.buyerKey) missing.push("BUYER_PRIVATE_KEY");
  if (!checks.validatorKey) missing.push("VALIDATOR_PRIVATE_KEY");
  if (!checks.registryAddress) missing.push("ARCTASK_REGISTRY_ADDRESS");
  if (!checks.escrowAddress) missing.push("ARCTASK_ESCROW_ADDRESS");
  return missing;
}

const PROBE_MS = 4_000;

export async function probeArcTaskApi(base: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
    const res = await fetch(`${base.replace(/\/$/, "")}/api/worker/status`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

export async function probeWorkerStatus(
  base: string,
): Promise<{ reachable: boolean; live: boolean; executor?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
    const res = await fetch(`${base.replace(/\/$/, "")}/api/worker/status`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return { reachable: res.status === 404, live: false };
    const body = (await res.json()) as {
      live?: boolean;
      status?: { executor?: string; mode?: string };
    };
    return {
      reachable: true,
      live: Boolean(body.live),
      executor: body.status?.executor,
    };
  } catch {
    return { reachable: false, live: false };
  }
}
