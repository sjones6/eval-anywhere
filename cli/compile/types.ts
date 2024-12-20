import { Prompt } from "../gen/prompt";

export type Lang = string;

export const typescript: Lang = "typescript" as const;

export type CompileConfig = {
  outDir: string;
  packageDir: string;
  lang: Lang;
  prompts: Prompt[];
};

export type CompileFn = {
  (
    cfg: CompileConfig,
  ): Promise<{ success: true } | { success: false; error: Error }>;
};
