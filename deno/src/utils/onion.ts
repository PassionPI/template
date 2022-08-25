import { oni, Pipeline } from "@/libs/fp_async.ts";
import { formData, jsonData } from "./parse.ts";
import { createRouter, RouterConfig } from "./radix.ts";

export type Context<T extends Record<string, unknown> = Record<never, never>> =
  {
    url: URL;
    ext: Partial<T>;
    request: Request;
    searchParams: URLSearchParams;
    form: () => Pipeline<FormData>;
    json: <J>() => Pipeline<J>;
  };

export const onion = <
  Ext extends Record<string, unknown> = Record<never, never>
>(cfg?: {
  routerConfig?: RouterConfig<Context<Ext>>;
}) => {
  const { routerConfig } = cfg ?? {};
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

  const { route, control } = createRouter<Ctx, Route>(routerConfig);

  const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const { searchParams } = url;

    const ctx: Ctx = Object.freeze({
      request,
      url,
      searchParams,
      form: () => formData(request),
      json: <T>() => jsonData<T>(request),
      ext: {} as Ext,
    });

    try {
      return await oni(middlers, control(ctx))(ctx);
    } catch (err: unknown) {
      return new Response(
        JSON.stringify({
          message: `Internal error: ${(err as Error).message}`,
        }),
        { status: 500 }
      );
    }
  };

  return {
    use,
    route,
    handler,
  };
};
