import { serve } from "@/libs/serve.ts";
import { handler, route, scope, use } from "./app.ts";
import { control_fib } from "./controller/fib.ts";
import { catcher } from "./middleware/catcher.ts";
import { logger } from "./middleware/logger.ts";

use(catcher(), logger("MAIN"));

scope({
  "/api": {
    scopes: {
      "/fib": {
        middleware: [logger("fib bbbb")],
        routes(builder) {
          builder.get("/:x", [logger("GET FBI")], control_fib);
          builder.post("/:x", [logger("POST FBI")], control_fib);
        },
      },
      "/dashboard": {},
      "/versions": {},
      "/tasks": {},
      "/events": {},
      "/checkers": {},
      "/refresh": {},
      "/qc": {},
      "/config": {},
    },
  },
});

route.any("/*notFound", ({ pathParams, state }) => {
  return state.bad({
    code: 4000,
    status: 404,
    message: `Not Found: ${pathParams.notFound}`,
  });
});

await serve(handler, { port: 7070 });

globalThis.addEventListener("error", (e) => {
  e.preventDefault();
});
globalThis.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
});
