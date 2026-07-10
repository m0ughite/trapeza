import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { RUNS } from "../fixtures";
import type { DemoRun } from "../types/contract";

/**
 * Shared scenario selection. The chosen run is the single source of truth for
 * every page, persisted in the URL as `?run=<runId>` so it survives navigation,
 * deep-linking and refresh. Pages read it via `useScenario()`.
 */
interface ScenarioValue {
  runs: DemoRun[];
  run: DemoRun;
  activeId: string;
  setActiveId: (id: string) => void;
}

const ScenarioContext = createContext<ScenarioValue | null>(null);

const DEFAULT_ID = RUNS[0]!.meta.runId;

function isValidId(id: string | null): id is string {
  return id != null && RUNS.some((r) => r.meta.runId === id);
}

export function ScenarioProvider(props: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("run");
  const activeId = isValidId(param) ? param : DEFAULT_ID;

  // Backfill / correct the URL so it always carries a valid `?run=`.
  useEffect(() => {
    if (searchParams.get("run") === activeId) return;
    const next = new URLSearchParams(searchParams);
    next.set("run", activeId);
    setSearchParams(next, { replace: true });
  }, [activeId, searchParams, setSearchParams]);

  const setActiveId = (id: string) => {
    if (!isValidId(id)) return;
    const next = new URLSearchParams(searchParams);
    next.set("run", id);
    setSearchParams(next, { replace: false });
  };

  const run = useMemo(
    () => RUNS.find((r) => r.meta.runId === activeId) ?? RUNS[0]!,
    [activeId],
  );

  const value = useMemo<ScenarioValue>(
    () => ({ runs: RUNS, run, activeId, setActiveId }),
    // setActiveId is stable enough (derived from searchParams); include run/activeId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, activeId, searchParams],
  );

  return <ScenarioContext.Provider value={value}>{props.children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error("useScenario must be used within a ScenarioProvider");
  return ctx;
}
