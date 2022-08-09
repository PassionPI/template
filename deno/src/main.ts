import { serve } from "./libs/serve.ts";
import { fib_worker } from "./worker/fib/mod.ts";

await serve(
  async (req) => {
    const url = new URL(req.url);
    console.log(req.method, "-->", url.pathname);
    const x = Number(url?.searchParams.get("x") ?? 0);
    const { val } = await fib_worker()({ x });
    return new Response(`fib(${x}): ${val}`);
  },
  { port: 7070 }
);
