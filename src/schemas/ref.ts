import z, { ZodTypeAny } from "zod";

export const ref = z.object({
  $ref: z
    .string()
    .regex(/^.*\.json$/, "must be a json file")
    .describe(
      "A relative path from the prompt file or absolute path to the JSON schema",
    ),
});

export type Ref = z.infer<typeof ref>;

export const withRef = (schema: ZodTypeAny) => z.union([schema, ref]);
