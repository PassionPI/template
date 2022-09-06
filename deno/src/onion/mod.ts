import { UNEXPECTED_ERR } from "./common.ts";
import { context, Context } from "./context.ts";
import { createRouter } from "./createRouter.ts";
import { oni } from "./oni.ts";

export type Middleware<T> = (
  ctx: T,
  next: () => Promise<Response>
) => Promise<Response>;

export const onion = <
  Ext extends Record<string, unknown> = Record<never, never>
>() => {
  type Ctx = Context<Ext>;
  type Mid = Middleware<Ctx>;

  const middlers: Mid[] = [];

  const use = (...m: Mid[]) => middlers.push(...m);

  const { route, control } = createRouter<Ctx>();

  const handler = async (request: Request): Promise<Response> => {
    const ctx = context<Ext>(request);

    try {
      return await oni(middlers, control)(ctx);
    } catch (err: unknown) {
      return UNEXPECTED_ERR(err as Error);
    }
  };

  return {
    use,
    route,
    handler,
    defineMiddleware(mid: Mid) {
      return mid;
    },
  };
};
