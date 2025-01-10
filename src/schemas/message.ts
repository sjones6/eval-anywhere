import { z } from "zod";

export const message = z.discriminatedUnion("role", [
  z
    .object({
      role: z
        .literal("user")
        .describe(
          "The assumed role of the entity responsible for this message.",
        ),
      content: z.string().describe("The content of the message."),
      name: z
        .string()
        .describe(
          "A name to assume in the context of few shot message. This is helpful to distinguish from real messages the user may send.",
        )
        .optional(),
    })
    .strict(),
  z
    .object({
      role: z
        .literal("assistant")
        .describe(
          "The assumed role of the entity responsible for this message.",
        ),
      content: z.string().describe("The content of the message."),
      tool_calls: z
        .array(
          z
            .object({
              id: z.string().describe("The ID of the function call"),
              function: z
                .object({
                  arguments: z
                    .string()
                    .describe("The stringified JSON arguments"),
                  name: z.string().describe("The name of the function to call"),
                })
                .strict(),
              type: z.literal("function"),
            })
            .strict(),
        )
        .min(1)
        .optional(),
    })
    .strict(),
  z
    .object({
      role: z
        .literal("tool")
        .describe(
          "The assumed role of the entity responsible for this message.",
        ),
      content: z.array(
        z.object({
          type: z.literal("tool-result"),
          toolCallId: z
            .string()
            .describe(
              "ID of the tool call that this result is associated with.",
            ),
          toolName: z
            .string()
            .describe("Name of the tool that generated this result."),
          result: z.union([
            z.object({}),
            z.boolean(),
            z.string(),
            z.number(),
            z.null(),
          ]),
          isError: z
            .boolean()
            .describe(
              "Optional flag if the result is an error or an error message.",
            ),
        }),
      ),
      tool_call_id: z
        .string()
        .describe("The ID of the tool call. Must match an actual tool call."),
    })
    .strict(),
]);
export type Message = z.infer<typeof message>;
