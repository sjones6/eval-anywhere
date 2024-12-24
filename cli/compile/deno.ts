import { CompileFn } from "./types";
import { compileTypeScript } from "./typescript";

export const compileDeno: CompileFn = async (cfg) => {
  const result = await compileTypeScript(cfg);
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    files: result.files.map((file) => {
      return {
        ...file,
        contents: file.contents.replace(
          /import type { ZodSchema } from ['"]zod['"];/,
          "import type { ZodSchema } from 'https://deno.land/x/zod@v3.24.1/mod.ts'",
        ),
      };
    }),
  };
};
