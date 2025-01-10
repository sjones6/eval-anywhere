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
  [key: Lang | string]: CompileFn;
} = {
  [typescript]: javascriptVariant({
    fileExtension: "ts",
    includeFileExtensionInImports: false,
    lang: typescript,
    zodPath: "zod",
    module: "esm",
    includeTypes: true,
  }),
  [deno]: javascriptVariant({
    fileExtension: "ts",
    includeFileExtensionInImports: true,
    lang: typescript,
    zodPath: "https://deno.land/x/zod@v3.24.1/mod.ts",
    module: "esm",
    includeTypes: true,
  }),
  [node]: javascriptVariant({
    fileExtension: "js",
    includeFileExtensionInImports: false,
    lang: node,
    zodPath: "zod",
    module: "cjs",
    includeTypes: false,
  }),
  [nodeESM]: javascriptVariant({
    fileExtension: "js",
    includeFileExtensionInImports: false,
    lang: node,
    zodPath: "zod",
    module: "esm",
    includeTypes: false,
  }),
  [nodeCJS]: javascriptVariant({
    fileExtension: "js",
    includeFileExtensionInImports: false,
    lang: node,
    zodPath: "zod",
    module: "cjs",
    includeTypes: false,
  }),
};

export const isSupportedLanguage = (str: string): str is Lang =>
  Object.keys(languageCompilers).includes(str);
