import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Tests run against the TypeScript source (Vite resolves the NodeNext `.js`
 * specifiers to their `.ts` files automatically), so no build step is needed.
 * The aliases mirror every workspace package's `exports` map so a clean
 * `npm install && npm test` (with NO prior `tsc -b`) loads all suites — the
 * package `exports` point at `./dist`, which does not exist until a build.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@trapeza/core/testing": r("./packages/core/src/testing/index.ts"),
      "@trapeza/core": r("./packages/core/src/index.ts"),
      "@trapeza/oracle": r("./packages/oracle/src/index.ts"),
      "@trapeza/clearinghouse": r("./packages/clearinghouse/src/index.ts"),
      "@trapeza/store-sqlite": r("./packages/store-sqlite/src/index.ts"),
      "@trapeza/runtime": r("./packages/runtime/src/index.ts"),
      "@trapeza/provider-llm": r("./packages/provider-llm/src/index.ts"),
      "@trapeza/adapter-arc": r("./packages/adapter-arc/src/index.ts"),
      "@trapeza/adapter-gateway": r("./packages/adapter-gateway/src/index.ts"),
      "@trapeza/mcp": r("./apps/mcp/src/index.ts"),
      "@trapeza/sim": r("./apps/sim/src/index.ts"),
      "@trapeza/showcase": r("./apps/showcase/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts", "apps/**/test/**/*.test.ts"],
    environment: "node",
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "packages/store-sqlite/src/**",
        "packages/runtime/src/**",
        "packages/provider-llm/src/**",
        "apps/mcp/src/tools.ts",
        "apps/mcp/src/schemas.ts",
        "apps/sim/src/loop.ts",
        "apps/sim/src/roster.ts",
      ],
      exclude: ["**/*.d.ts", "**/cli.ts", "**/index.ts"],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 75,
        statements: 85,
      },
    },
  },
});
