import pino, { Logger } from "pino";
import pretty from "pino-pretty";

export type { Logger };

export const logger = pino(
  pretty({
    ignore: "pid,hostname,time",
  }),
);
