import { PromptWithEvals } from "../utils/load";

export enum EvalModelProvider {
  openai = "openai",
  anthropic = "anthropic",
  google = "google",
}

export const runEvals = async ({
  promptsAndEvals,
}: {
  promptsAndEvals: PromptWithEvals[];
}): Promise<void> => {
  for (const { prompt, evaluation } of promptsAndEvals) {
    if (!evaluation.evals.length) {
      continue;
    }

    // next: actually run evaluations
    console.log({
      prompt,
      evaluation,
    });
  }

  console.log(JSON.stringify(promptsAndEvals, null, 2));
};
