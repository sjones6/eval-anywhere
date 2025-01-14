import { Message } from "../core/types";
import { Message as AnywhereMessage } from "./gen/types";
import { CoreMessage as AiMessage } from "ai";

export const coreMessageToAIMessage = (message: Message): AiMessage => {
  if (message.role === "user") {
    return message;
  }
  if (message.role === "assistant") {
    return message;
  }
  if (message.role === "tool") {
    return {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: message.toolCallId,
          result: message.result,
          toolName: message.name,
          isError: message.isError,
        },
      ],
    };
  }
  throw new Error("Unexpected role.");
};

export const anywhereMessageToAIMessage = (
  message: AnywhereMessage,
): AiMessage => {
  if (message.role === "user") {
    return {
      ...message,
      role: "user",
    };
  }
  if (message.role === "assistant") {
    return {
      ...message,
      role: "assistant",
    };
  }
  if (message.role === "tool") {
    return {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: message.toolCallId,
          result: message.result,
          toolName: message.toolName,
          ...("isError" in message
            ? {
                isError: message.isError,
              }
            : {}),
        },
      ],
    };
  }
  throw new Error("Unexpected role.");
};
