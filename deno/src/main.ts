import { serve } from "./libs/serve.ts";
import { onion } from "./utils/onion.ts";
import { fib_worker } from "./worker/fib/mod.ts";

const post = fib_worker();

const { use, handler } = onion();

use(async ({ request, url }, next) => {
  console.log("-->", request.method, url.pathname);
  const st = Date.now();
  const resp = await next();
  const et = Date.now();
  console.log("<--", request.method, url.pathname, resp.status, `${et - st}ms`);
  return resp;
});

use(async ({ request, url }, next) => {
  if (url.pathname === "/fib" && request.method === "GET") {
    const x = Number(url?.searchParams.get("x") ?? 0);

    const [err, result] = await post({ x });

    return new Response(
      err ? `fib error: ${err.message}` : `fib(${x}): ${result.val}!`
    );
  }

  return next();
});

use(async ({ request, url, json }, next) => {
  if (url.pathname === "/fib" && request.method === "POST") {
    const [err_json, data] = await json<{ x: number }>();
    if (err_json) {
      return next();
    }
    const [err, result] = await post(data);

    return new Response(
      err ? `fib error: ${err.message}` : `post-fib(${data.x}): ${result.val}`
    );
  }

  return next();
});

await serve(handler, { port: 7070 });

// addEventListener("error", () => {});
