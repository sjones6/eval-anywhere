import path from "node:path";
import fs from "node:fs/promises";

import { program, Option } from "@commander-js/extra-typings";
import { languageCompilers, isSupportedLanguage } from "./compile";
import { loadPromptsAndEvals } from "./utils/load";
import { runEvals } from "./commands/eval";

const languages = Object.keys(languageCompilers);

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

/**
 * Compile prompts into target language files.
 */
program
  .command("compile")
  .argument("<dir>")
  .addOption(outDir)
  .addOption(format)
  .action(async (dir, { language, out }) => {
    const cwd = process.cwd();
    const outDir = path.isAbsolute(out) ? out : path.join(cwd, out);
    const fullDir = path.join(process.cwd(), dir.replace(/\/?$/, ""));
    const packageDir = __filename.split("dist")[0];

    if (!isSupportedLanguage(language)) {
      throw new Error(`Language "${language}" is not supported`);
    }

    await fs.mkdir(outDir, { recursive: true });

    const promptsAndEvals = await loadPromptsAndEvals({ dir: fullDir });
    const res = await languageCompilers[language]!({
      lang: language,
      outDir: outDir,
      packageDir: packageDir!,
      prompts: promptsAndEvals.map(({ prompt }) => prompt),
    });
    if (res.success) {
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
  .argument("<dir>")
  .action(async (dir) => {
    try {
      const fullDir = path.join(process.cwd(), dir.replace(/\/?$/, ""));
      await runEvals({
        promptsAndEvals: await loadPromptsAndEvals({ dir: fullDir }),
      });
    } catch (err) {
      console.error(`Unexpected error: `, err);
      process.exit(1);
    }
  });

(async () => {
  await program.parseAsync();
})();
