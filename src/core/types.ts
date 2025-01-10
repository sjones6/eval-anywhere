import type { Prompt } from "../schemas/prompt";
import type { Tool } from "../schemas/tool";
import type {
  AlignmentCheck,
  CustomCheck,
  ExactMatch,
  ProfanityCheck,
  StructuredOutput,
  ToolCall,
} from "../schemas/check";
import type { Evaluation, EvaluationCheck } from "../schemas/evaluation";

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue;
    }
  | Array<JSONValue>;

export type ResolvedStructuredOutput = Omit<StructuredOutput, "result"> & {
  result: JSONValue;
};

export type ResolvedCheck =
  | ResolvedStructuredOutput
  | ProfanityCheck
  | AlignmentCheck
  | CustomCheck
  | ToolCall
  | ExactMatch;

export type ResolvedEvaluationCase = Omit<EvaluationCheck, "checks"> & {
  checks: ResolvedCheck[];
};

export type ResolvedEvaluationSuite = Omit<
  Evaluation,
  "checks" | "evaluations"
> & {
  evaluations: ResolvedEvaluationCase[];
  checks: ResolvedCheck[];
};

export type ResolvedTool = Omit<Tool, "parameters"> & {
  parameters: Record<string, unknown>;
};

export type ResolvedPrompt = Omit<Prompt, "tools" | "schema" | "evaluation"> & {
  tools: ResolvedTool[];
  schema: Record<string, unknown> | undefined;
  evaluation: ResolvedEvaluationSuite | undefined;
};

export type ResolvedPromptWithPath = {
  /** The absolute path to the prompt */
  path: string;
  prompt: ResolvedPrompt;
};
