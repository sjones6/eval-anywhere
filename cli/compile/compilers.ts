import { javascriptVariant } from "./javascript-variant";
import {
  CompileFn,
  deno,
  Lang,
  node,
  nodeCJS,
  nodeESM,
  typescript,
} from "./types";

export const languageCompilers: {
  [key: Lang]: CompileFn;
} = {
  [typescript]: javascriptVariant({
    fileExtension: "ts",
    lang: typescript,
    zodPath: "zod",
    module: "esm",
    includeTypes: true,
  }),
  [deno]: javascriptVariant({
    fileExtension: "ts",
    lang: typescript,
    zodPath: "https://deno.land/x/zod@v3.24.1/mod.ts",
    module: "esm",
    includeTypes: true,
  }),
  [node]: javascriptVariant({
    fileExtension: "js",
    lang: node,
    zodPath: "zod",
    module: "cjs",
    includeTypes: false,
  }),
  [nodeESM]: javascriptVariant({
    fileExtension: "js",
    lang: node,
    zodPath: "zod",
    module: "esm",
    includeTypes: false,
  }),
  [nodeCJS]: javascriptVariant({
    fileExtension: "js",
    lang: node,
    zodPath: "zod",
    module: "cjs",
    includeTypes: false,
  }),
};

const supportedLanguages = Object.keys(languageCompilers);

export const isSupportedLanguage = (str: string): str is Lang =>
  supportedLanguages.includes(str);
