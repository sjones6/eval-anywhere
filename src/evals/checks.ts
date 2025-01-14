import { generateObject, LanguageModelV1 } from "ai";
import {
  alignmentCheck,
  exactMatch,
  profanityCheck,
  structuredOutputCheck,
  toolCallCheck,
} from "./schema";
import {
  CheckResult,
  CustomCheckChatCompletion,
  defineCustomCheck,
} from "./types";
import { loadModel } from "../utils/models";
import { evalHasProfanityPromptV1, evalOutputAlignmentPromptV1 } from "./gen";
import { Message as AnywhereMessage } from "./gen/types";
import { evalHasProfanitySchemaV1 } from "./gen/eval_has_profanity_v1";
import { evalOutputAlignmentSchemaV1 } from "./gen/eval_output_alignment_v1";
import { isEqual } from "lodash";
import { anywhereMessageToAIMessage } from "./utils";

const completionToString = (v: CustomCheckChatCompletion): string => {
  if (v.type === "text") {
    return v.text;
  }
  return JSON.stringify(v.output);
};

const resolveModel = ({
  modelName,
}: {
  modelName: string;
}): [LanguageModelV1, true] | [CheckResult, false] => {
  const model = loadModel(modelName);
  if (!model) {
    return [
      {
        success: false,
        data: {
          model: modelName,
        },
      },
      false,
    ];
  }
  return [model, true];
};

export const defaultChecks = [
  // profanity check
  defineCustomCheck(profanityCheck, async (result, { check, config }) => {
    const [model, ok] = resolveModel({
      modelName: check.model ?? config.defaultModel,
    });
    if (!ok) {
      return model;
    }
    const messages: AnywhereMessage[] = [
      ...(evalHasProfanityPromptV1.fewShotMessages ?? []),
      {
        role: "assistant",
        content: `Here's a list of words that must not be included in any form: ${JSON.stringify(check.forbidden ?? [])}`,
      },
      {
        role: "user",
        content: completionToString(result),
      },
      ...(evalHasProfanityPromptV1.finalMessages ?? []),
    ];
    const { object } = await generateObject({
      model,
      system: evalHasProfanityPromptV1.systemPrompt,
      messages: messages.map(anywhereMessageToAIMessage),
      schema: evalHasProfanitySchemaV1,
    });
    return {
      success: !object.has_profanity,
      name: check.name ?? check.id,
      data: {
        forbidden: check.forbidden,
        model,
      },
    };
  }),
  // exact match
  defineCustomCheck(exactMatch, (result, { check }) => {
    const text = completionToString(result);
    const isMatch = check.case_insensitive
      ? text.toLowerCase() === check.value.toLowerCase()
      : text === check.value;
    return {
      success: isMatch,
      name: check.name ?? check.id,
      data: {
        case_insensitive: check.case_insensitive,
      },
    };
  }),
  // aligned
  defineCustomCheck(alignmentCheck, async (result, { check, config }) => {
    const [model, ok] = resolveModel({
      modelName: check.model ?? config.defaultModel,
    });
    if (!ok) {
      return model;
    }
    const messages: AnywhereMessage[] = [
      ...(evalOutputAlignmentPromptV1.fewShotMessages ?? []),
      {
        role: "assistant",
        content: check.instructions,
      },
      {
        role: "user",
        content: completionToString(result),
      },
      ...(evalOutputAlignmentPromptV1.finalMessages ?? []),
    ];
    const { object } = await generateObject({
      model,
      system: evalOutputAlignmentPromptV1.systemPrompt,
      messages: messages.map(anywhereMessageToAIMessage),
      schema: evalOutputAlignmentSchemaV1,
    });
    return {
      success: object.aligned,
      name: check.name ?? check.id,
      data: {
        model,
        instructions: check.instructions,
      },
    };
  }),
  // tool call
  defineCustomCheck(toolCallCheck, async (result, { check, config }) => {
    const checkResult: CheckResult = {
      success: false,
      data: {
        check: check.tool_calls,
        tool_calls: [],
      },
    };
    if (result.type !== "text") {
      config.logger.error(
        {},
        "tool call checks do not support structured output",
      );
      return checkResult;
    }
    // @ts-expect-error
    checkResult.data.tool_calls = result.toolCalls;
    if (check.tool_calls.length !== result.toolCalls.length) {
      return checkResult;
    }
    checkResult.success = result.toolCalls.every((toolCall, i) => {
      const checkToolCall = check.tool_calls[i];
      if (!checkToolCall) {
        return false;
      }
      return (
        checkToolCall.tool_name == toolCall.name &&
        isEqual(checkToolCall.args, toolCall.arguments)
      );
    });
    return checkResult;
  }),
  // structured output
  defineCustomCheck(structuredOutputCheck, async (result, { check }) => {
    return {
      success: isEqual(result, check.result),
      name: check.name ?? check.id,
      data: {
        check: check.result,
        result,
      },
    };
  }),
];
