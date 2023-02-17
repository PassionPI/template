import * as auth from "./auth.ts";
import * as cors from "./cors.ts";
import * as file from "./file.ts";
import * as logger from "./logger.ts";
import * as validator from "./validator.ts";

export const middleware = {
  auth,
  cors,
  file,
  validator,
  logger,
};
