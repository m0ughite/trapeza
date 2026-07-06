import { useMemo, useState } from "react";
import type { FixtureManifest, ManifestRun } from "../types/contract";
import { Badge } from "./ui";

function statusTone(status: ManifestRun["status"]): "mint" | "amber" | "red" {
  if (status === "cleared") return "mint";
  if (status === "degraded") return "amber";
  return "red";
}

export function ScenarioExplorer(props: {
  manifest: FixtureManifest;
  activeId: string;
  onPick: (id: string) => void;
}) {
  const [tag, setTag] = useState<string | null>(null);
  const allTags = useMemo(() => {
    const t = new Set<string>();
    for (const r of props.manifest.runs) for (const x of r.tags) t.add(x);
    return [...t].sort();
  }, [props.manifest.runs]);

  const filtered = useMemo(() => {
    if (!tag) return props.manifest.runs;
    return props.manifest.runs.filter((r) => r.tags.includes(tag));
  }, [props.manifest.runs, tag]);

  return (
    <div className="explorer">
      <div className="explorer-intro">
        <div className="eyebrow">Explore scenarios</div>
        <h2>See what Trapeza handles</h2>
        <p>
          Each card is a real engine run: a task graph, providers, clearing, calibration contrast,
          and step-by-step trace. Pick one to drive every section below.
        </p>
      </div>

      <div className="tag-filters">
        <button
          type="button"
          className={`tag-chip${tag === null ? " active" : ""}`}
          onClick={() => setTag(null)}
        >
          all
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            className={`tag-chip${tag === t ? " active" : ""}`}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="explorer-grid">
        {filtered.map((r) => (
          <button
            key={r.runId}
            type="button"
            className={`explorer-card${r.runId === props.activeId ? " active" : ""}`}
            onClick={() => props.onPick(r.runId)}
          >
            <div className="ec-top">
              <span className="ec-title">{r.label}</span>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
            </div>
            <p className="ec-proves">{r.proves}</p>
            <p className="ec-desc">{r.description}</p>
            <div className="ec-tags">
              {r.tags.map((t) => (
                <span key={t} className="ec-tag">
                  {t}
                </span>
              ))}
            </div>
            <div className="ec-meta">
              <span>{r.nodeCount} nodes</span>
              <span>·</span>
              <span>{r.providerCount} providers</span>
              <span>·</span>
              <span className="ec-headline">{r.headline}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
