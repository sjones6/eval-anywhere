import { generateObject, generateText, LanguageModelV1 } from "ai";
import { loadModel } from "../utils/models.js";
import z from "zod";
import chalk from "chalk";
import {
  AlignmentCheck,
  Check,
  check,
  ExactMatch,
  ProfanityCheck,
} from "../schemas/check";
import { Prompt } from "../schemas/prompt";
import { Message } from "../schemas/message";

const checksSchema = z.array(check).min(1);

const defaultEvalModel = "openai@gpt-4o-mini";

export type CheckResult = {
  success: boolean;
  name: string;
  data: unknown;
};

export type EvaluationResult = {
  messages: Message[];
  content: string;
  model: string;
  provider: string;
  durationMS: number;
  checks: CheckResult[];
};

export type PromptWithResults = {
  prompt: Prompt;
  evaluationResults: EvaluationResult[];
};

export const runEvals = async ({
  prompts,
}: {
  prompts: Prompt[];
}): Promise<PromptWithResults[]> => {
  const promptResults: PromptWithResults[] = [];

  try {
    for (const { evaluation, ...prompt } of prompts) {
      if (!evaluation?.evaluations.length) {
        console.warn(chalk.bgMagenta(`No evals for ${prompt.name}`));
        continue;
      }

      console.log(chalk.yellow(`Running evals for prompt ${prompt.name}`));

      const modelProviderSlug = prompt.model ?? defaultEvalModel;
      const model = loadModel(modelProviderSlug);
      if (!model) {
        console.error(
          chalk.red(`Error: unsupported model ${modelProviderSlug}`),
        );
        continue;
      }

      const evaluationResults: EvaluationResult[] = [];

      let i = 0;
      for (const evalCase of evaluation.evaluations) {
        i++;

        const checksParsed = checksSchema.safeParse([
          ...(evaluation.checks ?? []),
          ...(evalCase.checks ?? []),
        ]);

        if (!checksParsed.success) {
          console.warn(
            chalk.bgMagenta(
              `Eval case ${i} of prompt "${prompt.name}" has invalid checks. This is a no-op`,
            ),
          );
          continue;
        }

        const evaluationResult = await runEvaluationChecks({
          model,
          prompt,
          checks: checksParsed.data,
          evalMessages: evalCase.messages,
        });

        evaluationResults.push(evaluationResult);
      }

      promptResults.push({
        prompt,
        evaluationResults,
      });
    }

    return promptResults;
  } catch (err) {
    console.error(
      `${chalk.bgRed("Err")}: Unexpected error thrown running evals ${err}`,
    );
    throw err;
  }
};

const runEvaluationChecks = async ({
  checks,
  evalMessages,
  model,
  prompt,
}: {
  checks: Check[];
  evalMessages: Message[];
  model: LanguageModelV1;
  prompt: Prompt;
}): Promise<EvaluationResult> => {
  const start = Date.now();
  const { text } = await generateText({
    model,
    system: prompt.system_prompt,
    messages: [
      ...(prompt.few_shot_messages ?? []),
      ...evalMessages,
      ...(prompt.final_messages ?? []),
    ],
    temperature: prompt.temperature,
  });
  const durMs = Date.now() - start;

  const results: CheckResult[] = [];

  for (const check of checks) {
    switch (check.id) {
      case "profanity":
        results.push(await profanityCheck(text, check, prompt));
        break;
      case "exact_match":
        results.push(await exactMatch(text, check));
        break;
      case "aligned":
        results.push(await aligned(text, check, prompt));
        break;
      case "custom":
      default:
        console.log(check, text);
    }
  }

  return {
    content: text,
    messages: evalMessages,
    model: model.modelId,
    provider: model.provider,
    durationMS: durMs,
    checks: results,
  };
};

export const aligned = async (
  text: string,
  aligned: AlignmentCheck,
  prompt: Prompt,
): Promise<CheckResult> => {
  const model = aligned.model ?? prompt.model ?? defaultEvalModel;
  const { object } = await generateObject({
    model: loadModel(model)!,
    system: `Your task is determine whether the user's message aligned with the expected value. Use your best judgment.`,
    messages: [
      {
        role: "assistant",
        content: aligned.instructions,
      },
      {
        role: "user",
        content: text,
      },
    ],
    schema: z.object({
      aligned: z
        .boolean()
        .describe(
          "Whether or not the supplied text matches what the user wanted.",
        ),
    }),
  });
  return {
    success: object.aligned,
    name: aligned.id,
    data: {
      model,
    },
  };
};

export const exactMatch = async (
  text: string,
  exactMatch: ExactMatch,
): Promise<CheckResult> => {
  const isMatch = exactMatch.case_insensitive
    ? text.toLowerCase() === exactMatch.value.toLowerCase()
    : text === exactMatch.value;
  return {
    success: isMatch,
    name: exactMatch.id,
    data: {
      case_insensitive: exactMatch.case_insensitive,
    },
  };
};

export const profanityCheck = async (
  text: string,
  check: ProfanityCheck,
  prompt: Prompt,
): Promise<CheckResult> => {
  const model = prompt.model ?? prompt.model ?? defaultEvalModel;
  const { object } = await generateObject({
    model: loadModel(model)!,
    system: `Your task is determine whether the user's message includes any profanity or vulgar words.
    
Here's a list of words that must not be included in any form: ${JSON.stringify(check.forbidden ?? [])}`,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
    schema: z.object({
      has_profanity: z
        .boolean()
        .describe(
          "Whether the supplied text includes the profanity or vulgar expressions.",
        ),
    }),
  });
  return {
    success: !object.has_profanity,
    name: check.id,
    data: {
      forbidden: check.forbidden,
      model,
    },
  };
};
