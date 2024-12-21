import { z } from "zod";

export const check = z
  .record(z.any())
  .and(
    z.union([
      z
        .object({
          id: z.string(),
          forbidden: z
            .array(z.string())
            .min(1)
            .describe(
              "a list of words or phrases that must not appear. Uses case-insensitive matching to determine if they're used. If omitted, a English language profanity check is performed.",
            )
            .optional(),
        })
        .strict()
        .describe("Check if profanity is included."),
      z
        .object({
          id: z.string(),
          instructions: z
            .string()
            .describe(
              "Instructions to give an LLM to determine if the task has been performed adequately.",
            ),
        })
        .strict()
        .describe("Check if returned value is roughtly aligned."),
      z
        .object({
          id: z.string(),
          value: z.string().describe("The exact match to check against."),
          case_insensitive: z
            .boolean()
            .describe("Whether to perform the match in a case insensitive way.")
            .default(false),
        })
        .strict()
        .describe("Check if returned value is an exact match."),
      z
        .object({ id: z.string().describe("the ID of the custom check.") })
        .catchall(z.any())
        .describe("Check if returned value is an exact match."),
    ]),
  )
  .describe("An eval check to perform on the response.");
export type Check = z.infer<typeof check>;
