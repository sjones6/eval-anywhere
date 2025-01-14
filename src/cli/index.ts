import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

import { program, Option } from "@commander-js/extra-typings";
import {
  languageCompilers,
  isSupportedLanguage,
  CompileConfig,
} from "../compile";
import { loadPrompts } from "../utils/load";
import { writeFiles } from "../compile/write";
import { Anywhere } from "../core";
import { createPromptSchema } from "../schemas/prompt";

const languages = Object.keys(languageCompilers);

const globMatch = new Option(
  "-m --match <match>",
  "The match pattern to search for prompts. Defaults to **/*prompt.{yaml,yml}",
).default("**/*prompt.{yaml,yml}");

const format = new Option(
  "-l --language <language>",
  "The output language for the prompts",
)
  .choices(languages)
  .default(languages[0]!);

const outDir = new Option(
  "-o --out <out>",
  "The output directory in which to write the prompts.",
).makeOptionMandatory();

const resolveDirPathToCWD = (
  dir: string,
  {
    checkExistence = true,
  }: {
    checkExistence?: boolean;
  } = {},
): string => {
  const dirPath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
  if (checkExistence && !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  return dirPath;
};

export const run = async (anywhere: Anywhere): Promise<void> => {
  /**
   * Compile prompts into target language files.
   */
  program
    .command("compile")
    .argument(
      "<dir>",
      "the directory in which to perform the search for prompts, absolute path or relative to current working directory",
    )
    .addOption(outDir)
    .addOption(globMatch)
    .addOption(format)
    .action(async (dir, { language, out, match }) => {
      const baseDir = resolveDirPathToCWD(dir);
      const outDir = resolveDirPathToCWD(out, {
        checkExistence: false,
      });
      const packageDir = __filename.includes("dist")
        ? __filename.split("dist")[0]!
        : process.cwd();

      if (!isSupportedLanguage(language)) {
        throw new Error(`Language "${language}" is not supported`);
      }

      await fsp.mkdir(outDir, { recursive: true });

      const cfg: CompileConfig = {
        lang: language,
        outDir: outDir,
        packageDir: packageDir,
        prompts: await loadPrompts({
          baseDir,
          glob: match,
          promptSchema: createPromptSchema(
            anywhere.config.checks.map(({ schema }) => schema),
          ),
        }),
      };

      const res = await languageCompilers[language]!(cfg);
      if (res.success) {
        await writeFiles(cfg, res.files);
        anywhere.config.logger.info(
          {
            dir: outDir,
            language,
          },
          "Successfully compiled prompts",
        );
        process.exit(0);
      }
      anywhere.config.logger.error(
        {
          error: res.error,
        },
        `Unexpected error: `,
      );
      process.exit(1);
    });

  /**
   * Run all prompt evaluations
   */
  program
    .command("eval")
    .argument("<dir>", "the directory in which to run evals")
    .addOption(globMatch)
    .addOption(
      new Option(
        "-o --out <out>",
        "Relative path where to write the schema.",
      ).default("eval-results.json"),
    )
    .action(async (dir, { match, out }) => {
      try {
        anywhere.config.logger.info("Starting evals ...");
        const outPath = resolveDirPathToCWD(out, {
          checkExistence: false,
        });
        const prompts = await loadPrompts({
          baseDir: resolveDirPathToCWD(dir),
          glob: match,
          promptSchema: createPromptSchema(
            anywhere.config.checks.map(({ schema }) => schema),
          ),
        });
        const results = await anywhere.eval(prompts.map((p) => p.prompt));

        await fsp.mkdir(path.dirname(outPath), { recursive: true });
        await fsp.writeFile(outPath, JSON.stringify(results, null, 2));

        anywhere.config.logger.info(
          {
            results: outPath,
          },
          "Results written to file.",
        );
        anywhere.config.logger.info("Eval run complete.");
      } catch (error) {
        anywhere.config.logger.error(
          {
            error,
          },
          "Unexpected error running evals",
        );
        process.exit(1);
      }
    });

  /**
   * Print the prompt schema, along with any relevant customizations.
   */
  program
    .command("schema")
    .addOption(
      new Option("-o --out <out>", "Relative path where to write the schema."),
    )
    .action(async ({ out }) => {
      try {
        anywhere.printPromptSchema(out);
        process.exit(0);
      } catch (error) {
        anywhere.config.logger.error(
          {
            error,
          },
          "Unexpected error printing schema",
        );
        process.exit(1);
      }
    });

  await program.parseAsync();
};
