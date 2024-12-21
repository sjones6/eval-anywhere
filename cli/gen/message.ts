import { z } from "zod";

export const message = z.any().superRefine((x, ctx) => {
  const schemas = [
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
        content: z
          .union([
            z.string().describe("The content of the message."),
            z.null().describe("The content of the message."),
          ])
          .describe("The content of the message."),
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
                    name: z
                      .string()
                      .describe("The name of the function to call"),
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
        content: z
          .string()
          .describe("The stringified JSON of the tool call response."),
        tool_call_id: z
          .string()
          .describe("The ID of the tool call. Must match an actual tool call."),
      })
      .strict(),
  ];
  const errors = schemas.reduce<z.ZodError[]>(
    (errors, schema) =>
      ((result) => (result.error ? [...errors, result.error] : errors))(
        schema.safeParse(x),
      ),
    [],
  );
  if (schemas.length - errors.length !== 1) {
    ctx.addIssue({
      path: ctx.path,
      code: "invalid_union",
      unionErrors: errors,
      message: "Invalid input: Should pass single schema",
    });
  }
});
export type Message = z.infer<typeof message>;
