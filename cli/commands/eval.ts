import { generateObject, generateText, LanguageModelV1 } from "ai";
import { PromptWithEvals } from "../utils/load";
import { loadModel } from "../utils/models";
import z from "zod";
import { AlignmentCheck, Check, check, ExactMatch, ProfanityCheck } from "../schemas/check";
import { Prompt } from "../schemas/prompt";
import { Message } from "../schemas/message";

const checksSchema = z.array(check).min(1);

const defaultEvalModel = "openai@gpt-4o-mini";

export const runEvals = async ({
  promptsAndEvals,
}: {
  promptsAndEvals: PromptWithEvals[];
}): Promise<void> => {
  for (const { prompt, evaluation } of promptsAndEvals) {
    console.log(`runnign evals for prompt ${prompt.name}`);

    if (!evaluation.evals.length) {
      continue;
    }

    const modelProviderSlug = prompt.model ?? defaultEvalModel;
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
      case "profanity":
        const hasProfanity = await profanityCheck(text, check, prompt);
        console.log("hasProfanity", hasProfanity);
        break;
      case "exact_match":
        const hasExactMatch = await exactMatch(text, check);
        console.log("match", hasExactMatch);
        break;
      case "aligned":
        const isAligned = await aligned(text, check, prompt);
        console.log("aligned", isAligned);
        break;
      case "custom":
      default:
        console.log(check, text);
    }
  }
};

export const aligned = async (
  text: string,
  aligned: AlignmentCheck,
  prompt: Prompt,
) : Promise<boolean> => {
  const { object } = await generateObject({
    model: loadModel(aligned.model ?? prompt.model ?? defaultEvalModel)!,
    system: `Your task is determine whether the user's message aligned with the expected value. User your best judgment.`,
    messages: [
      {
        role: 'assistant',
        content: aligned.instructions
      },
      {
        role: "user",
        content: text
      }
    ],
    schema: z.object({
      aligned: z.boolean().describe("Whether or not the supplied text matches what the user wanted.")
    })
  });
  return object.aligned;
}

export const exactMatch = async (
  text: string,
  exactMatch: ExactMatch,
) : Promise<boolean> => {
  if (exactMatch.case_insensitive) {
    return text.toLowerCase() === exactMatch.value.toLowerCase();
  }
  return text === exactMatch.value;
}

export const profanityCheck = async (
  text: string,
  check: ProfanityCheck,
  prompt: Prompt,
): Promise<boolean> => {
  const { object } = await generateObject({
    model: loadModel(prompt.model ?? prompt.model ?? defaultEvalModel)!,
    system: `Your task is determine whether the user's message includes any profanity or vulgar words.
    
Here's a list of words that must not be included in any form: ${JSON.stringify(check.forbidden ?? [])}`,
    messages: [
      {
        role: "user",
        content: text
      }
    ],
    schema: z.object({
      has_profanity: z.boolean().describe("Whether the supplied text includes the profanity or vulgar expressions.")
    })
  });
  return object.has_profanity;
};
