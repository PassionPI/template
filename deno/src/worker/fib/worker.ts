import { defineWorkerListener } from "@/worker/init.ts";
import { Data, Resp } from "./mod.ts";

self.onmessage = defineWorkerListener<Data, Resp>(async ({ data }) => {
  const mod_fib = await import("@/wasm/fib/mod.ts");

  const val = mod_fib.default.fib(data.payload.x);

  return { val };
});
