import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    ".next/**",
    "karate-app/**",
    "app/**",
    "components/**",
    "lib/**",
    "tests/**",
    "middleware.ts",
    "next.config.ts",
    "next-env.d.ts",
  ]),
  {
    files: ["eslint.config.mjs", "postcss.config.mjs", "vite.config.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      parser: tsParser,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
]);
