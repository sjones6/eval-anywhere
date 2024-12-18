import { Prompt } from "gen/prompt";

export const compileTypeScript = (prompt: Prompt): string => {
  return `export const prompt = ${JSON.stringify(prompt, null, 2)}`;
};
