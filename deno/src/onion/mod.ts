import { UNEXPECTED_ERR } from "./common.ts";
import { context, Context } from "./context.ts";
import { createRouter } from "./createRouter.ts";
import { oni, Unit } from "./oni.ts";

export type Middleware<T> = Unit<T, Response>;

export const onion = <
  State extends Record<string, unknown> = Record<never, never>
>(cfg?: {
  state?: State;
}) => {
  type Ctx = Context<State>;
  type Mid = Middleware<Ctx>;

  const state = Object.freeze(cfg?.state ?? ({} as State));

  const middlers: Mid[] = [];

  const use = (...m: Mid[]) => middlers.push(...m);

  const { route, scope, control, defineRoute } = createRouter<Ctx>();

  const handler = async (request: Request): Promise<Response> => {
    const ctx = context<State>({ request, state });

    try {
      return await oni(middlers, control)(ctx);
    } catch (err: unknown) {
      return UNEXPECTED_ERR(err as Error);
    }
  };

  return {
    use,
    route,
    scope,
    handler,
    defineRoute,
    defineMiddleware: (mid: Mid) => mid,
  };
};
