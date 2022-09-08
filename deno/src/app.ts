import { bad, ok } from "./help.ts";
import { onion } from "./onion/mod.ts";

export const { use, route, scope, handler, defineRoute, defineMiddleware } =
  onion({
    state: {
      bad,
      ok,
    },
  });
