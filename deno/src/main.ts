import { serve } from "./libs/serve.ts";
import { fib_worker } from "./worker/fib/mod.ts";

const post = fib_worker();

await serve(
  async (req) => {
    const url = new URL(req.url);

    console.log(req.method, "-->", url.pathname);

    const x = Number(url?.searchParams.get("x") ?? 0);

    const [err, result] = await post({ x });

    return new Response(
      err ? `fib error: ${err.message}` : `fib(${x}): ${result.val}`
    );
  },
  { port: 7070 }
);

addEventListener("error", (event) => {
  event.preventDefault();
});
