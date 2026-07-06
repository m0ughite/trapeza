import { useState, type ReactNode } from "react";

export function Panel(props: {
  title: string;
  hint?: string;
  sub?: ReactNode;
  headline?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`panel${props.headline ? " headline" : ""}`}>
      <div className="panel-head">
        <h3>{props.title}</h3>
        {props.right ?? (props.hint ? <span className="hint">{props.hint}</span> : null)}
      </div>
      {props.sub ? <div className="sub">{props.sub}</div> : null}
      {props.children}
    </div>
  );
}

export type Tone = "mint" | "amber" | "red" | "violet" | "blue" | "default";

export function Badge(props: { tone?: Tone; children: ReactNode }) {
  const tone = props.tone && props.tone !== "default" ? ` ${props.tone}` : "";
  return <span className={`badge${tone}`}>{props.children}</span>;
}

export function Stat(props: {
  k: string;
  v: ReactNode;
  tone?: "mint" | "violet";
  small?: boolean;
  note?: ReactNode;
}) {
  const cls = ["v", props.tone ?? "", props.small ? "small" : ""].filter(Boolean).join(" ");
  return (
    <div className="stat">
      <div className="k">{props.k}</div>
      <div className={cls}>{props.v}</div>
      {props.note ? <div className="note">{props.note}</div> : null}
    </div>
  );
}

export function Bar(props: { value: number; max?: number; tone?: Tone }) {
  const max = props.max ?? 1;
  const w = Math.max(0, Math.min(100, (props.value / max) * 100));
  const tone = props.tone && props.tone !== "default" ? props.tone : "mint";
  return (
    <div className="bar-track">
      <div className={`bar-fill ${tone}`} style={{ width: `${w}%` }} />
    </div>
  );
}

/**
 * Progressive disclosure: a "?" affordance that reveals a short explanation on
 * hover / focus / tap. Keeps the default view skimmable; detail on demand.
 */
export function Tooltip(props: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tip"
      tabIndex={0}
      role="button"
      aria-label="More info"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
    >
      <span className="tip-dot" aria-hidden>
        {props.label ?? "?"}
      </span>
      {open ? <span className="tip-body">{props.children}</span> : null}
    </span>
  );
}

/**
 * Progressive disclosure: a collapsible "How this works / Details" block. Closed
 * by default so the primary view stays confident and uncluttered.
 */
export function Collapsible(props: { label?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return (
    <div className={`disclose${open ? " open" : ""}`}>
      <button className="disclose-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="disclose-caret" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        {props.label ?? "How this works"}
      </button>
      {open ? <div className="disclose-body">{props.children}</div> : null}
    </div>
  );
}

/**
 * A consistent section header: eyebrow label, big title, one-sentence "why this
 * matters", and an optional right slot for controls (toggles, badges).
 */
export function SectionHeader(props: {
  eyebrow?: string;
  title: ReactNode;
  why?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div className="section-head-main">
        {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
        <h2>{props.title}</h2>
        {props.why ? <p className="why">{props.why}</p> : null}
      </div>
      {props.right ? <div className="section-head-right">{props.right}</div> : null}
    </div>
  );
}
