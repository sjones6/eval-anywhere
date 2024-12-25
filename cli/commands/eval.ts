import {
  CoreTool,
  generateObject,
  generateText,
  jsonSchema,
  LanguageModelV1,
} from "ai";
import { loadModel } from "../utils/models";
import z from "zod";
import chalk from "chalk";
import {
  AlignmentCheck,
  Check,
  check,
  ExactMatch,
  ProfanityCheck,
  StructuredOutput,
  ToolCall as ToolCallCheck,
} from "../schemas/check";
import { Message } from "../schemas/message";
import { isEqual } from "lodash";
import {
  JSONValue,
  ResolvedPrompt,
  ResolvedPromptWithPath,
} from "../utils/load";
import {
  evalOutputAlignmentPromptV1,
  evalOutputAlignmentSchemaV1,
} from "./gen/eval_output_alignment_v1";
import {
  evalHasProfanityPromptV1,
  evalHasProfanitySchemaV1,
} from "./gen/eval_has_profanity_v1";

const checksSchema = z.array(check).min(1);

const defaultEvalModel = "openai@gpt-4o-mini";

export type CheckResult = {
  success: boolean;
  name: string;
  data: unknown;
};

export type EvaluationResult = {
  messages: Message[];
  content: string | Record<string, unknown>;
  model: string;
  provider: string;
  durationMS: number;
  checks: CheckResult[];
};

export type PromptWithResults = {
  prompt: ResolvedPrompt;
  evaluationResults: EvaluationResult[];
};

export const runEvals = async ({
  prompts,
}: {
  prompts: ResolvedPromptWithPath[];
}): Promise<PromptWithResults[]> => {
  const promptResults: PromptWithResults[] = [];

  try {
    for (const promptWithPath of prompts) {
      const prompt = promptWithPath.prompt;
      if (!prompt.evaluation?.evaluations.length) {
        console.warn(chalk.bgMagenta(`No evals for ${prompt.name}`));
        continue;
      }

      console.log(chalk.yellow(`Running evals for prompt ${prompt.name}`));

      const modelProviderSlug = prompt.model ?? defaultEvalModel;
      const model = loadModel(modelProviderSlug);
      if (!model) {
        console.error(
          chalk.red(`Error: unsupported model ${modelProviderSlug}`),
        );
        continue;
      }

      const evaluationResults: EvaluationResult[] = [];

      let i = 0;
      for (const evalCase of prompt.evaluation.evaluations) {
        i++;

        const checksParsed = checksSchema.safeParse([
          ...(prompt.evaluation.checks ?? []),
          ...(evalCase.checks ?? []),
        ]);

        if (!checksParsed.success) {
          console.warn(
            chalk.bgMagenta(
              `Eval case ${i} of prompt "${prompt.name}" has invalid checks. This is a no-op`,
            ),
          );
          continue;
        }

        const evaluationResult = await runEvaluationChecks({
          model,
          prompt,
          checks: checksParsed.data,
          evalMessages: evalCase.messages,
        });

        evaluationResults.push(evaluationResult);
      }

      promptResults.push({
        prompt,
        evaluationResults,
      });
    }

    return promptResults;
  } catch (err) {
    console.error(
      `${chalk.bgRed("Err")}: Unexpected error thrown running evals ${err}`,
    );
    throw err;
  }
};

type RunEvalChecks = {
  (args: {
    checks: Check[];
    evalMessages: Message[];
    model: LanguageModelV1;
    prompt: ResolvedPrompt;
  }): Promise<EvaluationResult>;
};

const runEvaluationChecks: RunEvalChecks = async (args) => {
  if (args.prompt.schema) {
    return runObjectEval(args);
  }
  return runTextEval(args);
};

const runTextEval: RunEvalChecks = async ({
  checks,
  evalMessages,
  model,
  prompt,
}) => {
  const start = Date.now();

  const { text, toolCalls } = await generateText({
    model,
    system: prompt.system_prompt,
    messages: [
      ...(prompt.few_shot_messages ?? []),
      ...evalMessages,
      ...(prompt.final_messages ?? []),
    ],
    temperature: prompt.temperature,
    ...(prompt.tools
      ? {
          tools: prompt.tools.reduce(
            (tools, tool) => {
              tools[tool.name] = {
                description: tool.description,
                parameters: jsonSchema(tool.parameters),
              };
              return tools;
            },
            {} as { [key: string]: CoreTool },
          ),
        }
      : []),
    // ensure that the tool calls are returned rather than called an executed.
    maxSteps: 1,
  });
  const durMs = Date.now() - start;

  const results: CheckResult[] = [];

  for (const check of checks) {
    switch (check.id) {
      case "structured_output":
        console.error(
          chalk.bgYellow("WARNING") +
            ": structured_output is not a valid check for text output. This is a no-op.",
        );
        results.push({
          success: false,
          name: check.name ?? check.id,
          data: undefined,
        });
        break;
      case "profanity":
        results.push(await profanityCheck(text, check));
        break;
      case "exact_match":
        results.push(await exactMatch(text, check));
        break;
      case "aligned":
        results.push(await aligned(text, check));
        break;
      case "tool_call":
        results.push(await toolCallCheck(check, toolCalls));
        break;
      case "custom":
      default:
        console.log(check, text);
    }
  }

  return {
    content: text,
    messages: evalMessages,
    model: model.modelId,
    provider: model.provider,
    durationMS: durMs,
    checks: results,
  };
};

const runObjectEval: RunEvalChecks = async ({
  checks,
  evalMessages,
  model,
  prompt,
}) => {
  const start = Date.now();

  const { object } = await generateObject({
    model,
    system: prompt.system_prompt,
    messages: [
      ...(prompt.few_shot_messages ?? []),
      ...evalMessages,
      ...(prompt.final_messages ?? []),
    ],
    schema: jsonSchema(prompt.schema!),
  });
  const durMs = Date.now() - start;

  const results: CheckResult[] = [];

  for (const check of checks) {
    switch (check.id) {
      case "profanity":
        results.push(await profanityCheck(JSON.stringify(object), check));
        break;
      case "exact_match":
        console.warn(
          chalk.bgYellow("WARNING") +
            ": exact_match uses stringified JSON for the match with structured output. Use `output` match instead.",
        );
        results.push(await exactMatch(JSON.stringify(object), check));
        break;
      case "aligned":
        results.push(await aligned(JSON.stringify(object), check));
        break;
      case "tool_call":
        console.warn(
          chalk.bgYellow("WARNING") +
            ": tool_call is not a valid check with structured output. Use output_match instead.",
        );
        results.push({
          success: false,
          name: check.name ?? check.id,
          data: undefined,
        });
        break;
      case "structured_output":
        results.push(await structuredCheck(check, object as JSONValue));
        break;
      case "custom":
      default:
        console.log(check, object);
    }
  }

  return {
    content: object as Record<string, unknown>,
    messages: evalMessages,
    model: model.modelId,
    provider: model.provider,
    durationMS: durMs,
    checks: results,
  };
};

export const aligned = async (
  text: string,
  aligned: AlignmentCheck,
): Promise<CheckResult> => {
  const model =
    aligned.model ?? evalOutputAlignmentPromptV1.model ?? defaultEvalModel;
  const { object } = await generateObject({
    model: loadModel(model)!,
    system: evalOutputAlignmentPromptV1.system_prompt,
    messages: [
      ...(evalOutputAlignmentPromptV1.few_shot_messages ?? []),
      {
        role: "assistant",
        content: aligned.instructions,
      },
      {
        role: "user",
        content: text,
      },
      ...(evalOutputAlignmentPromptV1.final_messages ?? []),
    ],
    schema: evalOutputAlignmentSchemaV1,
  });
  return {
    success: object.aligned,
    name: aligned.id,
    data: {
      model,
    },
  };
};

export const exactMatch = async (
  text: string,
  exactMatch: ExactMatch,
): Promise<CheckResult> => {
  const isMatch = exactMatch.case_insensitive
    ? text.toLowerCase() === exactMatch.value.toLowerCase()
    : text === exactMatch.value;
  return {
    success: isMatch,
    name: exactMatch.id,
    data: {
      case_insensitive: exactMatch.case_insensitive,
    },
  };
};

export const profanityCheck = async (
  text: string,
  check: ProfanityCheck,
): Promise<CheckResult> => {
  const model =
    check.model ?? evalOutputAlignmentPromptV1.model ?? defaultEvalModel;
  const { object } = await generateObject({
    model: loadModel(model)!,
    system: evalOutputAlignmentPromptV1.system_prompt,
    messages: [
      ...(evalOutputAlignmentPromptV1.few_shot_messages ?? []),
      {
        role: "assistant",
        content: `Here's a list of words that must not be included in any form: ${JSON.stringify(check.forbidden ?? [])}`,
      },
      {
        role: "user",
        content: text,
      },
      ...(evalHasProfanityPromptV1.final_messages ?? []),
    ],
    schema: evalHasProfanitySchemaV1,
  });
  return {
    success: !object.has_profanity,
    name: check.id,
    data: {
      forbidden: check.forbidden,
      model,
    },
  };
};

export const toolCallCheck = async (
  check: ToolCallCheck,
  toolCalls: {
    toolName: string;
    args: unknown;
  }[],
): Promise<CheckResult> => {
  const result: CheckResult = {
    success: false,
    name: check.name ?? check.id,
    data: {
      tool_calls: toolCalls,
      check: check.tool_calls,
    },
  };
  if (check.tool_calls.length !== toolCalls.length) {
    return result;
  }

  result.success = toolCalls.every((toolCall, i) => {
    const checkToolCall = check.tool_calls[i];
    if (!checkToolCall) {
      return false;
    }
    return (
      checkToolCall.tool_name == toolCall.toolName &&
      isEqual(checkToolCall.args, toolCall.args)
    );
  });
  return result;
};

export const structuredCheck = (
  check: StructuredOutput,
  result: JSONValue,
): CheckResult => {
  return {
    success: isEqual(result, check.result),
    name: check.name ?? check.id,
    data: {
      check: check.result,
      result,
    },
  };
};
