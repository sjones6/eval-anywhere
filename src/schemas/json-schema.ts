import { zodToJsonSchema } from "zod-to-json-schema";

import { SchemaCheckBase } from "../evals/types";
import { createPromptSchema, messages } from "./prompt";

export const promptSchematoJsonSchema = <T extends SchemaCheckBase>(
  checks: readonly T[],
): Record<string, unknown> => {
  const prompt = createPromptSchema(checks);
  return zodToJsonSchema(prompt, {
    name: "EvalAnywherePrompt",
    // This results in embedded schemas being inlined.
    // It's more noisy, but downstream tools tend to do better.
    $refStrategy: "none",
    definitionPath: "$defs",
    definitions: {
      messages,
    },
  });
};
