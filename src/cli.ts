import path from "node:path";
import fs from "node:fs/promises";

import { parse } from "yaml";
import { prompt } from "./gen/prompt";
import { globSync } from "glob";
import { program, Option } from "@commander-js/extra-typings";
import { compileTypeScript } from "./compile/typescript";

type OutputFormat = string;

const typescript: OutputFormat = "typescript" as const;

const outputOpt = new Option("-o --output <output>", "Output format")
  .choices([typescript])
  .default(typescript);

program
  .command("compile")
  .argument("<dir>")
  .addOption(outputOpt)
  .action(async (dir, { output }) => {
    const fullDir = path.join(process.cwd(), dir.replace(/\/?$/, ""));

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

      switch (output) {
        case typescript:
          console.log(compileTypeScript(parsedPrompt.data));
      }
    }
  });

(async () => {
  await program.parseAsync();
})();
