import { z } from "zod";

export const evaluation = z
  .object({
    checks: z
      .array(
        z
          .union([
            z
              .object({
                id: z.any(),
                model: z
                  .enum([
                    "anthropic@claude-3-5-sonnet-20241022",
                    "anthropic@claude-3-5-sonnet-latest",
                    "anthropic@claude-3-5-haiku-20241022",
                    "anthropic@claude-3-5-haiku-latest",
                    "anthropic@claude-3-opus-20240229",
                    "anthropic@claude-3-opus-latest",
                    "anthropic@claude-3-sonnet-20240229",
                    "anthropic@claude-3-haiku-20240307",
                    "bedrock@ai21.jamba-1-5-large-v1:0",
                    "bedrock@ai21.jamba-1-5-mini-v1:0",
                    "bedrock@ai21.jamba-instruct-v1:0",
                    "bedrock@amazon.nova-lite-v1:0",
                    "bedrock@amazon.nova-micro-v1:0",
                    "bedrock@amazon.nova-pro-v1:0",
                    "bedrock@amazon.rerank-v1:0",
                    "bedrock@amazon.titan-embed-text-v1",
                    "bedrock@amazon.titan-embed-text-v2:0",
                    "bedrock@amazon.titan-text-express-v1",
                    "bedrock@amazon.titan-text-lite-v1",
                    "bedrock@amazon.titan-text-premier-v1:0",
                    "bedrock@amazon.titan-tg1-large",
                    "bedrock@anthropic.claude-v2",
                    "bedrock@anthropic.claude-v2:1",
                    "bedrock@anthropic.claude-3-haiku-20240307-v1:0",
                    "bedrock@anthropic.claude-3-opus-20240229-v1:0",
                    "bedrock@anthropic.claude-3-sonnet-20240229-v1:0",
                    "bedrock@anthropic.claude-3-5-haiku-20241022-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20241022-v2:0",
                    "bedrock@anthropic.claude-instant-v1",
                    "bedrock@cohere.command-text-v14",
                    "bedrock@cohere.command-light-text-v14",
                    "bedrock@cohere.command-r-v1:0",
                    "bedrock@cohere.command-r-plus-v1:0",
                    "bedrock@cohere.embed-english-v3",
                    "bedrock@cohere.embed-multilingual-v3",
                    "bedrock@cohere.rerank-v3-5:0",
                    "bedrock@meta.llama3-70b-instruct-v1:0",
                    "bedrock@meta.llama3-8b-instruct-v1:0",
                    "bedrock@meta.llama3-1-405b-instruct-v1:0",
                    "bedrock@meta.llama3-1-70b-instruct-v1:0",
                    "bedrock@meta.llama3-1-8b-instruct-v1:0",
                    "bedrock@meta.llama3-2-11b-instruct-v1:0",
                    "bedrock@meta.llama3-2-1b-instruct-v1:0",
                    "bedrock@meta.llama3-2-3b-instruct-v1:0",
                    "bedrock@meta.llama3-2-90b-instruct-v1:0",
                    "bedrock@meta.llama3-3-70b-instruct-v1:0",
                    "bedrock@mistral.mistral-7b-instruct-v0:2",
                    "bedrock@mistral.mistral-large-2402-v1:0",
                    "bedrock@mistral.mistral-large-2407-v1:0",
                    "bedrock@mistral.mistral-small-2402-v1:0",
                    "bedrock@mistral.mixtral-8x7b-instruct-v0:1",
                    "cohere@command-r7b-12-2024",
                    "cohere@command-r-plus-08-2024",
                    "cohere@command-r-plus-04-2024",
                    "cohere@command-r-plus",
                    "cohere@command-r-08-2024",
                    "cohere@command-r-03-2024",
                    "cohere@command-r",
                    "cohere@command",
                    "cohere@command-nightly",
                    "cohere@command-light",
                    "cohere@command-light-nightly",
                    "cohere@c4ai-aya-expanse-8b",
                    "cohere@c4ai-aya-expanse-32b",
                    "gemini@gemini-1.5-pro",
                    "gemini@gemini-1.5-flash-8b",
                    "gemini@gemini-1.5-flash",
                    "openai@gpt-4o",
                    "openai@gpt-4o-2024-08-06",
                    "openai@gpt-4o-mini",
                    "openai@gpt-4o-mini-2024-07-18",
                    "openai@o1",
                    "openai@o1-2024-12-17",
                    "openai@o1-mini",
                    "openai@o1-mini-2024-09-12",
                    "groq@distil-whisper-large-v3-en",
                    "groq@gemma2-9b-it",
                    "groq@llama-3.3-70b-versatile",
                    "groq@llama-3.1-8b-instant",
                    "groq@mixtral-8x7b-32768",
                  ])
                  .describe(
                    "List of model with providers, using the format {provider}@{model-slug}",
                  )
                  .optional(),
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
                id: z.any(),
                model: z
                  .enum([
                    "anthropic@claude-3-5-sonnet-20241022",
                    "anthropic@claude-3-5-sonnet-latest",
                    "anthropic@claude-3-5-haiku-20241022",
                    "anthropic@claude-3-5-haiku-latest",
                    "anthropic@claude-3-opus-20240229",
                    "anthropic@claude-3-opus-latest",
                    "anthropic@claude-3-sonnet-20240229",
                    "anthropic@claude-3-haiku-20240307",
                    "bedrock@ai21.jamba-1-5-large-v1:0",
                    "bedrock@ai21.jamba-1-5-mini-v1:0",
                    "bedrock@ai21.jamba-instruct-v1:0",
                    "bedrock@amazon.nova-lite-v1:0",
                    "bedrock@amazon.nova-micro-v1:0",
                    "bedrock@amazon.nova-pro-v1:0",
                    "bedrock@amazon.rerank-v1:0",
                    "bedrock@amazon.titan-embed-text-v1",
                    "bedrock@amazon.titan-embed-text-v2:0",
                    "bedrock@amazon.titan-text-express-v1",
                    "bedrock@amazon.titan-text-lite-v1",
                    "bedrock@amazon.titan-text-premier-v1:0",
                    "bedrock@amazon.titan-tg1-large",
                    "bedrock@anthropic.claude-v2",
                    "bedrock@anthropic.claude-v2:1",
                    "bedrock@anthropic.claude-3-haiku-20240307-v1:0",
                    "bedrock@anthropic.claude-3-opus-20240229-v1:0",
                    "bedrock@anthropic.claude-3-sonnet-20240229-v1:0",
                    "bedrock@anthropic.claude-3-5-haiku-20241022-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20241022-v2:0",
                    "bedrock@anthropic.claude-instant-v1",
                    "bedrock@cohere.command-text-v14",
                    "bedrock@cohere.command-light-text-v14",
                    "bedrock@cohere.command-r-v1:0",
                    "bedrock@cohere.command-r-plus-v1:0",
                    "bedrock@cohere.embed-english-v3",
                    "bedrock@cohere.embed-multilingual-v3",
                    "bedrock@cohere.rerank-v3-5:0",
                    "bedrock@meta.llama3-70b-instruct-v1:0",
                    "bedrock@meta.llama3-8b-instruct-v1:0",
                    "bedrock@meta.llama3-1-405b-instruct-v1:0",
                    "bedrock@meta.llama3-1-70b-instruct-v1:0",
                    "bedrock@meta.llama3-1-8b-instruct-v1:0",
                    "bedrock@meta.llama3-2-11b-instruct-v1:0",
                    "bedrock@meta.llama3-2-1b-instruct-v1:0",
                    "bedrock@meta.llama3-2-3b-instruct-v1:0",
                    "bedrock@meta.llama3-2-90b-instruct-v1:0",
                    "bedrock@meta.llama3-3-70b-instruct-v1:0",
                    "bedrock@mistral.mistral-7b-instruct-v0:2",
                    "bedrock@mistral.mistral-large-2402-v1:0",
                    "bedrock@mistral.mistral-large-2407-v1:0",
                    "bedrock@mistral.mistral-small-2402-v1:0",
                    "bedrock@mistral.mixtral-8x7b-instruct-v0:1",
                    "cohere@command-r7b-12-2024",
                    "cohere@command-r-plus-08-2024",
                    "cohere@command-r-plus-04-2024",
                    "cohere@command-r-plus",
                    "cohere@command-r-08-2024",
                    "cohere@command-r-03-2024",
                    "cohere@command-r",
                    "cohere@command",
                    "cohere@command-nightly",
                    "cohere@command-light",
                    "cohere@command-light-nightly",
                    "cohere@c4ai-aya-expanse-8b",
                    "cohere@c4ai-aya-expanse-32b",
                    "gemini@gemini-1.5-pro",
                    "gemini@gemini-1.5-flash-8b",
                    "gemini@gemini-1.5-flash",
                    "openai@gpt-4o",
                    "openai@gpt-4o-2024-08-06",
                    "openai@gpt-4o-mini",
                    "openai@gpt-4o-mini-2024-07-18",
                    "openai@o1",
                    "openai@o1-2024-12-17",
                    "openai@o1-mini",
                    "openai@o1-mini-2024-09-12",
                    "groq@distil-whisper-large-v3-en",
                    "groq@gemma2-9b-it",
                    "groq@llama-3.3-70b-versatile",
                    "groq@llama-3.1-8b-instant",
                    "groq@mixtral-8x7b-32768",
                  ])
                  .describe(
                    "List of model with providers, using the format {provider}@{model-slug}",
                  )
                  .optional(),
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
                id: z.any(),
                value: z.string().describe("The exact match to check against."),
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
                model: z
                  .enum([
                    "anthropic@claude-3-5-sonnet-20241022",
                    "anthropic@claude-3-5-sonnet-latest",
                    "anthropic@claude-3-5-haiku-20241022",
                    "anthropic@claude-3-5-haiku-latest",
                    "anthropic@claude-3-opus-20240229",
                    "anthropic@claude-3-opus-latest",
                    "anthropic@claude-3-sonnet-20240229",
                    "anthropic@claude-3-haiku-20240307",
                    "bedrock@ai21.jamba-1-5-large-v1:0",
                    "bedrock@ai21.jamba-1-5-mini-v1:0",
                    "bedrock@ai21.jamba-instruct-v1:0",
                    "bedrock@amazon.nova-lite-v1:0",
                    "bedrock@amazon.nova-micro-v1:0",
                    "bedrock@amazon.nova-pro-v1:0",
                    "bedrock@amazon.rerank-v1:0",
                    "bedrock@amazon.titan-embed-text-v1",
                    "bedrock@amazon.titan-embed-text-v2:0",
                    "bedrock@amazon.titan-text-express-v1",
                    "bedrock@amazon.titan-text-lite-v1",
                    "bedrock@amazon.titan-text-premier-v1:0",
                    "bedrock@amazon.titan-tg1-large",
                    "bedrock@anthropic.claude-v2",
                    "bedrock@anthropic.claude-v2:1",
                    "bedrock@anthropic.claude-3-haiku-20240307-v1:0",
                    "bedrock@anthropic.claude-3-opus-20240229-v1:0",
                    "bedrock@anthropic.claude-3-sonnet-20240229-v1:0",
                    "bedrock@anthropic.claude-3-5-haiku-20241022-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "bedrock@anthropic.claude-3-5-sonnet-20241022-v2:0",
                    "bedrock@anthropic.claude-instant-v1",
                    "bedrock@cohere.command-text-v14",
                    "bedrock@cohere.command-light-text-v14",
                    "bedrock@cohere.command-r-v1:0",
                    "bedrock@cohere.command-r-plus-v1:0",
                    "bedrock@cohere.embed-english-v3",
                    "bedrock@cohere.embed-multilingual-v3",
                    "bedrock@cohere.rerank-v3-5:0",
                    "bedrock@meta.llama3-70b-instruct-v1:0",
                    "bedrock@meta.llama3-8b-instruct-v1:0",
                    "bedrock@meta.llama3-1-405b-instruct-v1:0",
                    "bedrock@meta.llama3-1-70b-instruct-v1:0",
                    "bedrock@meta.llama3-1-8b-instruct-v1:0",
                    "bedrock@meta.llama3-2-11b-instruct-v1:0",
                    "bedrock@meta.llama3-2-1b-instruct-v1:0",
                    "bedrock@meta.llama3-2-3b-instruct-v1:0",
                    "bedrock@meta.llama3-2-90b-instruct-v1:0",
                    "bedrock@meta.llama3-3-70b-instruct-v1:0",
                    "bedrock@mistral.mistral-7b-instruct-v0:2",
                    "bedrock@mistral.mistral-large-2402-v1:0",
                    "bedrock@mistral.mistral-large-2407-v1:0",
                    "bedrock@mistral.mistral-small-2402-v1:0",
                    "bedrock@mistral.mixtral-8x7b-instruct-v0:1",
                    "cohere@command-r7b-12-2024",
                    "cohere@command-r-plus-08-2024",
                    "cohere@command-r-plus-04-2024",
                    "cohere@command-r-plus",
                    "cohere@command-r-08-2024",
                    "cohere@command-r-03-2024",
                    "cohere@command-r",
                    "cohere@command",
                    "cohere@command-nightly",
                    "cohere@command-light",
                    "cohere@command-light-nightly",
                    "cohere@c4ai-aya-expanse-8b",
                    "cohere@c4ai-aya-expanse-32b",
                    "gemini@gemini-1.5-pro",
                    "gemini@gemini-1.5-flash-8b",
                    "gemini@gemini-1.5-flash",
                    "openai@gpt-4o",
                    "openai@gpt-4o-2024-08-06",
                    "openai@gpt-4o-mini",
                    "openai@gpt-4o-mini-2024-07-18",
                    "openai@o1",
                    "openai@o1-2024-12-17",
                    "openai@o1-mini",
                    "openai@o1-mini-2024-09-12",
                    "groq@distil-whisper-large-v3-en",
                    "groq@gemma2-9b-it",
                    "groq@llama-3.3-70b-versatile",
                    "groq@llama-3.1-8b-instant",
                    "groq@mixtral-8x7b-32768",
                  ])
                  .describe(
                    "List of model with providers, using the format {provider}@{model-slug}",
                  )
                  .optional(),
              })
              .catchall(z.any())
              .describe("Check if returned value is an exact match."),
          ])
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
              .describe("An array of messages to include run with the prompt."),
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
