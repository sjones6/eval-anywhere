import fsp from "node:fs/promises";
import path from "node:path";

import * as prettier from "prettier";

import { CompileFn } from "./types";

const nameToFileName = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s/g, "_")
    .toLowerCase();
};

const pascalCase = (str: string, suffix: string = "Prompt"): string => {
  return (
    str
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + suffix
  );
};

export const compileTypeScript: CompileFn = async (cfg) => {
  try {
    // copy template files
    await fsp.cp(
      path.join(cfg.packageDir, "templates", "typescript"),
      cfg.outDir,
      { recursive: true },
    );

    const indexLines: string[] = [];

    // each prompt
    for (const prompt of cfg.prompts) {
      const className = pascalCase(prompt.name);
      const filePath = nameToFileName(prompt.name);
      indexLines.push(`export { ${className} } from './${filePath}';`);

      const unformattedPrompt = `
import type { EvalAnywherePrompt } from './types';

export const ${className}: EvalAnywherePrompt = ${JSON.stringify(prompt, null, 2)};
`;

      const formattedPrompt = await prettier.format(unformattedPrompt, {
        parser: "typescript",
      });

      await fsp.writeFile(
        path.join(cfg.outDir, filePath + ".ts"),
        formattedPrompt,
      );
    }

    // index file
    await fsp.writeFile(
      path.join(cfg.outDir, "index.ts"),
      `
export type { EvalAnywherePrompt, Message, Tool } from './types';
${indexLines.join("\n")}
`,
    );

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err as Error,
    };
  }
};
