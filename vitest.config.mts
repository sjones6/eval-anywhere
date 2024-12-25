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
        statements: 16,
        branches: 71,
        functions: 11,
        lines: 16,
      },
    },
  },
});
