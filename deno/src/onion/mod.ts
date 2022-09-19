import { UNEXPECTED_ERR } from "./common.ts";
import { context, Context } from "./context.ts";
import { createRouter } from "./createRouter.ts";
import { oni, Unit } from "./oni.ts";
import { once, RecordValues } from "./utils.ts";

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

  const defineMiddleware = (mid: Mid) => mid;

  const {
    control,
    routes,
    scopes,
    defineController,
    defineRoutes,
    defineScopes,
  } = createRouter<Ctx>();

  const handler = async (request: Request): Promise<Response> => {
    const ctx = context<State>({ request, state });

    try {
      return await oni(middlers, control)(ctx);
    } catch (err: unknown) {
      return UNEXPECTED_ERR(err as Error);
    }
  };

  const createHandler = once(
    (handlerConfig?: RecordValues<Parameters<typeof scopes>[0]>) => {
      if (handlerConfig?.middleware) {
        use(...handlerConfig?.middleware);
      }
      if (handlerConfig?.routes) {
        routes(handlerConfig.routes);
      }
      if (handlerConfig?.scopes) {
        scopes(handlerConfig.scopes);
      }
      return handler;
    }
  );

  return {
    createHandler,
    defineMiddleware,
    defineController,
    defineRoutes,
    defineScopes,
  };
};
