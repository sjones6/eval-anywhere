import fsp from "node:fs/promises";
import fs from "node:fs";

import z from "zod";

import { parse } from "yaml";
import { prompt } from "../schemas/prompt";
import { globSync } from "glob";
import path from "node:path";
import {
  PromptWithPath,
  Message as CoreMessage,
  JSONValue,
} from "../core/types";
import { Message } from "../schemas/message";
import { EvaluationChecks, EvaluationChecksArray } from "../schemas/evaluation";

const loadFileWithSchema = async <Schema extends z.ZodTypeAny>(
  file: string,
  schema: Schema,
): Promise<z.infer<Schema> | null> => {
  const contents = await fsp.readFile(file, "utf-8");
  const contentsAsYaml = parse(contents);
  const parsedContents = schema.safeParse(contentsAsYaml, {});

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
      "$ref" in parameters &&
      typeof parameters["$ref"] === "string" &&
      !!parameters["$ref"] &&
      parameters["$ref"].endsWith(".json")
    ) {
      return JSON.parse(
        fs.readFileSync(path.join(cwd, parameters["$ref"]), "utf-8").trim(),
      );
    }
    if (typeof parameters === "object") {
      return parameters;
    }
    if (typeof parameters === "string") {
      return JSON.parse(parameters.trim());
    }
    return parameters;
  } catch (err) {
    console.error("failed to load value", err);
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

const resolveChecks = (checks: EvaluationChecks): EvaluationChecksArray => {
  if (Array.isArray(checks)) {
    return checks;
  }
  return Object.entries(checks).map(([id, value]) => {
    return {
      id,
      ...value,
    };
  });
};

const schemaMessageToCoreMessage = (message: Message): CoreMessage => {
  if (message.role === "assistant") {
    return {
      role: "assistant",
      content: message.content,
      ...(message.tool_calls
        ? {
            toolCalls: message.tool_calls,
          }
        : {}),
    };
  }
  if (message.role === "user") {
    return {
      role: "user",
      content: message.content,
      ...(message.name
        ? {
            name: message.name,
          }
        : {}),
    };
  }
  if (message.role === "tool") {
    return {
      role: "tool",
      toolCallId: message.toolCallId,
      name: message.toolName,
      result: message.result,
      isError: message.isError,
    };
  }
  throw new Error("unrecognized role");
};

export const loadPrompts = async <PromptSchema extends typeof prompt>({
  glob,
  baseDir,
  promptSchema,
}: {
  baseDir: string;
  glob: string;
  promptSchema: PromptSchema;
}): Promise<PromptWithPath[]> => {
  const prompts: PromptWithPath[] = [];

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
    const loadedPrompt = await loadFileWithSchema(absFilePath, promptSchema);

    if (!loadedPrompt) {
      throw new Error(`failed to parse prompt: ${file.fullpath()}`);
    }

    const cwd = path.dirname(absFilePath);
    prompts.push({
      path: absFilePath,
      prompt: {
        name: loadedPrompt.name,
        model: loadedPrompt.model,
        version: loadedPrompt.version,
        temperature: loadedPrompt.temperature,
        systemPrompt: loadedPrompt.system_prompt,
        finalMessages: loadedPrompt.final_messages
          ? loadedPrompt.final_messages.map(schemaMessageToCoreMessage)
          : [],
        fewShotMessages: loadedPrompt.few_shot_messages
          ? loadedPrompt.few_shot_messages.map(schemaMessageToCoreMessage)
          : [],
        tools: (loadedPrompt.tools ?? []).map((tool) => {
          return {
            ...tool,
            parameters: resolveJSONSchema({
              cwd,
              parameters: tool.parameters,
            }),
          };
        }),
        ...(loadedPrompt.schema
          ? {
              schema: resolveJSONSchema({
                cwd,
                parameters: loadedPrompt.schema,
              }),
            }
          : {}),
        ...(loadedPrompt.evaluation
          ? {
              evaluation: {
                ...loadedPrompt.evaluation,
                checks: resolveChecks(loadedPrompt.evaluation.checks ?? []),
                evaluations: loadedPrompt.evaluation.evaluations.map(
                  (evaluation) => {
                    return {
                      ...(evaluation.name
                        ? {
                            name: evaluation.name,
                          }
                        : {}),
                      messages: evaluation.messages.map(
                        schemaMessageToCoreMessage,
                      ),
                      checks: resolveChecks(evaluation.checks ?? []),
                    };
                  },
                ),
              },
            }
          : {}),
      },
    });
  }

  return prompts;
};
