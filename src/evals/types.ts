import { z, ZodLiteral, ZodObject, ZodOptional, ZodString } from "zod";
import { JSONValue, ResolvedPrompt } from "../core/types";
import { Message } from "../schemas/message";
import { AnywhereConfig } from "../core";

export type CheckResult = {
  success: boolean;
  name: string;
  data: unknown;
};

export type EvaluationResult = {
  messages: Message[];
  content: JSONValue;
  model: string;
  provider: string;
  durationMS: number;
  checks: CheckResult[];
};

export type PromptWithResults = {
  prompt: ResolvedPrompt;
  evaluationResults: EvaluationResult[];
};

export type SchemaCheckBase = ZodObject<{
  id: ZodLiteral<string>;
  name: ZodOptional<ZodString>;
}>;

export type CustomCheckFnParams<Schema extends SchemaCheckBase> = {
  config: AnywhereConfig;
  prompt: ResolvedPrompt;
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
