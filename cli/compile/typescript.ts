import fsp from "node:fs/promises";
import path from "node:path";

import * as prettier from "prettier";

import { CompileFn, OutputFile, typescript } from "./types";
import jsonSchemaToZod from "json-schema-to-zod";
import { camelCase, snakeCase } from "lodash";

const nameToFileName = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s/g, "_")
    .toLowerCase();
};

export const compileTypeScript: CompileFn = async (cfg) => {
  try {
    const outputFiles: OutputFile[] = [];

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
        contents: await fsp.readFile(
          path.join(baseTemplatePath, filePath),
          "utf-8",
        ),
        lang: typescript,
      });
    }

    const indexLines: string[] = [];

    // write out each prompt
<<<<<<< HEAD
    for (const prompt of cfg.prompts) {
=======
    for (const promptWithPath of cfg.prompts) {
      const { prompt } = promptWithPath;
>>>>>>> da7c42c (refactor file handling)
      const version = prompt.version ?? 0;
      const className =
        camelCase(prompt.name).replace(/(prompt)?$/i, "Prompt") + `V${version}`;
      const filePath = nameToFileName(prompt.name);
      indexLines.push(`export { ${className} } from './${filePath}';`);

<<<<<<< HEAD
      const schemas = (prompt.tools ?? []).map((tool) => {
        const name = tool.name.replace(/[-_]/g, " ");
        const camelCaseName = camelCase(name) + "Schema";
        const pascalCaseName =
          camelCaseName[0]?.toUpperCase() + camelCaseName.slice(1);
        return {
          name,
          description: tool.description,
          snakeCaseName: snakeCase(name),
          camelCaseName,
          pascalCaseName,
          schema: jsonSchemaToZod(JSON.parse(tool.parameters), {
            name: camelCaseName,
            type: pascalCaseName,
            module: "esm",
            noImport: true,
          }),
        };
      });

      const unformattedPrompt = `${schemas.length ? `import { z } from 'zod';` : ""}
import type { EvalAnywherePrompt } from './types';

${schemas?.map(({ schema }) => schema).join("\n\n")}

export const ${className}: EvalAnywherePrompt = {
  name: ${JSON.stringify(prompt.name)},
  version: ${version},
  model: ${JSON.stringify(prompt.model)},
  temperature: ${JSON.stringify(prompt.temperature)},
  system_prompt: ${JSON.stringify(prompt.system_prompt)},
  few_shot_messages: ${JSON.stringify(prompt.few_shot_messages, null, 2)},
  final_messages: ${JSON.stringify(prompt.final_messages, null, 2)},
  tools: [
    ${schemas
      .map(
        (tool) => `{
      name: ${JSON.stringify(tool.snakeCaseName)},
      description: ${JSON.stringify(tool.description)},
      parameters: ${tool.camelCaseName}
    }`,
      )
      .join(",\n")}
  ],
};
`;

      outputFiles.push({
        path: filePath + ".ts",
        contents: unformattedPrompt,
        lang: typescript,
      });
=======
      const schemas = await Promise.all(
        (prompt.tools ?? []).map(async (tool) => {
          const name = tool.name.replace(/[-_]/g, " ");
          const camelCaseName = camelCase(name) + "Schema";
          const pascalCaseName =
            camelCaseName[0]?.toUpperCase() + camelCaseName.slice(1);
          return {
            name,
            description: tool.description,
            snakeCaseName: snakeCase(name),
            camelCaseName,
            pascalCaseName,
            schema: jsonSchemaToZod(tool.parameters, {
              name: camelCaseName,
              type: pascalCaseName,
              module: "esm",
              noImport: true,
            }),
          };
        }),
      );

      const unformattedPrompt = `${schemas.length ? `import { z } from 'zod';` : ""}
import type { EvalAnywherePrompt } from './types';

${schemas?.map(({ schema }) => schema).join("\n\n")}

export const ${className}: EvalAnywherePrompt = {
  name: ${JSON.stringify(prompt.name)},
  version: ${version},
  model: ${JSON.stringify(prompt.model)},
  temperature: ${JSON.stringify(prompt.temperature)},
  system_prompt: ${JSON.stringify(prompt.system_prompt)},
  few_shot_messages: ${JSON.stringify(prompt.few_shot_messages, null, 2)},
  final_messages: ${JSON.stringify(prompt.final_messages, null, 2)},
  tools: [
    ${schemas
      .map(
        (tool) => `{
      name: ${JSON.stringify(tool.snakeCaseName)},
      description: ${JSON.stringify(tool.description)},
      parameters: ${tool.camelCaseName}
    }`,
      )
      .join(",\n")}
  ],
};
`;

      outputFiles.push({
        path: filePath + ".ts",
        contents: unformattedPrompt,
        lang: typescript,
      });
>>>>>>> da7c42c (refactor file handling)
    }

    outputFiles.push({
      path: "index.ts",
      lang: typescript,
      contents: `
export type { EvalAnywherePrompt } from './types';
${indexLines.join("\n")}
`.trim(),
    });

    return {
      success: true,
      files: await Promise.all(
<<<<<<< HEAD
=======
        // reformat all file contents with prettier for write out.
>>>>>>> da7c42c (refactor file handling)
        outputFiles.map(async (outputFile) => {
          return {
            ...outputFile,
            contents:
              outputFile.lang === typescript
                ? await prettier.format(outputFile.contents, {
                    parser: "typescript",
                  })
                : outputFile.contents,
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
