import { BaseContext, RecordValues } from "./common.ts";
import { createDefine } from "./createDefine.ts";
import { createDispatcher } from "./createDispatcher.ts";
import { createRouter } from "./createRouter.ts";

export const createApp = <
  Inputs extends unknown[] = [],
  Ctx extends BaseContext = BaseContext,
  Result = void,
  Resp = void
>({
  context,
  onOk,
  onThrow,
  onNotFound,
}: {
  context: (...inputs: Inputs) => Ctx;
  onOk: (ctx: Ctx, result: Result) => Resp;
  onThrow: (ctx: Ctx, err: unknown) => Resp;
  onNotFound: (ctx: Ctx) => Result;
}) => {
  const { defineMiddleware, defineController, defineRoutes, defineScopes } =
    createDefine<Ctx, Result>();

  const createHandler = (
    config?: RecordValues<ReturnType<typeof defineScopes>>
  ) => {
    const { use, dispatcher } = createDispatcher<Ctx, Result>();
    const { router, routes, scopes } = createRouter<Ctx, Result>({
      onNotFound,
    });

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
        return onOk(ctx, await dispatcher(ctx, router));
      } catch (err: unknown) {
        return onThrow(ctx, err);
      }
    };
  };

  return {
    createHandler,
    defineMiddleware,
    defineController,
    defineRoutes,
    defineScopes,
  };
};
