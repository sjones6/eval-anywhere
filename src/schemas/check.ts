import { z } from "zod";
import { models } from "./models";

export const baseCheck = z.object({
  id: z.string(),
  name: z
    .string()
    .describe("An optional name describing the check.")
    .optional(),
});

export type BaseCheck = z.infer<typeof baseCheck>;

export const profanityCheck = baseCheck
  .extend({
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

profanityCheck.shape.id._def.value;

export type ProfanityCheck = z.infer<typeof profanityCheck>;

export const alignmentCheck = baseCheck
  .extend({
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

export const exactMatch = baseCheck
  .extend({
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

export const toolCallCheck = baseCheck
  .extend({
    id: z.literal("tool_call"),
    tool_calls: z.array(
      z.object({
        tool_name: z.string().describe("the name of the tool called"),
        args: z
          .union([
            z.string(),
            z.record(z.string(), z.any()),
            z.null(),
            z.number(),
            z.boolean(),
            z.array(z.any()),
          ])
          .describe("the arguments passed for the tool call."),
      }),
    ),
  })
  .strict()
  .describe("Determine if a tool call is made appropriately.");

export type ToolCall = z.infer<typeof toolCallCheck>;

export const structuredOutputCheck = baseCheck
  .extend({
    id: z.literal("structured_output"),
    result: z
      .union([
        z.string().describe("the JSON object"),
        z
          .object({
            path: z
              .string()
              .describe(
                "An absolute or relative path where the result can be loaded from",
              ),
          })
          .describe("a path where the "),
        z.any(),
      ])
      .describe("the response from a structured output call."),
  })
  .strict()
  .describe("Check structured ouptut for equivalence.");

export type StructuredOutput = z.infer<typeof structuredOutputCheck>;

export const customCheck = baseCheck
  .extend({
    model: models.optional(),
  })
  .describe("A user-defined custom check.");

export type CustomCheck = z.infer<typeof customCheck>;

export const checks = [
  toolCallCheck,
  profanityCheck,
  alignmentCheck,
  structuredOutputCheck,
  exactMatch,
  customCheck,
] as const;
