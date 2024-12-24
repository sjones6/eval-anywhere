import { compileDeno } from "./deno";
import { CompileFn, deno, Lang, typescript } from "./types";
import { compileTypeScript } from "./typescript";

export const languageCompilers: {
  [key: Lang]: CompileFn;
} = {
  [typescript]: compileTypeScript,
  [deno]: compileDeno,
};

const supportedLanguages = Object.keys(languageCompilers);

export const isSupportedLanguage = (str: string): str is Lang =>
  supportedLanguages.includes(str);
