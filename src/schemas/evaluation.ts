import { z, ZodTypeAny, ZodLiteral } from "zod";
import { message } from "./message";
import { SchemaCheckBase } from "../evals/types";
import { defaultChecks } from "../evals/checks";

export const createEvaluationSchema = <T extends SchemaCheckBase>(
  checks: readonly T[],
) => {
  if (!checks.length) {
    throw new Error("Must supply at least one check.");
  }

  const evaluationChecksArray = z.array(
    checks.length === 1
      ? checks[0]!
      : z.union(
          checks as unknown as readonly [
            ZodLiteral<T>,
            ZodLiteral<T>,
            ...ZodLiteral<T>[],
          ],
        ),
  );

  const evaluationChecks = z.union([
    evaluationChecksArray,
    z.object(
      checks.reduce((o: Record<string, ZodTypeAny>, check) => {
        o[check.shape.id._def.value] = check.omit({ id: true }).optional();
        return o;
      }, {}),
    ),
  ]);

  const evaluationCase = z
    .object({
      name: z.string().describe("A name describing this evaluation").optional(),
      messages: z
        .array(message)
        .min(1)
        .describe("An array of messages to include run with the prompt."),
      checks: evaluationChecks
        .describe(
          "a list of checks to perform for this specific eval. Merged with the general list.",
        )
        .optional(),
    })
    .strict();

  const evaluation = z
    .object({
      checks: evaluationChecks
        .describe("a list of checks to perform on every evaluation case.")
        .optional(),
      evaluations: z
        .array(evaluationCase)
        .min(1)
        .describe("A list of evaluations to run."),
    })
    .strict()
    .describe(
      "A JSON schema for eval.yaml files. See https://github.com/sjones6/eval-anywhere for more information",
    );

  return {
    evaluationChecksArray,
    evaluationChecks,
    evaluationCase,
    evaluation,
  };
};

export const {
  evaluationChecksArray,
  evaluationChecks,
  evaluationCase,
  evaluation,
} = createEvaluationSchema(defaultChecks.map(({ schema }) => schema));

export type EvaluationChecksArray = z.infer<typeof evaluationChecksArray>;

export type EvaluationChecks = z.infer<typeof evaluationChecks>;

export type EvaluationCase = z.infer<typeof evaluationCase>;

export type Evaluation = z.infer<typeof evaluation>;
