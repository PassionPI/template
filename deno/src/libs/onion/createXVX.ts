import { BaseContext, RecordValues } from "./common.ts";
import { createDispatcher } from "./createDispatcher.ts";
import { createRouter } from "./createRouter.ts";
import { once } from "./utils.ts";

export const createXVX = <
  Inputs extends unknown[] = [],
  Ctx extends BaseContext = BaseContext,
  Result = void,
  Resp = void
>({
  context,
  notFound,
  response,
}: {
  context: (...inputs: Inputs) => Ctx;
  notFound: (ctx: Ctx) => Result;
  response: {
    onOk: (ctx: Ctx, result: Result) => Resp;
    onThrow: (ctx: Ctx, err: unknown) => Resp;
  };
}) => {
  const { use, dispatcher, defineMiddleware } = createDispatcher<Ctx, Result>();

  const {
    router,
    routes,
    scopes,
    defineController,
    defineRoutes,
    defineScopes,
  } = createRouter<Ctx, Result>({
    notFound,
  });

  const createHandler = once(
    (config?: RecordValues<Parameters<typeof scopes>[0]>) => {
      if (config?.middleware) {
        use(...config?.middleware);
      }

      if (config?.routes) {
        routes(config.routes);
      }

      if (config?.scopes) {
        scopes(config.scopes);
      }

      return async (...inputs: Inputs): Promise<Resp> => {
        const ctx = context(...inputs);
        try {
          return response.onOk(ctx, await dispatcher(ctx, router));
        } catch (err: unknown) {
          return response.onThrow(ctx, err);
        }
      };
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
