import { app } from "@/app/mod.ts";
import { fib } from "@/utils/worker/fib/mod.ts";
import { pool } from "@/utils/worker/mod.ts";

export const cal = app.defineController<"/:x">(
  async ({ pathParams, ok, bad, request }) => {
    const x = Number(pathParams.x);
    const [err, result] = await pool.exec(fib, [x]);
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
