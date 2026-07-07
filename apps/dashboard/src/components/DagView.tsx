import { useMemo } from "react";
import type { AllocationView, GraphView } from "../types/contract";

const NODE_W = 158;
const NODE_H = 58;
const GAP_X = 62;
const GAP_Y = 22;
const PAD = 26;

/** Longest-path layering so edges always point left→right. */
function layout(graph: GraphView) {
  const incoming = new Map<string, number>();
  const succ = new Map<string, string[]>();
  for (const n of graph.nodes) {
    incoming.set(n.nodeId, 0);
    succ.set(n.nodeId, []);
  }
  for (const e of graph.edges) {
    succ.get(e.from)!.push(e.to);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  const layer = new Map<string, number>();
  const indeg = new Map(incoming);
  const queue = graph.nodes.filter((n) => (incoming.get(n.nodeId) ?? 0) === 0).map((n) => n.nodeId);
  for (const id of queue) layer.set(id, 0);
  const q = [...queue];
  while (q.length) {
    const cur = q.shift()!;
    for (const nx of succ.get(cur) ?? []) {
      layer.set(nx, Math.max(layer.get(nx) ?? 0, (layer.get(cur) ?? 0) + 1));
      indeg.set(nx, (indeg.get(nx) ?? 0) - 1);
      if ((indeg.get(nx) ?? 0) === 0) q.push(nx);
    }
  }
  const byLayer = new Map<number, string[]>();
  for (const n of graph.nodes) {
    const l = layer.get(n.nodeId) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(n.nodeId);
  }
  const pos = new Map<string, { x: number; y: number }>();
  for (const [l, ids] of byLayer) {
    ids.forEach((id, i) => {
      pos.set(id, { x: PAD + l * (NODE_W + GAP_X), y: PAD + i * (NODE_H + GAP_Y) });
    });
  }
  const maxLayer = Math.max(0, ...[...byLayer.keys()]);
  const maxRows = Math.max(1, ...[...byLayer.values()].map((v) => v.length));
  return {
    pos,
    width: PAD * 2 + (maxLayer + 1) * NODE_W + maxLayer * GAP_X,
    height: PAD * 2 + maxRows * NODE_H + (maxRows - 1) * GAP_Y,
  };
}

export function DagView(props: { graph: GraphView; allocations: AllocationView[] }) {
  const { graph, allocations } = props;
  const { pos, width, height } = useMemo(() => layout(graph), [graph]);
  const chosen = useMemo(
    () => new Map(allocations.map((a) => [a.nodeId, a.providerId])),
    [allocations],
  );

  return (
    <div className="dag-wrap">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#3c5069" />
          </marker>
        </defs>
        {graph.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + NODE_W;
          const y1 = a.y + NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={i}
              className="dag-edge"
              markerEnd="url(#arrow)"
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 8} ${y2}`}
            />
          );
        })}
        {graph.nodes.map((n) => {
          const p = pos.get(n.nodeId)!;
          const prov = chosen.get(n.nodeId);
          const cls = ["dag-node", prov ? "chosen" : "", n.bottleneck ? "bottleneck" : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <g key={n.nodeId} className={cls} transform={`translate(${p.x},${p.y})`}>
              <rect width={NODE_W} height={NODE_H} rx={10} />
              <text className="n-title" x={12} y={20}>
                {n.nodeId}
                {n.bottleneck ? "  ⚑" : ""}
              </text>
              <text className="n-sub" x={12} y={35}>
                {n.capability} · {n.valueUsdc}
              </text>
              <text className="n-prov" x={12} y={49}>
                {prov ?? "—"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
