import { app } from "@/app/mod.ts";
import { base_routes, scope_routes } from "@/app/router.ts";
import { config, env } from "@/config/mod.ts";
import { serve } from "@/libs/serve.ts";
import { middleware } from "@/middleware/mod.ts";

if (env === "prod") {
  addEventListener("error", (e) => {
    e.preventDefault();
  });
  addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
  });
}

await serve(
  app.createHandler({
    middleware: [
      middleware.logger.log("MAIN"),
      middleware.logger.path("Start"),
    ],
    routes: base_routes,
    scopes: scope_routes,
  }),
  { port: config.port }
);
