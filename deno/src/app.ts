import { bad, ok } from "./help.ts";
import { onion } from "./onion/mod.ts";

export const { use, route, handler, defineMiddleware } = onion({
  state: {
    bad,
    ok,
  },
});
