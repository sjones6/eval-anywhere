import { z } from "zod";

export const tool = z
  .object({
    name: z
      .string()
      .describe(
        "The name of the tool function. This should be descriptive as to what the tool does.",
      ),
    description: z
      .string()
      .describe(
        "The description of the function. This should be meaningful to LLMs to aid in guiding the LLM to select this tool.",
      ),
    parameters: z
      .string()
      .describe(
        "A JSON schema definition of how the tool parameters should be constructed.",
      ),
  })
  .strict();
export type Tool = z.infer<typeof tool>;
