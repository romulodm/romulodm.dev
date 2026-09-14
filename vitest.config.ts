import { defineConfig } from "vitest/config";

import { vitestAlias, workspaceRoot } from "./testing/vitest.shared.ts";

export default defineConfig({
  resolve: {
    alias: vitestAlias,
  },
  test: {
    root: workspaceRoot,
    name: "unit",
    // Ambiente unico. Aqui existia um `environmentMatchGlobs` roteando
    // **/*.dom.test.ts?(x) para jsdom, mas a chave foi removida no vitest 4 —
    // e removida em silencio: passa a ser ignorada sem erro nem aviso, e o
    // teste roda em `node`, onde `document` e undefined. O substituto e um
    // docblock na primeira linha do arquivo de teste:
    //
    //   // @vitest-environment jsdom
    //
    // O jsdom continua nas devDependencies da raiz exatamente para isso.
    environment: "node",
    include: [
      "portfolio/**/*.test.ts",
      "portfolio/**/*.test.tsx",
      "worker/**/*.test.ts",
      "packages/database/**/*.test.ts",
      "packages/queues/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/tests/integration/**",
      "**/tests/e2e/**",
      "frontend/**",
    ],
    setupFiles: ["./testing/setupTests.unit.ts"],
    passWithNoTests: false,
  },
});
