import fsp from "node:fs/promises";
import fs from "node:fs";

import z from "zod";

import { parse } from "yaml";
import { Prompt, prompt } from "../schemas/prompt";
import { globSync } from "glob";
import { Tool } from "../schemas/tool";
import path from "node:path";
import {
  AlignmentCheck,
  BaseCheck,
  // Check,
  CustomCheck,
  ExactMatch,
  ProfanityCheck,
  StructuredOutput,
  ToolCall,
} from "../schemas/check";
import { Evaluation, EvaluationCheck } from "../schemas/evaluation";

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue;
    }
  | Array<JSONValue>;

export type ResolvedStructuredOutput = Omit<StructuredOutput, "result"> & {
  result: JSONValue;
};

export type ResolvedCheck =
  | ResolvedStructuredOutput
  | ProfanityCheck
  | AlignmentCheck
  | CustomCheck
  | ToolCall
  | ExactMatch;

export type ResolvedEvaluationCase = Omit<EvaluationCheck, "checks"> & {
  checks: ResolvedCheck[];
};

export type ResolvedEvaluationSuite = Omit<
  Evaluation,
  "checks" | "evaluations"
> & {
  evaluations: ResolvedEvaluationCase[];
  checks: ResolvedCheck[];
};

export type ResolvedTool = Omit<Tool, "parameters"> & {
  parameters: Record<string, unknown>;
};

export type ResolvedPrompt = Omit<Prompt, "tools" | "schema" | "evaluation"> & {
  tools: ResolvedTool[];
  schema: Record<string, unknown> | undefined;
  evaluation: ResolvedEvaluationSuite | undefined;
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

const resolveJSON = ({
  parameters,
  cwd,
}: {
  parameters:
    | {
        path: string;
      }
    | JSONValue;
  cwd: string;
}): JSONValue => {
  try {
    if (
      typeof parameters === "object" &&
      !!parameters &&
      "path" in parameters &&
      typeof parameters.path === "string" &&
      !!parameters.path &&
      parameters.path.endsWith(".json")
    ) {
      return JSON.parse(
        fs.readFileSync(path.join(cwd, parameters.path), "utf-8").trim(),
      );
    }
    if (typeof parameters === "string") {
      return JSON.parse(parameters.trim());
    }
    return parameters;
  } catch (err) {
    console.error("failed to load tool parameters", err);
    throw err;
  }
  throw new Error("Should not hit this. This is a developer error.");
};

const resolveJSONSchema = ({
  parameters,
  cwd,
}: {
  parameters:
    | {
        path: string;
      }
    | JSONValue;
  cwd: string;
}): Record<string, unknown> => {
  const loadedJSON = resolveJSON({
    cwd,
    parameters,
  });

  if (typeof loadedJSON === "object" && !!loadedJSON && "type" in loadedJSON) {
    return loadedJSON;
  }
  throw new Error("Invalid JSON schema");
};

const isStructuredOutput = (check: BaseCheck): check is StructuredOutput =>
  check.id === "structured_output";

const resolveCheck = (
  cwd: string,
  check: BaseCheck | StructuredOutput,
): ResolvedCheck => {
  if (isStructuredOutput(check)) {
    return {
      ...check,
      result: resolveJSON({
        cwd,
        parameters: check.result,
      }),
    };
  }
  return check;
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

    const cwd = path.dirname(absFilePath);
    prompts.push({
      path: absFilePath,
      prompt: {
        ...loadedPrompt,
        tools: (loadedPrompt.tools ?? []).map((tool) => {
          return {
            ...tool,
            parameters: resolveJSONSchema({
              cwd,
              parameters: tool.parameters,
            }),
          };
        }),
        schema: loadedPrompt.schema
          ? resolveJSONSchema({
              cwd,
              parameters: loadedPrompt.schema,
            })
          : undefined,
        evaluation: loadedPrompt.evaluation
          ? {
              ...loadedPrompt.evaluation,
              checks: (loadedPrompt.evaluation.checks ?? []).map((check) =>
                resolveCheck(cwd, check),
              ),
              evaluations: loadedPrompt.evaluation.evaluations.map(
                (evaluation) => {
                  return {
                    name: evaluation.name,
                    messages: evaluation.messages,
                    checks: (evaluation.checks ?? []).map((check) =>
                      resolveCheck(cwd, check),
                    ),
                  };
                },
              ),
            }
          : undefined,
      },
    });
  }

  return prompts;
};
