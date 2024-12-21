import { generateText, LanguageModelV1 } from "ai";
import { PromptWithEvals } from "../utils/load";
import { loadModel } from "../utils/models";
import z from "zod";
import { Check, check } from "../gen/check";
import { Prompt } from "../gen/prompt";
import { Message } from "../gen/message";

const checksSchema = z.array(check).min(1);

export const runEvals = async ({
  promptsAndEvals,
}: {
  promptsAndEvals: PromptWithEvals[];
}): Promise<void> => {
  for (const { prompt, evaluation } of promptsAndEvals) {
    if (!evaluation.evals.length) {
      continue;
    }

    const modelProviderSlug = prompt.model ?? "openai@gpt-4o-mini";
    const model = loadModel(modelProviderSlug);
    if (!model) {
      console.error(`Unsupported model: ${modelProviderSlug}`);
      continue;
    }

    let i = 0;
    for (const evalCase of evaluation.evals) {
      i++;

      const checksParsed = checksSchema.safeParse([
        ...(evaluation.checks ?? []),
        ...(evalCase.checks ?? []),
      ]);

      if (!checksParsed.success) {
        console.warn(
          `Eval case ${i} of prompt "${prompt.name}" has invalid checks. This is a no-op`,
        );
        continue;
      }

      await runEvaluationChecks({
        model,
        prompt,
        checks: checksParsed.data,
        evalMessages: evalCase.messages,
      });
    }
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
}): Promise<void> => {
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

  for (const check of checks) {
    switch (check.id) {
      default:
        console.log(check, text);
    }
  }
};
