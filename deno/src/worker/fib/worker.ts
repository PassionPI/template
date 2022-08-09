import { defineWorkerListener } from "../init.ts";
import { Data, Resp } from "./mod.ts";

self.onmessage = defineWorkerListener<Data, Resp>(
  ({ recall }) =>
    async ({ data }) => {
      const mod_fib = await import("../../wasm/fib/mod.ts").then(
        (mod) => mod.default
      );

      const val = mod_fib.fib(data.payload.x);

      recall({ val });
    }
);
