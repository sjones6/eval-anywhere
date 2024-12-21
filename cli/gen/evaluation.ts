import { z } from "zod";

export const evaluation = z
  .object({
    checks: z
      .array(
        z
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
                  value: z
                    .string()
                    .describe("The exact match to check against."),
                  case_insensitive: z
                    .boolean()
                    .describe(
                      "Whether to perform the match in a case insensitive way.",
                    )
                    .default(false),
                })
                .strict()
                .describe("Check if returned value is an exact match."),
              z
                .object({
                  id: z.string().describe("the ID of the custom check."),
                })
                .catchall(z.any())
                .describe("Check if returned value is an exact match."),
            ]),
          )
          .describe("An eval check to perform on the response."),
      )
      .min(1)
      .describe("a list of checks to perform on every eval")
      .optional(),
    evals: z
      .array(
        z
          .object({
            messages: z
              .array(
                z.any().superRefine((x, ctx) => {
                  const schemas = [
                    z
                      .object({
                        role: z
                          .literal("user")
                          .describe(
                            "The assumed role of the entity responsible for this message.",
                          ),
                        content: z
                          .string()
                          .describe("The content of the message."),
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
                                id: z
                                  .string()
                                  .describe("The ID of the function call"),
                                function: z
                                  .object({
                                    arguments: z
                                      .string()
                                      .describe(
                                        "The stringified JSON arguments",
                                      ),
                                    name: z
                                      .string()
                                      .describe(
                                        "The name of the function to call",
                                      ),
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
                          .describe(
                            "The stringified JSON of the tool call response.",
                          ),
                        tool_call_id: z
                          .string()
                          .describe(
                            "The ID of the tool call. Must match an actual tool call.",
                          ),
                      })
                      .strict(),
                  ];
                  const errors = schemas.reduce<z.ZodError[]>(
                    (errors, schema) =>
                      ((result) =>
                        result.error ? [...errors, result.error] : errors)(
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
                }),
              )
              .min(1)
              .describe("An array of messages to include run with the prompt.")
              .optional(),
            checks: z
              .array(z.any())
              .min(1)
              .describe(
                "a list of checks to perform for this specific eval. Merged with the general list.",
              )
              .optional(),
          })
          .strict(),
      )
      .min(1)
      .describe("A list of evals to run"),
  })
  .strict()
  .describe(
    "A JSON schema for eval.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
  );
export type Evaluation = z.infer<typeof evaluation>;
