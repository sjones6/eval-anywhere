import { languageCompilers } from "../compile";
import { OutputFile, CompileConfig, CompileFn } from "../compile/types";
import {
  CustomCheck,
  CustomCheckFn,
  defineCustomCheck,
  PromptWithResults,
  SchemaCheckBase,
} from "../evals/types";
import { ResolvedPrompt } from "../utils/load";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger";
import { Models } from "../schemas/models";
import { defaultChecks } from "../evals/checks";
import { run } from "../cli/index";
import { runEvals } from "../evals";

export type AnywhereConfig = {
  logger: Logger;
  defaultModel: Models;
  checks: CustomCheck<any>[];
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
  // TODO: add ability to inject new model providers
  // addModelProvider(): Anywhere;
  eval(prompts: ResolvedPrompt[]): Promise<PromptWithResults[]>;
  compile(cfg: CompileConfig, prompts: ResolvedPrompt[]): Promise<OutputFile[]>;
  run(): Promise<void>;
};

export function anywhere({
  logger = defaultLogger,
  checks = defaultChecks,
  defaultModel = "openai@gpt-4o-mini",
}: Partial<AnywhereConfig> = {}): Anywhere {
  const compilers = { ...languageCompilers };
  const config: AnywhereConfig = {
    logger,
    checks: [...checks],
    defaultModel,
  };

  const obj: Anywhere = {
    config,
    addEvaluationCheck(schema, check) {
      config.checks.unshift(defineCustomCheck(schema, check));
      return obj;
    },
    addCompiler(lang, fn) {
      compilers[lang] = fn;
      return obj;
    },
    eval(prompts: ResolvedPrompt[]) {
      return runEvals({
        prompts,
        anywhere: obj,
      });
    },
    async compile() {
      return [];
    },
    run() {
      logger.info("Starting eval anywhere");
      return run(obj);
    },
  };
  return obj;
}
