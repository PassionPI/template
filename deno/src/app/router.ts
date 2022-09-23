import { app } from "@/app/mod.ts";
import { echo_path } from "@/controller/echo_path.ts";
import { control_fib } from "@/controller/fib.ts";
import { access } from "@/middleware/access.ts";
import { auth } from "@/middleware/auth.ts";
import { cors } from "@/middleware/cors.ts";

export const base_routes = app.defineRoutes((register) => {
  register.all("/", [access("/")], echo_path);
  register.all("/aa", [access("/aa")], echo_path);
  register.all("/*notFound", [access("/*notFound")], ({ pathParams, bad }) => {
    return bad({
      code: 4000,
      status: 404,
      message: `Global! Not Found: ${pathParams.notFound}`,
    });
  });
});

export const scope_routes = app.defineScopes({
  "/api": {
    middleware: [auth(), access("/api")],
    scopes: {
      "/fib": {
        middleware: [access("/fib")],
        routes(register) {
          register.get("index", [access("index", "GET")], echo_path);
          register.get("/", [access("/", "GET")], echo_path);
          register.get("/:x", [access("/:x", "GET")], control_fib);
          register.post("/:x", [access("/:x", "POST")], control_fib);
        },
      },
      "/config": {},
    },
  },
  "/openAPI": {
    middleware: [cors()],
  },
});
