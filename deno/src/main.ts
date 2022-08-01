import { serve } from "./libs/serve.ts";
import wasm from "./utils/fib.ts";

await serve(
  () => {
    return new Response(`${wasm.fib(10)}`);
  },
  { port: 7070 }
);
