import { z } from "zod";

export const toolParameters = z
  .union([
    z
      .string()
      .describe(
        "A JSON schema definition of how the tool parameters should be constructed.",
      ),
    z.object({
      path: z
        .string()
        .regex(/^.*\.json$/, "must be a json file")
        .describe(
          "A relative path from the prompt file or absolute path to the JSON schema",
        ),
    }),
  ])
  .describe(
    "the parameters for the function call. Either the schema inlined or a path to a file to load it.",
  );

export type ToolParameters = z.infer<typeof toolParameters>;

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
    parameters: toolParameters,
  })
  .strict();
export type Tool = z.infer<typeof tool>;
