import { oni } from "@/libs/fp_async.ts";
import { UNEXPECTED_ERR } from "./common.ts";
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
    ctx: Ctx & { pathParams: PathParams }
  ) => Promise<Response>;

  const middlers: Middleware[] = [];

  const use = (m: Middleware) => middlers.push(m);

  const { route, control } = createRouter<Ctx, Route>();

  const handler = async (request: Request): Promise<Response> => {
    const ctx = context<Ext>(request);

    try {
      return await oni(middlers, control(ctx))(ctx);
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
