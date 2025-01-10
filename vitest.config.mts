import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "**/out/**",
      "**/dist/**",
      "**/examples/**",
      "**/templates/*",
      "**/scripts/**",
    ],
    coverage: {
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "**/out/**",
        "**/dist/**",
        "**/examples/**",
        "**/templates/*",
        "**/scripts/**",
      ],
      thresholds: {
        statements: 15,
        branches: 64,
        functions: 8,
        lines: 15,
      },
    },
  },
});
