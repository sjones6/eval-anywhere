import {
  CoreTool,
  generateObject,
  generateText,
  jsonSchema,
  LanguageModelV1,
} from "ai";
import { loadModel } from "../utils/models";
import { ZodSchema } from "zod";
import { Prompt, JSONValue, Message } from "../core/types";
import {
  CustomCheckChatCompletion,
  EvaluationResult,
  NamedCheckResult,
  PromptWithResults,
} from "./types";
import { Anywhere, AnywhereConfig } from "../core";
import { BaseCheck } from "./schema";
import { coreMessageToAIMessage } from "./utils";

const defaultEvalModel = "openai@gpt-4o-mini";

export const runEvals = async ({
  prompts,
  anywhere,
}: {
  prompts: Prompt[];
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
          checks: evalCase.checks ?? [],
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
  checks: BaseCheck[];
  evalMessages: Message[];
  model: LanguageModelV1;
  prompt: Prompt;
};

type RunEvalChecks = {
  (args: RunEvalChecksInput): Promise<EvaluationResult>;
};

const runEvaluationChecks: RunEvalChecks = async (args) => {
  const start = Date.now();
  const output = await getPromptOutput(args);
  const durMs = Date.now() - start;

  const results: NamedCheckResult[] = [];

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
      check,
      prompt: args.prompt,
      config: args.cfg,
    });
    results.push({
      ...result,
      name:
        "name" in check && typeof check.name === "string" && !!check.name
          ? check.name
          : check.id,
    });
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
      system: prompt.systemPrompt,
      messages: [
        ...(prompt.fewShotMessages ?? []),
        ...evalMessages,
        ...(prompt.finalMessages ?? []),
      ].map(coreMessageToAIMessage),
      schema: jsonSchema(prompt.schema),
    });
    return {
      type: "structured_output",
      output: object as JSONValue,
    };
  }
  const { text, toolCalls } = await generateText({
    model,
    system: prompt.systemPrompt,
    messages: [
      ...(prompt.fewShotMessages ?? []),
      ...evalMessages,
      ...(prompt.finalMessages ?? []),
    ].map(coreMessageToAIMessage),
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
      arguments: toolCall.args,
    })),
  };
};
