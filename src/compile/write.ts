import fsp from "node:fs/promises";
import path from "node:path";

import { CompileConfig, OutputFile } from "./types";

export const writeFiles = async (
  cfg: CompileConfig,
  files: OutputFile[],
): Promise<void> => {
  for (const file of files) {
    await fsp.writeFile(path.join(cfg.outDir, file.path), file.contents);
  }
};
