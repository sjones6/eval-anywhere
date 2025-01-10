import fs from "node:fs";
import path from "path";
import { zodToJsonSchema, JsonSchema7Type } from "zod-to-json-schema";
import { checks } from "../src/schemas/check";
import { models } from "../src/schemas/models";
import { message } from "../src/schemas/message";
import { tool } from "../src/schemas/tool";
import { evaluation } from "../src/schemas/evaluation";
import { messages, prompt, promptNoEval } from "../src/schemas/prompt";
import * as prettier from "prettier";

import { Project, ts } from "ts-morph";

import { zodToTs, printNode, createTypeAlias } from "zod-to-ts";
import { z } from "zod";

const writeSchema = (schema: JsonSchema7Type, name: string): void => {
  fs.writeFileSync(
    path.join(process.cwd(), "schemas", name),
    JSON.stringify(schema, null, 4),
  );
};

writeSchema(
  zodToJsonSchema(tool, {
    name: "EvalAnywhereTool",
    definitionPath: "$defs",
  }),
  "tool.json",
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
  namedImports: ["ZodSchema"],
  moduleSpecifier: "zod",
});

sourceFile.transform((traversal) => {
  const node = traversal.visitChildren();
  if (ts.isPropertySignature(node) && ts.isIdentifier(node.name)) {
    // TODO: only swap type for tools.parameters and not all parameters
    if (node.name.text === "parameters") {
      return traversal.factory.updatePropertySignature(
        node,
        node.modifiers,
        node.name,
        node.questionToken,
        traversal.factory.createTypeReferenceNode("ZodSchema", []),
      );
    }
    if (node.name.text === "schema") {
      return traversal.factory.updatePropertySignature(
        node,
        node.modifiers,
        node.name,
        node.questionToken,
        traversal.factory.createUnionTypeNode([
          traversal.factory.createTypeReferenceNode("ZodSchema", []),
          traversal.factory.createKeywordTypeNode(
            ts.SyntaxKind.UndefinedKeyword,
          ),
        ]),
      );
    }
  }
  return node;
});

(async () => {
  fs.writeFileSync(
    path.join(process.cwd(), "templates", "typescript", "types.ts"),
    await prettier.format(sourceFile.print(), {
      parser: "typescript",
    }),
  );
})();
