import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Clean Architecture layer boundaries (ARCHITECTURE.md §12.1) ───────────
  // Enforce the dependency rule: dependencies point inward only.
  {
    files: ["src/features/**/domain/**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/infrastructure/**"], message: "Domain must not import infrastructure." },
            { group: ["**/application/**"], message: "Domain must not import application." },
            { group: ["**/presentation/**"], message: "Domain must not import presentation." },
            { group: ["@/network/**"], message: "Domain must not import network/I/O." },
            { group: ["next/*", "next", "react", "react-dom"], message: "Domain must be framework-free." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/application/**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/infrastructure/**"], message: "Application depends on ports, not adapters." },
            { group: ["**/presentation/**"], message: "Application must not import presentation." },
            { group: ["next/*", "next", "react", "react-dom"], message: "Application must be framework-free." },
          ],
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "supabase/functions/**"]),
]);

export default eslintConfig;
