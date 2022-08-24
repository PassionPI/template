import { either, oni, Pipeline } from "../libs/fp_async.ts";
import { formData, jsonData } from "./parse.ts";

export type Context<T extends Record<string, unknown>> = {
  url: URL;
  ext: Partial<T>;
  request: Request;
  searchParams: URLSearchParams;
  form: () => Pipeline<FormData>;
  json: <J>() => Pipeline<J>;
};

export const onion = <
  Ext extends Record<string, unknown> = Record<string, unknown>,
>() => {
  type Ctx = Context<Ext>;
  type Middleware = (
    ctx: Ctx,
    next: () => Promise<Response>,
  ) => Promise<Response>;

  const middlers: Middleware[] = [];

  const use = (m: Middleware) => middlers.push(m);

  const next = oni(middlers, () => Promise.resolve(new Response()));

  const call = either((ctx: Ctx) => next(ctx));

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

    const [err, resp] = await call(ctx);

    if (err) {
      return new Response(
        JSON.stringify({
          message: `Internal error: ${err.message}`,
        }),
        { status: 500 },
      );
    }

    return resp;
  };

  return {
    use,
    handler,
  };
};
