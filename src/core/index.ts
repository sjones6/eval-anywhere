import fs from "node:fs";
import path from "node:path";
import { languageCompilers } from "../compile";
import { OutputFile, CompileConfig, CompileFn } from "../compile/types";
import {
  CustomCheck,
  CustomCheckFn,
  defineCustomCheck,
  PromptWithResults,
  SchemaCheckBase,
} from "../evals/types";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { Models } from "../schemas/models";
import { defaultChecks } from "../evals/checks";
import { run } from "../cli/index";
import { runEvals } from "../evals";
import { Prompt } from "./types";
import { promptSchematoJsonSchema } from "../schemas/json-schema";

export type AnywhereConfig = {
  logger: Logger;
  defaultModel: Models;
  checks: CustomCheck<any>[];
  schemaPath: string;
};

export type Anywhere = {
  config: AnywhereConfig;

  /**
   * Define a new custom check definition for evals.
   *
   * If the ID of check conflicts with any default evaluation check provided by the framework,
   * the custom check will overwrite the default check.
   *
   * @param check the custom check definition to add
   */
  addEvaluationCheck<Schema extends SchemaCheckBase>(
    schema: Schema,
    check: CustomCheckFn<Schema>,
  ): Anywhere;

  /**
   * Add a language compile that compiles prompts into language files.
   *
   * If the language compiler conflicts with any default compiler provided by the framework,
   * it will overwrite the default compiler.
   *
   * @param lang the language slug
   * @param fn   a function that takes a compilation config and returns compiled prompts
   */
  addCompiler(lang: string, fn: CompileFn): Anywhere;

  /**
   * Prints schema, including any custom definitions if used.
   *
   * @param out file path to print schema
   */
  printPromptSchema(out?: string): void;

  // TODO: add ability to inject new model providers
  // addModelProvider(): Anywhere;

  eval(prompts: Prompt[]): Promise<PromptWithResults[]>;
  compile(cfg: CompileConfig, prompts: Prompt[]): Promise<OutputFile[]>;
  run(): Promise<void>;
};

export function anywhere({
  logger = defaultLogger,
  checks = defaultChecks,
  defaultModel = "openai@gpt-4o-mini",
  schemaPath = "anywhere-prompt-schema.json",
}: Partial<AnywhereConfig> = {}): Anywhere {
  const compilers = { ...languageCompilers };
  const config: AnywhereConfig = {
    logger,
    checks: [...checks],
    defaultModel,
    schemaPath,
  };

  const obj: Anywhere = {
    config,
    addEvaluationCheck(schema, check) {
      obj.config.checks.unshift(defineCustomCheck(schema, check));
      return obj;
    },
    addCompiler(lang, fn) {
      compilers[lang] = fn;
      return obj;
    },
    eval(prompts: Prompt[]) {
      return runEvals({
        prompts,
        anywhere: obj,
      });
    },
    printPromptSchema(out?: string) {
      const schema = promptSchematoJsonSchema(
        obj.config.checks.map(({ schema }) => schema),
      );
      fs.writeFileSync(
        path.join(process.cwd(), out || schemaPath),
        JSON.stringify(schema, null, 2),
      );
    },
    async compile() {
      return [];
    },
    run() {
      return run(obj);
    },
  };
  return obj;
}
