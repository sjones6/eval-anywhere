import { z, ZodLiteral, ZodObject } from "zod";
import { JSONValue, Prompt, Message } from "../core/types";
import { AnywhereConfig } from "../core";

export type CheckResult = {
  success: boolean;
  data: unknown;
};

export type NamedCheckResult = CheckResult & {
  name: string;
};

export type EvaluationResult = {
  messages: Message[];
  content: JSONValue;
  model: string;
  provider: string;
  durationMS: number;
  checks: NamedCheckResult[];
};

export type PromptWithResults = {
  prompt: Prompt;
  evaluationResults: EvaluationResult[];
};

export type SchemaCheckBase = ZodObject<{
  id: ZodLiteral<string>;
}>;

export type CustomCheckFnParams<Schema extends SchemaCheckBase> = {
  config: AnywhereConfig;
  prompt: Prompt;
  check: z.infer<Schema>;
};

export type CustomCheckChatCompletion =
  | {
      type: "text";
      text: string;
      toolCalls: {
        id: string;
        name: string;
        arguments: unknown;
      }[];
    }
  | {
      type: "structured_output";
      output: JSONValue;
    };

export type CustomCheckFn<Schema extends SchemaCheckBase> = {
  /**
   * @param result the chat completion result, including tool calls if applicable
   * @param params an object containing the configuration, check definition, prompt, and evaluation suite
   */
  (
    result: CustomCheckChatCompletion,
    params: CustomCheckFnParams<Schema>,
  ): Promise<CheckResult> | CheckResult;
};

export type CustomCheck<Schema extends SchemaCheckBase> = {
  id: string;
  schema: Schema;
  check: CustomCheckFn<Schema>;
};

export function defineCustomCheck<Schema extends SchemaCheckBase>(
  schema: Schema,
  check: CustomCheckFn<Schema>,
): CustomCheck<Schema> {
  return {
    id: schema.shape.id._def.value,
    schema,
    check,
  };
}
