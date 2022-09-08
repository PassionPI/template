import { app } from "@/app/mod.ts";
import { echo_path } from "@/controller/echo_path.ts";
import { control_fib } from "@/controller/fib.ts";
import { auth } from "@/middleware/auth.ts";
import { cors } from "@/middleware/cors.ts";
import { logger } from "@/middleware/logger.ts";

export const base_routes = app.defineRoutes((register) => {
  register.all("/", ({ state }) => {
    return state.ok({
      value: "Hello!",
    });
  });
  register.all("/aa", ({ state }) => {
    return state.ok({
      value: "aa",
    });
  });
  register.all("/*notFound", ({ pathParams, state }) => {
    console.log("!!!", pathParams);
    return state.bad({
      code: 4000,
      status: 404,
      message: `Not Found: ${pathParams.notFound}`,
    });
  });
});

export const scope_routes = app.defineScopes({
  "/api": {
    middleware: [auth()],
    scopes: {
      "/fib": {
        middleware: [logger("fib bbbb")],
        routes(register) {
          register.get("index", [logger("FBI INDEX")], echo_path);
          register.get("/", [logger("FBI /")], echo_path);
          register.get("/:x", [logger("FBI GET")], control_fib);
          register.post("/:x", [logger("FBI POST")], control_fib);
        },
      },
      "/config": {},
    },
  },
  "/openAPI": {
    middleware: [cors()],
  },
});
