"use client";

import { useEffect, useMemo, useState } from "react";

interface EventRow {
  id: number;
  ts: number;
  kind: string;
  taskId?: string;
  providerId?: string;
  payload: Record<string, unknown>;
}

interface CalibrationRow {
  providerId: string;
  capability: string;
  successAlpha: number;
  successBeta: number;
  nObservations: number;
}

interface OutcomeRow {
  taskId: string;
  providerId: string;
  passed: boolean;
  realizedCostUsdc: string;
  realizedLatencyMs: number;
}

interface ProviderResultMetrics {
  providerId: string;
  samples: number;
  avgResultPerUsdc: number;
  avgResultPerSecond: number;
}

function aggregateResultMetrics(events: EventRow[]): ProviderResultMetrics[] {
  const byProvider = new Map<
    string,
    { usdc: number[]; perSecond: number[] }
  >();

  for (const e of events) {
    if (e.kind !== "outcome" || !e.providerId) continue;
    const payload = e.payload as {
      resultPerUsdc?: number;
      resultPerSecond?: number;
    };
    if (
      typeof payload.resultPerUsdc !== "number" &&
      typeof payload.resultPerSecond !== "number"
    ) {
      continue;
    }
    const bucket = byProvider.get(e.providerId) ?? { usdc: [], perSecond: [] };
    if (typeof payload.resultPerUsdc === "number") {
      bucket.usdc.push(payload.resultPerUsdc);
    }
    if (typeof payload.resultPerSecond === "number") {
      bucket.perSecond.push(payload.resultPerSecond);
    }
    byProvider.set(e.providerId, bucket);
  }

  return [...byProvider.entries()].map(([providerId, bucket]) => ({
    providerId,
    samples: Math.max(bucket.usdc.length, bucket.perSecond.length),
    avgResultPerUsdc:
      bucket.usdc.length > 0
        ? bucket.usdc.reduce((s, v) => s + v, 0) / bucket.usdc.length
        : 0,
    avgResultPerSecond:
      bucket.perSecond.length > 0
        ? bucket.perSecond.reduce((s, v) => s + v, 0) / bucket.perSecond.length
        : 0,
  }));
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [calibrations, setCalibrations] = useState<CalibrationRow[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [status, setStatus] = useState<Record<string, unknown>>({});
  const [calibrationOn, setCalibrationOn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [ev, met, st] = await Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/metrics").then((r) => r.json()),
        fetch("/api/status").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setEvents(ev.events ?? []);
      setCalibrations(met.calibrations ?? []);
      setOutcomes(met.outcomes ?? []);
      setStatus(st);
    }

    void refresh();
    const id = setInterval(() => void refresh(), 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const slashes = events.filter((e) => e.kind === "slash");
  const clearings = events.filter((e) => e.kind === "clearing");
  const latestClearing = clearings[0];
  const shadowPrices =
    (latestClearing?.payload as { shadowPricesUsdc?: Record<string, string> })
      ?.shadowPricesUsdc ?? null;

  const resultMetrics = useMemo(
    () => aggregateResultMetrics(events),
    [events],
  );

  const lemonShare = useMemo(() => {
    const outcomesWithRole = events.filter(
      (e) => e.kind === "outcome" && e.payload?.role,
    );
    if (outcomesWithRole.length === 0) return null;
    const lemonWins = outcomesWithRole.filter(
      (e) => (e.payload as { role?: string }).role === "lemon",
    ).length;
    return lemonWins / outcomesWithRole.length;
  }, [events]);

  const headlineResultPerUsdc = useMemo(() => {
    if (resultMetrics.length === 0) return 0;
    const total = resultMetrics.reduce((s, m) => s + m.avgResultPerUsdc, 0);
    return total / resultMetrics.length;
  }, [resultMetrics]);

  const volume = outcomes.reduce(
    (s, o) => s + Number(o.realizedCostUsdc),
    0,
  );

  const card: React.CSSProperties = {
    background: "#141b24",
    border: "1px solid #243041",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  };

  const toggleBtn = (on: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #243041",
    background: on ? "#1e4d3a" : "#141b24",
    color: on ? "#7dffb8" : "#8aa0b5",
    cursor: "pointer",
    fontWeight: on ? 600 : 400,
  });

  return (
    <main>
      <h1>Trapeza Dashboard</h1>
      <p style={{ color: "#8aa0b5" }}>
        Calibration-aware broker / clearinghouse on Arc + Circle
      </p>

      {events.length === 0 && (
        <section
          style={{
            ...card,
            borderColor: "#3d5a4a",
            background: "#152018",
          }}
        >
          <strong>No market data yet.</strong> Run{" "}
          <code>npm run sim</code> from the repo root — it writes to the same
          SQLite database this dashboard reads (
          <code>~/.trapeza/trapeza.db</code> by default). Override with{" "}
          <code>TRAPEZA_DB_PATH</code> on both sim and dashboard if needed.
        </section>
      )}

      <section style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
        <h2 style={{ margin: 0 }}>CALIBRATION</h2>
        <button
          type="button"
          style={toggleBtn(calibrationOn)}
          onClick={() => setCalibrationOn(true)}
        >
          ON
        </button>
        <button
          type="button"
          style={toggleBtn(!calibrationOn)}
          onClick={() => setCalibrationOn(false)}
        >
          OFF
        </button>
        <span style={{ color: "#8aa0b5", fontSize: 13 }}>
          Display mode: {calibrationOn ? "routing uses calibration posteriors" : "routing uses neutral priors"}.
          Authoritative switch: run sim with{" "}
          <code>TRAPEZA_CALIBRATION=off</code> to re-seed OFF data.
        </span>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={card}>
          <h2>Status</h2>
          <pre style={{ fontSize: 12 }}>{JSON.stringify(status, null, 2)}</pre>
        </section>

        <section style={card}>
          <h2>Live headline</h2>
          <p>
            Avg result / USDC: <strong>{headlineResultPerUsdc.toFixed(4)}</strong>
          </p>
          <p>
            Lemon win share:{" "}
            <strong>
              {lemonShare === null
                ? "— (run showcase)"
                : `${(lemonShare * 100).toFixed(1)}%`}
            </strong>
          </p>
          <p style={{ color: "#8aa0b5", fontSize: 13 }}>
            Auto-refreshes every 2s. Lower lemon share under calibration ON is
            the demo win.
          </p>
        </section>

        <section style={card}>
          <h2>Volume</h2>
          <p>
            Cumulative settled USDC: <strong>{volume.toFixed(4)}</strong>
          </p>
          <p>
            Outcomes recorded: <strong>{outcomes.length}</strong>
          </p>
        </section>

        <section style={card}>
          <h2>Slash feed</h2>
          {slashes.length === 0 ? (
            <p style={{ color: "#8aa0b5" }}>No slashes yet</p>
          ) : (
            <ul>
              {slashes.slice(0, 10).map((s) => (
                <li key={s.id}>
                  {s.providerId} — task {s.taskId}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={card}>
          <h2>CP-SAT vs greedy bake-off</h2>
          {clearings.length === 0 ? (
            <p style={{ color: "#8aa0b5" }}>
              No clearings yet — run sim or MCP submit_graph
            </p>
          ) : (
            <ul>
              {clearings.slice(0, 10).map((c) => (
                <li key={c.id}>
                  solver=
                  {(c.payload as { solver?: string }).solver ?? "?"} obj=
                  {(c.payload as { objectiveValue?: number }).objectiveValue ??
                    "?"}
                  {(c.payload as { degraded?: boolean }).degraded
                    ? " (degraded)"
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={card}>
          <h2>Shadow prices (latest clearing)</h2>
          {!shadowPrices ? (
            <p style={{ color: "#8aa0b5" }}>
              No shadow prices yet — run submit_graph or sim graph iteration
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #243041",
                  }}
                >
                  <th>Constraint</th>
                  <th>Shadow price (USDC)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(shadowPrices).map(([key, value]) => (
                  <tr
                    key={key}
                    style={{ borderBottom: "1px solid #1a2430" }}
                  >
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={card}>
          <h2>Result / USDC &amp; result / second</h2>
          {resultMetrics.length === 0 ? (
            <p style={{ color: "#8aa0b5" }}>
              No per-outcome metrics yet — run sim loop
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #243041",
                  }}
                >
                  <th>Provider</th>
                  <th>Samples</th>
                  <th>Avg result/USDC</th>
                  <th>Avg result/s</th>
                </tr>
              </thead>
              <tbody>
                {resultMetrics.map((m) => (
                  <tr
                    key={m.providerId}
                    style={{ borderBottom: "1px solid #1a2430" }}
                  >
                    <td>{m.providerId}</td>
                    <td>{m.samples}</td>
                    <td>{m.avgResultPerUsdc.toFixed(4)}</td>
                    <td>{m.avgResultPerSecond.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section
          style={{
            ...card,
            gridColumn: "1 / -1",
            opacity: calibrationOn ? 1 : 0.55,
          }}
        >
          <h2>
            Calibration curves (Beta posterior mean)
            {!calibrationOn && (
              <span style={{ color: "#8aa0b5", fontSize: 13, marginLeft: 8 }}>
                — muted (display OFF; re-run sim to compare OFF ledger)
              </span>
            )}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ textAlign: "left", borderBottom: "1px solid #243041" }}
              >
                <th>Provider</th>
                <th>Capability</th>
                <th>p̂ success</th>
                <th>n</th>
              </tr>
            </thead>
            <tbody>
              {calibrations.map((c) => (
                <tr
                  key={`${c.providerId}-${c.capability}`}
                  style={{ borderBottom: "1px solid #1a2430" }}
                >
                  <td>{c.providerId}</td>
                  <td>{c.capability}</td>
                  <td>
                    {(
                      c.successAlpha /
                      (c.successAlpha + c.successBeta)
                    ).toFixed(3)}
                  </td>
                  <td>{c.nObservations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ ...card, gridColumn: "1 / -1" }}>
          <h2>Recent events (tx graph feed)</h2>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{ textAlign: "left", borderBottom: "1px solid #243041" }}
              >
                <th>Kind</th>
                <th>Provider</th>
                <th>Task</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 25).map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #1a2430" }}>
                  <td>{e.kind}</td>
                  <td>{e.providerId ?? "—"}</td>
                  <td>{e.taskId ?? "—"}</td>
                  <td
                    style={{
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {JSON.stringify(e.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
