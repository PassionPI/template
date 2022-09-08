import { app } from "@/app/mod.ts";
import { fib_worker } from "@/worker/fib/mod.ts";

const fib = fib_worker();

export const control_fib = app.defineController<"/:x">(
  async ({ pathParams, state, request }) => {
    const x = Number(pathParams.x);
    const [err, result] = await fib({ x });
    return err
      ? state.bad({
          message: err.message,
          code: 1001,
        })
      : state.ok({
          method: request.method.toLowerCase(),
          result: result.val,
        });
  }
);
