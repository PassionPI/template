import { serve } from "@/libs/serve.ts";
import { fib_worker } from "@/worker/fib/mod.ts";
import { handler, route, use } from "./app.ts";
import { catcher } from "./middleware/catcher.ts";
import { logger } from "./middleware/logger.ts";

const fib = fib_worker();

use(catcher(), logger("MAIN"));

route.get(
  "/fib/:x",
  [catcher(), logger("FBI")],
  async ({ pathParams, state }) => {
    const x = Number(pathParams.x);
    const [err, result] = await fib({ x });
    return err
      ? state.bad({
          message: err.message,
          code: 1001,
        })
      : state.ok({
          method: "get",
          result: result.val,
        });
  }
);

route.post(
  "/fib/:x",
  [catcher(), logger("IBF")],
  async ({ pathParams, state }) => {
    const x = Number(pathParams.x);

    const [err, result] = await fib({ x });
    return err
      ? state.bad({
          message: err.message,
          code: 1001,
        })
      : state.ok({
          method: "post",
          result: result.val,
        });
  }
);

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
