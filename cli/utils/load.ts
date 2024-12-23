import fsp from "node:fs/promises";
import fs from "node:fs";

import z from "zod";

import { parse } from "yaml";
import { Prompt, prompt } from "../schemas/prompt";
import { globSync } from "glob";
import { Tool, ToolParameters } from "../schemas/tool";
import path from "node:path";

export type ResolvedTool = Omit<Tool, "parameters"> & {
  parameters: Record<string, unknown>;
};

export type ResolvedPrompt = Omit<Prompt, "tools"> & {
  tools: ResolvedTool[];
};

export type ResolvedPromptWithPath = {
  /** The absolute path to the prompt */
  path: string;
  prompt: ResolvedPrompt;
};

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
}): Promise<ResolvedPromptWithPath[]> => {
  const prompts: ResolvedPromptWithPath[] = [];

  const files = globSync(`${baseDir}/${glob}`, {
    cwd: baseDir,
    stat: true,
    withFileTypes: true,
  }).filter((path) => !!path && path.mode !== undefined && path.mode & 0o040);

  if (!files.length) {
    console.log(`No matching files found in ${baseDir}`);
  }

  for (const file of files) {
    const absFilePath = file.fullpath();
    const loadedPrompt = await loadFileWithSchema(absFilePath, prompt);

    if (!loadedPrompt) {
      throw new Error(`failed to parse prompt: ${file.fullpath()}`);
    }

    prompts.push({
      path: absFilePath,
      prompt: {
        ...loadedPrompt,
        tools: (loadedPrompt.tools ?? []).map((tool) => {
          return {
            ...tool,
            parameters: loadToolParameters({
              cwd: path.dirname(absFilePath),
              parameters: tool.parameters,
            }),
          };
        }),
      },
    });
  }

  return prompts;
};

export const loadToolParameters = ({
  parameters,
  cwd,
}: {
  parameters: ToolParameters;
  cwd: string;
}): Record<string, unknown> => {
  try {
    if (typeof parameters === "string") {
      return JSON.parse(parameters.trim());
    }
    if (!!parameters.path) {
      return JSON.parse(
        fs.readFileSync(path.join(cwd, parameters.path), "utf-8").trim(),
      );
    }
  } catch (err) {
    console.error("failed to load tool parameters", err);
    throw err;
  }
  throw new Error("Should not hit this. This is a developer error.");
};
