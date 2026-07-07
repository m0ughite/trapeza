/**
 * @trapeza/core — the forkable Trapeza primitive.
 *
 * Public surface: data models, pluggable interfaces, the canonical pipeline
 * constructor (signatures only in P0), and the clearinghouse seam. No UI, no
 * MCP, no demo data, no chain SDK calls inline (DESIGN.md §4.3 hard rule).
 */

export * from "./models.js";
export * from "./interfaces.js";
export * from "./config.js";
export * from "./calibration.js";
export * from "./router.js";
export * from "./pipeline.js";
export * from "./graph.js";
export * from "./numeric/money.js";
