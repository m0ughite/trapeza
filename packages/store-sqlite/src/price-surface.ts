import type { PriceSurface } from "@trapeza/core";

export type PriceSurfaceKind = "fixed" | "linear";

export interface PriceSurfaceParams {
  base: string;
  perLoad?: string;
  perComplexity?: string;
}

export function encodePriceSurface(surface: PriceSurface): {
  kind: PriceSurfaceKind;
  params: PriceSurfaceParams;
} {
  const probe0 = surface(0, 0);
  const probe1 = surface(1, 0);
  const probe2 = surface(0, 1);
  const perLoad = (Number(probe1) - Number(probe0)).toFixed(6);
  const perComplexity = (Number(probe2) - Number(probe0)).toFixed(6);
  if (perLoad === "0.000000" && perComplexity === "0.000000") {
    return { kind: "fixed", params: { base: probe0 } };
  }
  return {
    kind: "linear",
    params: { base: probe0, perLoad, perComplexity },
  };
}

export function decodePriceSurface(
  kind: PriceSurfaceKind,
  params: PriceSurfaceParams,
): PriceSurface {
  if (kind === "fixed") {
    const base = params.base;
    return () => base;
  }
  const base = Number(params.base);
  const perLoad = Number(params.perLoad ?? "0");
  const perComplexity = Number(params.perComplexity ?? "0");
  return (load: number, complexity: number) =>
    (base + perLoad * load + perComplexity * complexity).toFixed(6);
}
