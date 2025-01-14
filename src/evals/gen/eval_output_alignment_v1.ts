import { z } from "zod";
import type { EvalAnywherePrompt } from "./types";

export const evalOutputAlignmentSchemaV1 = z
  .object({
    aligned: z
      .boolean()
      .describe(
        "Whether or not the supplied text matches what the user wanted.",
      ),
  })
  .strict();
export type EvalOutputAlignmentSchemaV1 = z.infer<
  typeof evalOutputAlignmentSchemaV1
>;

export const evalOutputAlignmentPromptV1: EvalAnywherePrompt = {
  name: "Eval Output Alignment",
  version: 1,
  model: "openai@gpt-4o-mini",
  temperature: 0,
  systemPrompt:
    "Your task is determine whether the user's message aligned with the expected value. Use your best judgment.",
  schema: evalOutputAlignmentSchemaV1,
};
