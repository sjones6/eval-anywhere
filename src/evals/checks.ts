import { generateObject, LanguageModelV1 } from "ai";
import {
  alignmentCheck,
  exactMatch,
  profanityCheck,
  structuredOutputCheck,
  toolCallCheck,
} from "../schemas/check";
import {
  CheckResult,
  CustomCheckChatCompletion,
  defineCustomCheck,
} from "./types";
import { loadModel } from "../utils/models";
import { evalHasProfanityPromptV1, evalOutputAlignmentPromptV1 } from "./gen";
import { evalHasProfanitySchemaV1 } from "./gen/eval_has_profanity_v1";
import { evalOutputAlignmentSchemaV1 } from "./gen/eval_output_alignment_v1";
import { isEqual } from "lodash";

const completionToString = (v: CustomCheckChatCompletion): string => {
  if (v.type === "text") {
    return v.text;
  }
  return JSON.stringify(v.output);
};

const resolveModel = ({
  checkName,
  modelName,
}: {
  checkName: string;
  modelName: string;
}): [LanguageModelV1, true] | [CheckResult, false] => {
  const model = loadModel(modelName);
  if (!model) {
    return [
      {
        success: false,
        name: checkName,
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
      checkName: check.name ?? check.id,
      modelName: check.model ?? config.defaultModel,
    });
    if (!ok) {
      return model;
    }
    const { object } = await generateObject({
      model,
      system: evalHasProfanityPromptV1.system_prompt,
      messages: [
        ...(evalHasProfanityPromptV1.few_shot_messages ?? []),
        {
          role: "assistant",
          content: `Here's a list of words that must not be included in any form: ${JSON.stringify(check.forbidden ?? [])}`,
        },
        {
          role: "user",
          content: completionToString(result),
        },
        ...(evalHasProfanityPromptV1.final_messages ?? []),
      ],
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
      checkName: check.name ?? check.id,
      modelName: check.model ?? config.defaultModel,
    });
    if (!ok) {
      return model;
    }
    const { object } = await generateObject({
      model,
      system: evalOutputAlignmentPromptV1.system_prompt,
      messages: [
        ...(evalOutputAlignmentPromptV1.few_shot_messages ?? []),
        {
          role: "assistant",
          content: check.instructions,
        },
        {
          role: "user",
          content: completionToString(result),
        },
        ...(evalOutputAlignmentPromptV1.final_messages ?? []),
      ],
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
      name: check.name ?? check.id,
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
