import { expect, describe, it } from "vitest";
import { languageCompilers } from "./index";
import { CompileConfig, Lang, typescript } from "./types";

const baseCfg: Omit<CompileConfig, "lang"> = {
  outDir: "./out",
  packageDir: process.cwd(),
  prompts: [
    {
      path: "a_prompt.ts",
      prompt: {
        name: "simple prompt",
        model: "anthropic@claude-3-5-sonnet-20241022",
        fewShotMessages: [],
        finalMessages: [],
        version: 0,
        systemPrompt: "system prompt",
        temperature: 0,
        tools: [],
        evaluation: {
          checks: [],
          evaluations: [],
        },
      },
    },
    {
      path: "b_prompt.ts",
      prompt: {
        name: "with tools",
        model: "anthropic@claude-3-5-haiku-20241022",
        fewShotMessages: [],
        finalMessages: [],
        version: 0,
        systemPrompt: "system prompt",
        temperature: 0,
        tools: [
          {
            name: "tool a",
            description: "tool desc",
            parameters: {
              type: "object",
              properties: {
                a: {
                  type: "boolean",
                },
              },
              requiredProperties: ["a"],
            },
          },
        ],
        evaluation: {
          checks: [],
          evaluations: [],
        },
      },
    },
    {
      path: "c_prompt.ts",
      prompt: {
        name: "structured output",
        model: "anthropic@claude-3-5-haiku-20241022",
        version: 0,
        systemPrompt: "system prompt",
        temperature: 0,
        tools: [],
        finalMessages: [],
        fewShotMessages: [],
        schema: {
          type: "object",
          properties: {
            a: {
              type: "boolean",
            },
          },
          requiredProperties: ["a"],
        },
        evaluation: {
          checks: [],
          evaluations: [],
        },
      },
    },
  ],
};

describe("compilers", () => {
  const tests: {
    lang: Lang;
  }[] = Object.keys(languageCompilers).map((lang) => ({ lang }));

  it.each(tests)(`should compile $lang`, async ({ lang }) => {
    expect(
      await languageCompilers[lang]!({
        ...baseCfg,
        lang,
      }),
    ).toMatchSnapshot();
  });

  it("fails and returns error", async () => {
    expect(
      await languageCompilers[typescript]!({
        ...baseCfg,
        packageDir: "pkg",
        lang: typescript,
      }),
    ).toMatchInlineSnapshot(`
      {
        "error": [Error: ENOENT: no such file or directory, scandir 'pkg/templates/typescript'],
        "success": false,
      }
    `);
  });
});
