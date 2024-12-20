import path from "node:path";
import fs from "node:fs/promises";

import { parse } from "yaml";
import { prompt } from "./gen/prompt";
import { globSync } from "glob";
import { program, Option } from "@commander-js/extra-typings";
import {
  languageCompilers,
  CompileConfig,
  CompileFn,
  isSupportedLanguage,
} from "./compile";

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
      throw new Error(`Language ${language} is not supported`);
    }

    await fs.mkdir(outDir, { recursive: true });

    const cfg: CompileConfig = {
      lang: language,
      outDir: outDir,
      packageDir: packageDir!,
      prompts: [],
    };

    const files = globSync(`${fullDir}/**/prompt.yaml`, {
      stat: true,
      withFileTypes: true,
    }).filter((path) => !!path && path.mode !== undefined && path.mode & 0o040);

    if (!files.length) {
      console.log(`No matching files found in ${fullDir}`);
    }

    for (const file of files) {
      const promptContents = await fs.readFile(file.fullpath(), "utf-8");
      const promptAsYaml = parse(promptContents);
      const parsedPrompt = prompt.safeParse(promptAsYaml);

      if (!parsedPrompt.success) {
        console.error("prompt invalid", parsedPrompt.error);
        throw new Error("failed to parse prompt");
      }

      cfg.prompts.push(parsedPrompt.data);
    }

    await doCompile({
      fn: languageCompilers[language]!,
      cfg,
    });
  });

const doCompile = async ({
  fn,
  cfg,
}: {
  fn: CompileFn;
  cfg: CompileConfig;
}): Promise<void> => {
  const res = await fn(cfg);
  if (res.success) {
    console.log(`Successfully compiled prompts to ${cfg.outDir}`);
    return;
  }

  console.error(`Unexpected error: `, res.error);
};

(async () => {
  await program.parseAsync();
})();
