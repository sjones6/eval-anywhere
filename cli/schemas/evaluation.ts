import { z } from "zod";
import { check } from "./check";
import { message } from "./message";

export const evaluation = z
  .object({
    checks: z
      .array(check)
      .min(1)
      .describe("a list of checks to perform on every eval")
      .optional(),
    evals: z
      .array(
        z
          .object({
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
          .strict(),
      )
      .min(1)
      .describe("A list of evals to run"),
  })
  .strict()
  .describe(
    "A JSON schema for eval.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
  );
export type Evaluation = z.infer<typeof evaluation>;
