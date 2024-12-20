/* eslint-disable */

export type Message =
  | {
      /**
       * The assumed role of the entity responsible for this message.
       */
      role: "user";
      /**
       * The content of the message.
       */
      content: string;
      /**
       * A name to assume in the context of few shot message. This is helpful to distinguish from real messages the user may send.
       */
      name?: string;
    }
  | {
      /**
       * The assumed role of the entity responsible for this message.
       */
      role: "assistant";
      /**
       * The content of the message.
       */
      content: string | null;
      /**
       * @minItems 1
       */
      tool_calls?: [
        {
          /**
           * The ID of the function call
           */
          id: string;
          function: {
            /**
             * The stringified JSON arguments
             */
            arguments: string;
            /**
             * The name of the function to call
             */
            name: string;
          };
          type: "function";
        },
        ...{
          /**
           * The ID of the function call
           */
          id: string;
          function: {
            /**
             * The stringified JSON arguments
             */
            arguments: string;
            /**
             * The name of the function to call
             */
            name: string;
          };
          type: "function";
        }[],
      ];
    }
  | {
      /**
       * The assumed role of the entity responsible for this message.
       */
      role: "tool";
      /**
       * The stringified JSON of the tool call response.
       */
      content: string;
      /**
       * The ID of the tool call. Must match an actual tool call.
       */
      tool_call_id: string;
    };

/**
 * A JSON schema for prompt.yaml files. See https://github.com/sjones6/eval-anywhere for more information
 */
export interface EvalAnywherePrompt {
  /**
   * The name of the prompt. For output, this will be turned into camel case.
   */
  name: string;
  /**
   * The default model to use with this prompt. Ultimately, the target runtime will choose a supported prompt.
   */
  provider?: (
    | (
        | "ai21"
        | "aleph_alpha"
        | "anthropic"
        | "anyscale"
        | "azure"
        | "azure_ai"
        | "bedrock"
        | "bedrock_converse"
        | "cerebras"
        | "cloudflare"
        | "codestral"
        | "cohere"
        | "cohere_chat"
        | "databricks"
        | "deepinfra"
        | "deepseek"
        | "fireworks_ai"
        | "fireworks_ai-embedding-models"
        | "friendliai"
        | "gemini"
        | "groq"
        | "mistral"
        | "nlp_cloud"
        | "ollama"
        | "one of https://docs.litellm.ai/docs/providers"
        | "openai"
        | "openrouter"
        | "palm"
        | "perplexity"
        | "replicate"
        | "sagemaker"
        | "text-completion-codestral"
        | "text-completion-openai"
        | "together_ai"
        | "vertex_ai-ai21_models"
        | "vertex_ai-anthropic_models"
        | "vertex_ai-chat-models"
        | "vertex_ai-code-chat-models"
        | "vertex_ai-code-text-models"
        | "vertex_ai-embedding-models"
        | "vertex_ai-image-models"
        | "vertex_ai-language-models"
        | "vertex_ai-llama_models"
        | "vertex_ai-mistral_models"
        | "vertex_ai-text-models"
        | "vertex_ai-vision-models"
        | "voyage"
        | "xai"
      )
    | string
  ) &
    string;
  /**
   * An array of few shot messages to include in the prompt.
   *
   * @minItems 1
   */
  few_shot_messages?: [Message, ...Message[]];
  /**
   * An array of messages to include _after_ the users messages are inserted. These are helpful for providing guidance and guardrails as the final thing the model sees.
   *
   * @minItems 1
   */
  final_messages?: [Message, ...Message[]];
  /**
   * The default model to use with this prompt. Ultimately, the runtime will choose a supported prompt.
   */
  model?: string;
  /**
   * The version of the prompt.
   */
  version?: number;
  /**
   * The system prompt to use for the prompt.
   */
  system_prompt: string;
  /**
   * A number between 0 and 2 that controls the randomness of the response. Lower numbers result in less random (although still random) responses.
   */
  temperature?: number;
  /**
   * A list of tools available to the prompt
   *
   * @minItems 1
   */
  tools?: [Tool, ...Tool[]];
}
export interface Tool {
  /**
   * The name of the tool function. This should be descriptive as to what the tool does.
   */
  name: string;
  /**
   * The description of the function. This should be meaningful to LLMs to aid in guiding the LLM to select this tool.
   */
  description: string;
  /**
   * A JSON schema definition of how the tool parameters should be constructed.
   */
  parameters: string;
}
