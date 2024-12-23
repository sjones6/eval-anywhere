import { ResolvedPromptWithPath } from "../utils/load";

export type Lang = string;

export const typescript: Lang = "typescript" as const;

export type CompileConfig = {
  outDir: string;
  packageDir: string;
  lang: Lang;
  prompts: ResolvedPromptWithPath[];
};

export type OutputFile = {
  lang: Lang;
  path: string;
  contents: string;
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
