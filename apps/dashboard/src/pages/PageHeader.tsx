import type { ReactNode } from "react";
import { SectionHeader } from "../components/ui";
import { PAGES } from "./pages";

/**
 * Standard page header driven by the shared IA config, so every page's title and
 * one-sentence intro stay consistent. `right` slot is for page-level controls.
 */
export function PageHeader(props: { path: string; right?: ReactNode }) {
  const def = PAGES.find((p) => p.path === props.path);
  if (!def) return null;
  return (
    <SectionHeader eyebrow={def.eyebrow} title={def.title} why={def.intro} right={props.right} />
  );
}
