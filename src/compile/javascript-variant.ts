import fsp from "node:fs/promises";
import path from "node:path";

import * as prettier from "prettier";

import { CompileFn, Lang, OutputFile } from "./types";
import jsonSchemaToZod from "json-schema-to-zod";
import { camelCase, snakeCase } from "lodash";

const nameToFileName = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s/g, "_")
    .toLowerCase();
};

const exists = (check: boolean, str: string): string => {
  return check ? str : "";
};

export type JavaScriptVariant = {
  lang: Lang;
  fileExtension: "js" | "ts";
  includeFileExtensionInImports: boolean;
  module: "cjs" | "esm";
  includeTypes: boolean;
  zodPath: string;
};

export const javascriptVariant =
  (variant: JavaScriptVariant): CompileFn =>
  async (cfg) => {
    try {
      const outputFiles: OutputFile[] = [];

      const importExtension = variant.includeFileExtensionInImports
        ? `.${variant.fileExtension}`
        : "";

      if (variant.includeTypes) {
        // copy template files
        const baseTemplatePath = path.join(
          cfg.packageDir,
          "templates",
          "typescript",
        );
        const files = await fsp.readdir(baseTemplatePath, {
          recursive: true,
        });

        for (const filePath of files) {
          outputFiles.push({
            path: filePath.replace(baseTemplatePath, ""),
            contents: (
              await fsp.readFile(path.join(baseTemplatePath, filePath), "utf-8")
            ).replaceAll(/from\s['"]zod['"]/g, `from "${variant.zodPath}";`),
            lang: variant.lang,
          });
        }
      }

      const indexLines: string[] = [];

      // write out each prompt
      for (const promptWithPath of cfg.prompts) {
        const { prompt } = promptWithPath;
        const version = prompt.version;
        const className =
          camelCase(prompt.name).replace(/(prompt)?$/i, "Prompt") +
          `V${version}`;
        const filePath = nameToFileName(prompt.name) + `_v${prompt.version}`;
        indexLines.push(
          variant.module === "esm"
            ? `export { ${className} } from './${filePath}${importExtension}';`
            : `const { ${className} } = require('./${filePath}${importExtension}');`,
        );

        const schemas = await Promise.all(
          prompt.tools.map(async (tool) => {
            const name = tool.name.replace(/[-_]/g, " ");
            const camelCaseName = camelCase(name) + "Schema";
            const pascalCaseName =
              camelCaseName[0]?.toUpperCase() + camelCaseName.slice(1);
            return {
              name,
              isTool: true,
              description: tool.description,
              snakeCaseName: snakeCase(name),
              camelCaseName,
              pascalCaseName,
              schema: jsonSchemaToZod(tool.parameters, {
                name: camelCaseName,
                type:
                  variant.module === "esm" && variant.includeTypes
                    ? pascalCaseName
                    : false,
                module: variant.module,
                noImport: true,
              }).replaceAll(
                /module.exports = { "(\w+)":\s(.+)\s}/g,
                "module.exports.$1 = $2",
              ),
            };
          }),
        );

        const name = prompt.name.replace(/[-_]/g, " ");
        const camelCaseSchemaName =
          camelCase(name) + "SchemaV" + prompt.version;
        const pascalCaseName =
          camelCaseSchemaName[0]?.toUpperCase() + camelCaseSchemaName.slice(1);
        if (prompt.schema) {
          schemas.push({
            name,
            isTool: false,
            description: "",
            snakeCaseName: snakeCase(name),
            camelCaseName: camelCaseSchemaName,
            pascalCaseName,
            schema: jsonSchemaToZod(prompt.schema, {
              name: camelCaseSchemaName,
              type: variant.includeTypes ? pascalCaseName : false,
              module: variant.module,
              noImport: true,
            }),
          });
        }

        const importStatements = [
          !schemas.length
            ? ""
            : variant.module === "esm"
              ? `import { z } from '${variant.zodPath}';`
              : `const { z } = require('${variant.zodPath}')`,
          variant.includeTypes
            ? `import type { EvalAnywherePrompt } from './types${importExtension}';`
            : false,
        ].filter((line) => typeof line === "string");

        const optionalPromptProperties = [
          exists(
            !!prompt.fewShotMessages.length,
            `fewShotMessages: ${JSON.stringify(prompt.fewShotMessages ?? [], null, 2)}`,
          ),
          exists(
            !!prompt.finalMessages.length,
            `finalMessages: [
              ${JSON.stringify(prompt.finalMessages ?? [], null, 2)}
            ]`,
          ),
          exists(
            !!prompt.tools.length,
            `tools: [
    ${schemas
      .filter(({ isTool }) => isTool)
      .map(
        (tool) => `{
      name: ${JSON.stringify(tool.snakeCaseName)},
      description: ${JSON.stringify(tool.description)},
      parameters: ${tool.camelCaseName}
    }`,
      )
      .join(",\n")}
  ],`,
          ),
          exists(!!prompt.schema, `schema: ${camelCaseSchemaName}`),
        ]
          .filter(Boolean)
          .map((line) => line.trim())
          .join(",\n");

        const unformattedPrompt = `${importStatements.join("\n ")}

${schemas?.map(({ schema }) => schema).join("\n\n")}

${variant.module === "cjs" ? "module.exports." : "export const "}${className}${variant.includeTypes ? ": EvalAnywherePrompt" : ""} = {
  name: ${JSON.stringify(prompt.name)},
  version: ${version},
  model: ${JSON.stringify(prompt.model)},
  temperature: ${JSON.stringify(prompt.temperature)},
  systemPrompt: ${JSON.stringify(prompt.systemPrompt)},
  ${optionalPromptProperties}
};`;

        outputFiles.push({
          path: `${filePath}.${variant.fileExtension}`,
          contents: unformattedPrompt,
          lang: variant.lang,
        });
      }

      outputFiles.push({
        path: `index.${variant.fileExtension}`,
        lang: variant.lang,
        contents:
          `${variant.includeTypes ? `export type { EvalAnywherePrompt } from './types${importExtension}';` : ""}
${indexLines.join("\n")}
`.trim(),
      });

      return {
        success: true,
        files: await Promise.all(
          // reformat all file contents with prettier for write out.
          outputFiles.map(async (outputFile) => {
            return {
              ...outputFile,
              contents: await prettier.format(outputFile.contents, {
                filepath: outputFile.path,
              }),
            };
          }),
        ),
      };
    } catch (err) {
      return {
        success: false,
        error: err as Error,
      };
    }
  };
