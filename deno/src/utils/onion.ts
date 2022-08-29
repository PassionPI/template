import { oni } from "@/libs/fp_async.ts";
import { byCreator } from "./by.ts";
import { NO_RESPONSE, UNEXPECTED_ERR } from "./common.ts";
import { context, Context } from "./context.ts";
import { createRouter } from "./radix.ts";

export const onion = <
  Ext extends Record<string, unknown> = Record<never, never>
>() => {
  type Ctx = Context<Ext>;
  type Middleware = (
    ctx: Ctx,
    next: () => Promise<Response>
  ) => Promise<Response>;
  type Route = <PathParams extends Record<string, string>>(
    ctx: Ctx & { pathParams: PathParams; by: ReturnType<typeof byCreator> }
  ) => Promise<Response>;

  const middlers: Middleware[] = [];

  const use = (m: Middleware) => middlers.push(m);

  const { route, match } = createRouter<Ctx, Route>();

  const handler = async (request: Request): Promise<Response> => {
    const ctx = context<Ext>(request);

    const control = async () => {
      const { url, request } = ctx;
      const { value, params } = match(url.pathname);
      const resp = await value?.({
        ...ctx,
        pathParams: params ?? {},
        by: byCreator(request),
      });
      return resp ?? NO_RESPONSE();
    };

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
  };
};
