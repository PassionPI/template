import { serve } from "@/libs/serve.ts";
import { onion } from "@/utils/onion.ts";
import { fib_worker } from "@/worker/fib/mod.ts";

const fib = fib_worker();

const { use, route, handler } = onion();

use(async ({ request, url }, next) => {
  console.log("-->", request.method, url.pathname);
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
      return new Response(
        err ? `fib error: ${err.message}` : `fib(${x}): ${result.val}!`
      );
    },
    async post() {
      const [err, result] = await fib({ x });
      return new Response(
        err ? `fib error: ${err.message}` : `post-fib(${x}): ${result.val}`
      );
    },
  });
});

await serve(handler, { port: 7070 });

// addEventListener("error", () => {});
