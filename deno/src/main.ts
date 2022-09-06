import { serve } from "@/libs/serve.ts";
import { fib_worker } from "@/worker/fib/mod.ts";
import { handler, route, use } from "./app.ts";
import { bad, ok } from "./help.ts";
import { catcher } from "./middleware/catcher.ts";
import { logger } from "./middleware/logger.ts";

const fib = fib_worker();

use(catcher, logger);

route("/fib/:x", ({ pathParams, by }) => {
  const x = Number(pathParams.x);

  return by({
    async get() {
      const [err, result] = await fib({ x });
      return err
        ? bad({
            message: err.message,
            code: 1001,
          })
        : ok({
            method: "get",
            result: result.val,
          });
    },
    async post() {
      const [err, result] = await fib({ x });
      return err
        ? bad({
            message: err.message,
            code: 1001,
          })
        : ok({
            method: "post",
            result: result.val,
          });
    },
  });
});

route("/*notFound", ({ pathParams }) => {
  return bad({
    code: 4000,
    status: 404,
    message: `Not Found: ${pathParams.notFound}`,
  });
});

await serve(handler, { port: 7070 });

// addEventListener("error", () => {});
