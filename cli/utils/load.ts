import fsp from "node:fs/promises";

import z from "zod";

import { parse } from "yaml";
import { prompt, Prompt } from "../schemas/prompt";
import { globSync } from "glob";

const loadFileWithSchema = async <Schema extends z.ZodTypeAny>(
  file: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> => {
  const contents = await fsp.readFile(file, "utf-8");
  const contentsAsYaml = parse(contents);
  const parsedContents = schema.safeParse(contentsAsYaml);

  if (!parsedContents.success) {
    console.error("prompt invalid", parsedContents.error);
    return null;
  }

  return parsedContents.data;
};

export const loadPrompts = async ({
  glob,
  baseDir,
}: {
  baseDir: string;
  glob: string;
}): Promise<Prompt[]> => {
  const prompts: Prompt[] = [];

  const files = globSync(`${baseDir}/${glob}`, {
    cwd: baseDir,
    stat: true,
    withFileTypes: true,
  }).filter((path) => !!path && path.mode !== undefined && path.mode & 0o040);

  if (!files.length) {
    console.log(`No matching files found in ${baseDir}`);
  }

  for (const file of files) {
    const loadedPrompt = await loadFileWithSchema(file.fullpath(), prompt);

    if (!loadedPrompt) {
      throw new Error(`failed to parse prompt: ${file.fullpath()}`);
    }

    prompts.push(loadedPrompt);
  }

  return prompts;
};
