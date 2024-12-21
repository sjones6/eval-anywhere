import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

import z from "zod";

import { parse } from "yaml";
import { prompt, Prompt } from "../schemas/prompt";
import { evaluation, Evaluation } from "../schemas/evaluation";
import { globSync } from "glob";

export type PromptWithEvals = {
  prompt: Prompt;
  evaluation: Evaluation;
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

export const loadPromptsAndEvals = async ({
  dir,
}: {
  dir: string;
}): Promise<PromptWithEvals[]> => {
  const promptsAndEvals: PromptWithEvals[] = [];

  const files = globSync(`${dir}/**/prompt.{yaml,yml}`, {
    stat: true,
    withFileTypes: true,
  }).filter((path) => !!path && path.mode !== undefined && path.mode & 0o040);

  if (!files.length) {
    console.log(`No matching files found in ${dir}`);
  }

  for (const file of files) {
    const loadedPrompt = await loadFileWithSchema(file.fullpath(), prompt);

    if (!loadedPrompt) {
      throw new Error(`failed to parse prompt: ${file.fullpath()}`);
    }

    const evalPath = ["eval.yaml", "eval.yml", "evals.yaml", "eval.yml"]
      .map((filename) => path.join(path.dirname(file.fullpath()), filename))
      .find((p) => fs.existsSync(p));

    if (!evalPath) {
      promptsAndEvals.push({
        prompt: loadedPrompt,
        evaluation: {
          evals: [],
          checks: [],
        },
      });
      continue;
    }

    if (evalPath) {
      const loadedEval = await loadFileWithSchema(evalPath, evaluation);
      promptsAndEvals.push({
        prompt: loadedPrompt,
        evaluation: loadedEval ?? {
          evals: [],
          checks: [],
        },
      });
    }
  }

  return promptsAndEvals;
};
