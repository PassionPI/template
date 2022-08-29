import { serve } from "@/libs/serve.ts";
import { onion } from "@/utils/onion.ts";
import { fib_worker } from "@/worker/fib/mod.ts";
import { bad, ok } from "./help.ts";

const fib = fib_worker();

const { use, route, handler } = onion();

use(async ({ request, url, json }, next) => {
  console.log("-->", request.method, url.pathname);
  await json();
  const st = Date.now();
  const resp = await next();
  const et = Date.now();
  console.log(
    "<--",
    request.method,
    url.pathname,
    resp.status,
    `${et - st}ms`,
    "\n"
  );
  return resp;
});

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
