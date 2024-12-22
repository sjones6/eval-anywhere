import { z } from "zod";
import { models } from "./models";
import { message } from "./message";
import { tool } from "./tool";
import { evaluation } from "./evaluation";

export const messages = z.array(message).min(1);

export const promptNoEval = z
  .object({
    name: z
      .string()
      .describe(
        "The name of the prompt. For output, this will be turned into camel case.",
      ),
    model: models
      .describe(
        "The default model to use with this prompt. Ultimately, the target runtime will choose a supported prompt.",
      )
      .optional(),
    few_shot_messages: messages
      .describe("An array of few shot messages to include in the prompt.")
      .optional(),
    final_messages: messages
      .describe(
        "An array of messages to include _after_ the users messages are inserted. These are helpful for providing guidance and guardrails as the final thing the model sees.",
      )
      .optional(),
    version: z
      .number()
      .int()
      .gte(1)
      .describe("The version of the prompt.")
      .default(1),
    system_prompt: z
      .string()
      .describe("The system prompt to use for the prompt."),
    temperature: z
      .number()
      .gte(0)
      .lte(2)
      .describe(
        "A number between 0 and 2 that controls the randomness of the response. Lower numbers result in less random (although still random) responses.",
      )
      .default(0),
    tools: z
      .array(tool)
      .min(1)
      .describe("A list of tools available to the prompt")
      .optional(),
  })
  .strict()
  .describe(
    "A JSON schema for prompt.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
  );

export type PromptNoEval = z.infer<typeof promptNoEval>;

export const prompt = promptNoEval.extend({
  evaluation: evaluation.optional(),
});

export type Prompt = z.infer<typeof prompt>;
