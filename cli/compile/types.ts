import { Prompt } from "../schemas/prompt";

export type Lang = string;

export const typescript: Lang = "typescript" as const;

export type CompileConfig = {
  outDir: string;
  packageDir: string;
  lang: Lang;
  prompts: Prompt[];
};

export type OutputFile = {
  lang: Lang;
  path: string;
  contents: string;
};

export type CompileFn = {
  (
    cfg: CompileConfig,
  ): Promise<
    { success: true; files: OutputFile[] } | { success: false; error: Error }
  >;
};
