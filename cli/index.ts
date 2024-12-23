import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

import { program, Option } from "@commander-js/extra-typings";
import {
  languageCompilers,
  isSupportedLanguage,
  CompileConfig,
} from "./compile";
import { loadPrompts } from "./utils/load";
import { runEvals } from "./commands/eval";
import { writeFiles } from "./compile/write";

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
    const packageDir = __filename.split("dist")[0];

    if (!isSupportedLanguage(language)) {
      throw new Error(`Language "${language}" is not supported`);
    }

    await fsp.mkdir(outDir, { recursive: true });

    const cfg: CompileConfig = {
      lang: language,
      outDir: outDir,
      packageDir: packageDir!,
      prompts: await loadPrompts({ baseDir, glob: match }),
    };

    const res = await languageCompilers[language]!(cfg);
    if (res.success) {
      await writeFiles(cfg, res.files);
      console.log(`Successfully compiled prompts to ${outDir}`);
      process.exit(0);
    }
    console.error(`Unexpected error: `, res.error);
    process.exit(1);
  });

/**
 * Run all prompt evaluations
 */
program
  .command("eval")
  .argument("<dir>", "the directory in which to run evals")
  .addOption(globMatch)
  .action(async (dir, { match }) => {
    try {
      const out = resolveDirPathToCWD("./eval-results.json", {
        checkExistence: false,
      });
      const prompts = await loadPrompts({
        baseDir: resolveDirPathToCWD(dir),
        glob: match,
      });
      const results = await runEvals({
        prompts,
      });
      await fsp.writeFile(out, JSON.stringify(results, null, 2));

      console.log(`Results written to ${out}`);
    } catch (err) {
      console.error(`Unexpected error: `, err);
      process.exit(1);
    }
  });

(async () => {
  await program.parseAsync();
})();
