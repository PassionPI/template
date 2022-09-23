import { BaseContext } from "./binding/mod.ts";
import { createDispatcher } from "./createDispatcher.ts";
import { createRouter } from "./createRouter.ts";
import { once, RecordValues } from "./utils.ts";

export const createOnion = <
  ReqInputs extends unknown[],
  Ctx extends BaseContext = BaseContext,
  Result = void,
  Resp = void
>({
  context,
  notFound,
  responseOk,
  responseErr,
}: {
  context: (reqInputs: ReqInputs) => Ctx;
  notFound: (ctx: Ctx) => Result;
  responseOk: (ctx: Ctx, result: Result) => Resp;
  responseErr: (ctx: Ctx, err: Error) => Resp;
}) => {
  const { use, dispatcher, defineMiddleware } = createDispatcher<Ctx, Result>();

  const {
    control,
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

      return async (...ReqInputs: ReqInputs): Promise<Resp> => {
        const ctx = context(ReqInputs);
        try {
          return responseOk(ctx, await dispatcher(ctx, control));
        } catch (err: unknown) {
          return responseErr(
            ctx,
            err instanceof Error ? err : Error(JSON.stringify(err))
          );
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
