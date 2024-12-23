import fs from "node:fs";
import path from "path";
import { zodToJsonSchema, JsonSchema7Type } from "zod-to-json-schema";
import { check } from "../cli/schemas/check";
import { models } from "../cli/schemas/models";
import { message } from "../cli/schemas/message";
import { tool } from "../cli/schemas/tool";
import { evaluation } from "../cli/schemas/evaluation";
import { messages, prompt, promptNoEval } from "../cli/schemas/prompt";
import * as prettier from "prettier";

import { Project, ts } from 'ts-morph';

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
    // This results in embedded schemas being inlined.
    // It's more noisy, but downstream tools tend to do better.
    $refStrategy: "none",
    definitionPath: "$defs",
    definitions: {
      messages,
    },
  }),
  "prompt.yaml.json",
);

/**
 * Using prompt without the eval since we don't want evals to show up
 * in the prompts that are written out.
 * 
 * Also, replacing schema definition with 
 */
const typeAlias = "EvalAnywherePrompt";
const { node } = zodToTs(promptNoEval, typeAlias);
const aliasedNode = createTypeAlias(node, typeAlias);

const project = new Project();
const sourceFile = project.createSourceFile(
  `${typeAlias}.ts`,
  `export ${printNode(aliasedNode, {})}`,
);

sourceFile.addImportDeclaration({
  isTypeOnly: true,
  namedImports: ["ZodTypeAny"],
  moduleSpecifier: "zod"
})

sourceFile.transform(traversal => {
  const node = traversal.visitChildren();
  if (
    ts.isPropertySignature(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === "parameters"
  ) {
    return traversal.factory.updatePropertySignature(
      node,
      node.modifiers,
      node.name,
      node.questionToken,
      traversal.factory.createTypeReferenceNode("ZodTypeAny", [])
    )
  }
  return node;
});

(async () => {
  fs.writeFileSync(
    path.join(process.cwd(), "templates", "typescript", "types.ts"),
    await prettier.format(sourceFile.print(), {
      parser: "typescript",
    })
  );
})();
