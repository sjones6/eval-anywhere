import { CompileFn, Lang, typescript } from "./types";
import { compileTypeScript } from "./typescript";

export const languageCompilers: {
  [key: Lang]: CompileFn;
} = {
  [typescript]: compileTypeScript,
};

const supportedLanguages = Object.keys(languageCompilers);

export const isSupportedLanguage = (str: string): str is Lang =>
  supportedLanguages.includes(str);
