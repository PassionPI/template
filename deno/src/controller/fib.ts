import { app } from "@/app/mod.ts";
import { fib_worker } from "@/worker/fib/mod.ts";

const fib = fib_worker();

export const cal = app.defineController<"/:x">(
  async ({ pathParams, ok, bad, request }) => {
    const x = Number(pathParams.x);
    const [err, result] = await fib({ x });
    return err
      ? bad({
          message: err.message,
          code: 1001,
        })
      : ok({
          method: request.method.toLowerCase(),
          result: result.val,
        });
  }
);
