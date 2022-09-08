import { app } from "@/app/mod.ts";
import { base_routes, scope_routes } from "@/app/router.ts";
import { serve } from "@/libs/serve.ts";
import { catcher } from "@/middleware/catcher.ts";
import { logger } from "@/middleware/logger.ts";

addEventListener("error", (e) => {
  e.preventDefault();
});
addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
});

app.use(catcher(), logger("MAIN"));

app.routes(base_routes);

app.scopes(scope_routes);

await serve(app.handler, { port: 7070 });
