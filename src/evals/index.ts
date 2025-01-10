import {
  CoreTool,
  generateObject,
  generateText,
  jsonSchema,
  LanguageModelV1,
} from "ai";
import { loadModel } from "../utils/models";
import { ZodSchema } from "zod";
import { Message } from "../schemas/message";
import { JSONValue, ResolvedPrompt } from "../utils/load";
import {
  CheckResult,
  CustomCheckChatCompletion,
  EvaluationResult,
  PromptWithResults,
} from "./types";
import { Anywhere, AnywhereConfig } from "../core";

const defaultEvalModel = "openai@gpt-4o-mini";

export const runEvals = async ({
  prompts,
  anywhere,
}: {
  prompts: ResolvedPrompt[];
  anywhere: Anywhere;
}): Promise<PromptWithResults[]> => {
  const cfg = anywhere.config;
  const promptResults: PromptWithResults[] = [];

  try {
    for (const prompt of prompts) {
      if (!prompt.evaluation?.evaluations.length) {
        cfg.logger.warn(
          {
            prompt: prompt.name,
          },
          "No evals defined for this prompt.",
        );
        continue;
      }

      cfg.logger.debug(
        {
          prompt: prompt.name,
        },
        "Running evals",
      );

      const modelProviderSlug = prompt.model ?? defaultEvalModel;
      const model = loadModel(modelProviderSlug);
      if (!model) {
        cfg.logger.error(
          {
            model: modelProviderSlug,
          },
          "Unsupported model",
        );
        continue;
      }

      const evaluationResults: EvaluationResult[] = [];

      let i = 0;
      for (const evalCase of prompt.evaluation.evaluations) {
        i++;

        const evaluationResult = await runEvaluationChecks({
          cfg,
          model,
          prompt,
          checks: evalCase.checks,
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
    cfg.logger.error(
      {
        error: err,
      },
      "Unexpected error thrown running evals",
    );
    throw err;
  }
};

type RunEvalChecksInput = {
  cfg: AnywhereConfig;
  checks: { id: string }[];
  evalMessages: Message[];
  model: LanguageModelV1;
  prompt: ResolvedPrompt;
};

type RunEvalChecks = {
  (args: RunEvalChecksInput): Promise<EvaluationResult>;
};

const runEvaluationChecks: RunEvalChecks = async (args) => {
  const start = Date.now();
  const output = await getPromptOutput(args);
  const durMs = Date.now() - start;

  const results: CheckResult[] = [];

  for (const check of args.checks) {
    const checker = args.cfg.checks.find((checker) => checker.id === check.id);
    if (!checker) {
      args.cfg.logger.error(
        {
          check: check.id,
        },
        "check not found",
      );
      continue;
    }

    const parsed = (checker.schema as ZodSchema).safeParse(check);
    if (!parsed.success) {
      args.cfg.logger.error(
        {
          check: check,
          issues: parsed.error.issues,
        },
        "check does not match schema",
      );
      continue;
    }

    const result = await checker.check(output, {
      prompt: args.prompt,
      check,
      config: args.cfg,
    });
    results.push(result);
  }

  return {
    content: output.type === "text" ? output.text : output.output,
    messages: args.evalMessages,
    model: args.model.modelId,
    provider: args.model.provider,
    durationMS: durMs,
    checks: results,
  };
};

const getPromptOutput = async ({
  evalMessages,
  model,
  prompt,
}: RunEvalChecksInput): Promise<CustomCheckChatCompletion> => {
  if (prompt.schema) {
    const { object } = await generateObject({
      model,
      system: prompt.system_prompt,
      messages: [
        ...(prompt.few_shot_messages ?? []),
        ...evalMessages,
        ...(prompt.final_messages ?? []),
      ],
      schema: jsonSchema(prompt.schema),
    });
    return {
      type: "structured_output",
      output: object as JSONValue,
    };
  }
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

  return {
    type: "text",
    text,
    toolCalls: toolCalls.map((toolCall) => ({
      id: toolCall.toolCallId,
      name: toolCall.toolName,
      arguments: JSON.parse(toolCall.args),
    })),
  };
};
