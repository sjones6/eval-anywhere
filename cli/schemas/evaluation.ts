import { z } from "zod";
import { check } from "./check";
import { message } from "./message";

export const evaluationCheck = z
  .object({
    name: z.string().describe("A name describing this evaluation").optional(),
    messages: z
      .array(message)
      .min(1)
      .describe("An array of messages to include run with the prompt."),
    checks: z
      .array(check)
      .min(1)
      .describe(
        "a list of checks to perform for this specific eval. Merged with the general list.",
      )
      .optional(),
  })
  .strict();

export type EvaluationCheck = z.infer<typeof evaluationCheck>;

export const evaluation = z
  .object({
    checks: z
      .array(check)
      .min(1)
      .describe("a list of checks to perform on every evaluation case.")
      .optional(),
    evaluations: z
      .array(evaluationCheck)
      .min(1)
      .describe("A list of evaluations to run"),
  })
  .strict()
  .describe(
    "A JSON schema for eval.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
  );
export type Evaluation = z.infer<typeof evaluation>;
