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
      "@trapeza/adapter-arc": r("./packages/adapter-arc/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts", "demo/test/**/*.test.ts"],
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
  },
});
