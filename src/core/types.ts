import type { BaseCheck } from "../evals/schema";

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue;
    }
  | Array<JSONValue>;

export type Message =
  | {
      role: "user";
      content: string;
      name?: string;
    }
  | {
      role: "assistant";
      content: string;
      toolCalls?: {
        id: string;
        function: {
          arguments: string;
          name: string;
        };
      }[];
    }
  | {
      role: "tool";
      name: string;
      toolCallId: string;
      result: Record<string, unknown> | boolean | string | number | null;
      isError: boolean;
    };

export type EvaluationCase = {
  name?: string;
  messages: Message[];
  checks?: BaseCheck[];
};

export type EvaluationSuite = {
  evaluations: EvaluationCase[];
  checks: BaseCheck[];
};

export type Tool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type Prompt = {
  name: string;
  model:
    | "anthropic@claude-3-5-sonnet-20241022"
    | "anthropic@claude-3-5-sonnet-latest"
    | "anthropic@claude-3-5-haiku-20241022"
    | "anthropic@claude-3-5-haiku-latest"
    | "anthropic@claude-3-opus-20240229"
    | "anthropic@claude-3-opus-latest"
    | "anthropic@claude-3-sonnet-20240229"
    | "anthropic@claude-3-haiku-20240307"
    | "bedrock@ai21.jamba-1-5-large-v1:0"
    | "bedrock@ai21.jamba-1-5-mini-v1:0"
    | "bedrock@ai21.jamba-instruct-v1:0"
    | "bedrock@amazon.nova-lite-v1:0"
    | "bedrock@amazon.nova-micro-v1:0"
    | "bedrock@amazon.nova-pro-v1:0"
    | "bedrock@amazon.rerank-v1:0"
    | "bedrock@amazon.titan-embed-text-v1"
    | "bedrock@amazon.titan-embed-text-v2:0"
    | "bedrock@amazon.titan-text-express-v1"
    | "bedrock@amazon.titan-text-lite-v1"
    | "bedrock@amazon.titan-text-premier-v1:0"
    | "bedrock@amazon.titan-tg1-large"
    | "bedrock@anthropic.claude-v2"
    | "bedrock@anthropic.claude-v2:1"
    | "bedrock@anthropic.claude-3-haiku-20240307-v1:0"
    | "bedrock@anthropic.claude-3-opus-20240229-v1:0"
    | "bedrock@anthropic.claude-3-sonnet-20240229-v1:0"
    | "bedrock@anthropic.claude-3-5-haiku-20241022-v1:0"
    | "bedrock@anthropic.claude-3-5-sonnet-20240620-v1:0"
    | "bedrock@anthropic.claude-3-5-sonnet-20241022-v2:0"
    | "bedrock@anthropic.claude-instant-v1"
    | "bedrock@cohere.command-text-v14"
    | "bedrock@cohere.command-light-text-v14"
    | "bedrock@cohere.command-r-v1:0"
    | "bedrock@cohere.command-r-plus-v1:0"
    | "bedrock@cohere.embed-english-v3"
    | "bedrock@cohere.embed-multilingual-v3"
    | "bedrock@cohere.rerank-v3-5:0"
    | "bedrock@meta.llama3-70b-instruct-v1:0"
    | "bedrock@meta.llama3-8b-instruct-v1:0"
    | "bedrock@meta.llama3-1-405b-instruct-v1:0"
    | "bedrock@meta.llama3-1-70b-instruct-v1:0"
    | "bedrock@meta.llama3-1-8b-instruct-v1:0"
    | "bedrock@meta.llama3-2-11b-instruct-v1:0"
    | "bedrock@meta.llama3-2-1b-instruct-v1:0"
    | "bedrock@meta.llama3-2-3b-instruct-v1:0"
    | "bedrock@meta.llama3-2-90b-instruct-v1:0"
    | "bedrock@meta.llama3-3-70b-instruct-v1:0"
    | "bedrock@mistral.mistral-7b-instruct-v0:2"
    | "bedrock@mistral.mistral-large-2402-v1:0"
    | "bedrock@mistral.mistral-large-2407-v1:0"
    | "bedrock@mistral.mistral-small-2402-v1:0"
    | "bedrock@mistral.mixtral-8x7b-instruct-v0:1"
    | "cohere@command-r7b-12-2024"
    | "cohere@command-r-plus-08-2024"
    | "cohere@command-r-plus-04-2024"
    | "cohere@command-r-plus"
    | "cohere@command-r-08-2024"
    | "cohere@command-r-03-2024"
    | "cohere@command-r"
    | "cohere@command"
    | "cohere@command-nightly"
    | "cohere@command-light"
    | "cohere@command-light-nightly"
    | "cohere@c4ai-aya-expanse-8b"
    | "cohere@c4ai-aya-expanse-32b"
    | "gemini@gemini-1.5-pro"
    | "gemini@gemini-1.5-flash-8b"
    | "gemini@gemini-1.5-flash"
    | "openai@gpt-4o"
    | "openai@gpt-4o-2024-08-06"
    | "openai@gpt-4o-mini"
    | "openai@gpt-4o-mini-2024-07-18"
    | "openai@o1"
    | "openai@o1-2024-12-17"
    | "openai@o1-mini"
    | "openai@o1-mini-2024-09-12"
    | "groq@distil-whisper-large-v3-en"
    | "groq@gemma2-9b-it"
    | "groq@llama-3.3-70b-versatile"
    | "groq@llama-3.1-8b-instant"
    | "groq@mixtral-8x7b-32768"
    | undefined;
  fewShotMessages: Message[];
  finalMessages: Message[];
  version: number;
  systemPrompt: string;
  temperature: number;
  tools: Tool[];
  schema?: Record<string, unknown>;
  evaluation?: EvaluationSuite;
};

export type PromptWithPath = {
  path: string;
  prompt: Prompt;
};
