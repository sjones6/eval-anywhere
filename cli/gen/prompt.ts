import { z } from "zod";

export const prompt = z
  .object({
    name: z
      .string()
      .describe(
        "The name of the prompt. For output, this will be turned into camel case.",
      ),
    provider: z
      .union([
        z
          .enum([
            "ai21",
            "aleph_alpha",
            "anthropic",
            "anyscale",
            "azure",
            "azure_ai",
            "bedrock",
            "bedrock_converse",
            "cerebras",
            "cloudflare",
            "codestral",
            "cohere",
            "cohere_chat",
            "databricks",
            "deepinfra",
            "deepseek",
            "fireworks_ai",
            "fireworks_ai-embedding-models",
            "friendliai",
            "gemini",
            "groq",
            "mistral",
            "nlp_cloud",
            "ollama",
            "one of https://docs.litellm.ai/docs/providers",
            "openai",
            "openrouter",
            "palm",
            "perplexity",
            "replicate",
            "sagemaker",
            "text-completion-codestral",
            "text-completion-openai",
            "together_ai",
            "vertex_ai-ai21_models",
            "vertex_ai-anthropic_models",
            "vertex_ai-chat-models",
            "vertex_ai-code-chat-models",
            "vertex_ai-code-text-models",
            "vertex_ai-embedding-models",
            "vertex_ai-image-models",
            "vertex_ai-language-models",
            "vertex_ai-llama_models",
            "vertex_ai-mistral_models",
            "vertex_ai-text-models",
            "vertex_ai-vision-models",
            "voyage",
            "xai",
          ])
          .describe("List of model providers"),
        z.string(),
      ])
      .describe(
        "The default model to use with this prompt. Ultimately, the target runtime will choose a supported prompt.",
      )
      .optional(),
    few_shot_messages: z
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
                  .describe(
                    "The ID of the tool call. Must match an actual tool call.",
                  ),
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
        }),
      )
      .min(1)
      .describe("An array of few shot messages to include in the prompt.")
      .optional(),
    final_messages: z
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
                  .describe(
                    "The ID of the tool call. Must match an actual tool call.",
                  ),
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
        }),
      )
      .min(1)
      .describe(
        "An array of messages to include _after_ the users messages are inserted. These are helpful for providing guidance and guardrails as the final thing the model sees.",
      )
      .optional(),
    model: z
      .string()
      .describe(
        "The default model to use with this prompt. Ultimately, the runtime will choose a supported prompt.",
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
      .array(
        z
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
          .strict(),
      )
      .min(1)
      .describe("A list of tools available to the prompt")
      .optional(),
  })
  .strict()
  .describe(
    "A JSON schema for prompt.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
  );
export type Prompt = z.infer<typeof prompt>;
