import { app } from "@/app/mod.ts";
import { base_routes, scope_routes } from "@/app/router.ts";
import { serve } from "@/libs/serve.ts";
import { access } from "@/middleware/access.ts";
import { logger } from "@/middleware/logger.ts";

addEventListener("error", (e) => {
  e.preventDefault();
});
addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
});

await serve(
  app.createHandler({
    middleware: [logger("MAIN"), access("Start")],
    routes: base_routes,
    scopes: scope_routes,
  }),
  { port: 7070 }
);
