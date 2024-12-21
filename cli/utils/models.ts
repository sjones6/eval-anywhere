import { LanguageModelV1 } from "ai";
import { models } from "../gen/models";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { cohere } from "@ai-sdk/cohere";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";

export const loadModel = (model: string): LanguageModelV1 | null => {
  const parsed = models.safeParse(model);
  if (!parsed.success) {
    return null;
  }

  const [provider, modelSlug] = parsed.data.split("@");

  if (!provider || !modelSlug) {
    throw new Error(
      `Model ${model} does not follow format {provider}@{model}. This is a developer error.`,
    );
  }

  switch (provider) {
    case "anthropic":
      return anthropic(modelSlug);
    case "bedrock":
      return bedrock(modelSlug);
    case "cohere":
      return cohere(modelSlug);
    case "gemini":
      return google(modelSlug);
    case "groq":
      return groq(modelSlug);
    case "openai":
      return openai(modelSlug);
    default:
      throw new Error(`Provider for ${provider} not found`);
  }
};
