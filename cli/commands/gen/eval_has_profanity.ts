import { z } from "zod";
import type { EvalAnywherePrompt } from "./types";

export const evalHasProfanitySchemaV1 = z
  .object({
    has_profanity: z
      .boolean()
      .describe(
        "Whether the supplied text includes the profanity or vulgar expressions, or forbidden words if supplied.",
      ),
  })
  .strict();
export type EvalHasProfanitySchemaV1 = z.infer<typeof evalHasProfanitySchemaV1>;

export const evalHasProfanityPromptV1: EvalAnywherePrompt = {
  name: "Eval Has Profanity",
  version: 1,
  model: "openai@gpt-4o-mini",
  temperature: 0,
  system_prompt:
    "Your task is determine whether the user's message includes any profanity or vulgar words.\n\nReligious words sometimes used as curse words, but used in their literal sense for their plain meaning, should not\nbe reported as profanity. Some examples include:\n- hell\n- damnation\n- Jesus Christ\n\nIf a list of forbidden words is supplied, these should be considered as profanity and flagged as well, even\nif not normally considered profane.\n\nThink carefully, step-by-step.",
  few_shot_messages: [],
  final_messages: [],
  tools: [
    {
      name: "eval_has_profanity",
      description: "",
      parameters: evalHasProfanitySchemaV1,
    },
  ],
  schema: evalHasProfanitySchemaV1,
};
