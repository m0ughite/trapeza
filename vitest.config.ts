import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Tests run against the TypeScript source (Vite resolves the NodeNext `.js`
 * specifiers to their `.ts` files automatically), so no build step is needed.
 * The aliases mirror the package's `exports` map.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@trapeza/core/testing": r("./packages/core/src/testing/index.ts"),
      "@trapeza/core": r("./packages/core/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts"],
    environment: "node",
  },
});
