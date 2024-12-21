import fs from "node:fs";
import path from "path";
import { zodToJsonSchema, JsonSchema7Type } from "zod-to-json-schema";
import { check } from "../cli/schemas/check";
import { models } from "../cli/schemas/models";
import { message } from "../cli/schemas/message";
import { tool } from "../cli/schemas/tool";
import { evaluation } from "../cli/schemas/evaluation";
import { messages, prompt } from "../cli/schemas/prompt";

import { zodToTs, printNode, createTypeAlias } from "zod-to-ts";

const writeSchema = (schema: JsonSchema7Type, name: string): void => {
  fs.writeFileSync(
    path.join(process.cwd(), "schemas", name),
    JSON.stringify(schema, null, 4),
  );
};

writeSchema(
  zodToJsonSchema(check, {
    name: "EvalAnywhereCheck",
    definitionPath: "$defs",
    definitions: {
      models,
    },
  }),
  "check.json",
);

writeSchema(
  zodToJsonSchema(models, {
    name: "EvalAnywhereModels",
    definitionPath: "$defs",
  }),
  "models.json",
);

writeSchema(
  zodToJsonSchema(message, {
    name: "EvalAnywhereMessage",
    definitionPath: "$defs",
    definitions: {
      tool,
    },
  }),
  "message.json",
);

writeSchema(
  zodToJsonSchema(tool, {
    name: "EvalAnywhereTool",
    definitionPath: "$defs",
  }),
  "tool.json",
);

writeSchema(
  zodToJsonSchema(evaluation, {
    name: "EvalAnywhereEvaluation",
    definitionPath: "$defs",
  }),
  "eval.yaml.json",
);

writeSchema(
  zodToJsonSchema(prompt, {
    name: "EvalAnywherePrompt",
    // This results in
    $refStrategy: "none",
    definitionPath: "$defs",
    definitions: {
      messages,
    },
  }),
  "prompt.yaml.json",
);

const { node } = zodToTs(prompt, "EvalAnywherePrompt");

fs.writeFileSync(
  path.join(process.cwd(), "templates", "typescript", "types.ts"),
  `export ${printNode(createTypeAlias(node, "EvalAnywherePrompt"))}`,
);
