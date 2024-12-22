import { z } from "zod";
import { models } from "./models";

export const profanityCheck = z
  .object({
    id: z.literal("profanity"),
    model: models.optional(),
    forbidden: z
      .array(z.string())
      .min(1)
      .describe(
        "a list of words or phrases that must not appear. Uses case-insensitive matching to determine if they're used. If omitted, a English language profanity check is performed.",
      )
      .optional(),
  })
  .strict()
  .describe("Check if profanity is included.");

export type ProfanityCheck = z.infer<typeof profanityCheck>;

export const alignmentCheck = z
  .object({
    id: z.literal("aligned"),
    model: models.optional(),
    instructions: z
      .string()
      .describe(
        "Instructions to give an LLM to determine if the task has been performed adequately.",
      ),
  })
  .strict()
  .describe("Check if returned value is roughly aligned.");

export type AlignmentCheck = z.infer<typeof alignmentCheck>;

export const exactMatch = z
  .object({
    id: z.literal("exact_match"),
    value: z.string().describe("The exact match to check against."),
    case_insensitive: z
      .boolean()
      .describe("Whether to perform the match in a case insensitive way.")
      .default(false),
  })
  .strict()
  .describe("Check if returned value is an exact match.");

export type ExactMatch = z.infer<typeof exactMatch>;

export const customCheck = z.object({
  id: z.literal("custom"),
  model: models.optional(),
  arguments: z.any(),
});

export type CustomCheck = z.infer<typeof customCheck>;

export const check = z.discriminatedUnion("id", [
  profanityCheck,
  alignmentCheck,
  exactMatch,
  customCheck,
]);

export type Check = z.infer<typeof check>;
