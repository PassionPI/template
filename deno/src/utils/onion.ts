import { either } from "../libs/fp_async.ts";
import { formData, jsonData } from "./parse.ts";

export type BaseKey = string | number | symbol;

export type Unit<T, R> = (ctx: T, next: () => Promise<R>) => Promise<R>;

export type Context<T extends Record<string, unknown>> = {
  url: URL;
  ext: Partial<T>;
  request: Request;
  searchParams: URLSearchParams;
  form: () => ReturnType<typeof formData>;
  json: <J extends Record<string, unknown>>() => ReturnType<typeof jsonData<J>>;
};

export const once = <T>(fn: () => Promise<T>) => {
  let done = false;
  let result: T;
  return async () => {
    if (!done) {
      done = true;
      result = await fn();
    }
    return result;
  };
};

export const oni =
  <Ctx, Resp>(fns: Array<Unit<Ctx, Resp>>, end: () => Promise<Resp>) =>
  (ctx: Ctx) => {
    const next = (i: number): Promise<Resp> =>
      (fns[i] ?? end)(
        ctx,
        once(() => next(i + 1))
      );
    return next(0);
  };

export const onion = <
  Ext extends Record<string, unknown> = Record<string, unknown>
>() => {
  type Ctx = Context<Ext>;
  type Middleware = Unit<Ctx, Response>;

  const middlers = new Set<Middleware>();

  const use = (m: Middleware) => middlers.add(m);

  const next = oni([...middlers], () => Promise.resolve(new Response()));

  const call = either((ctx: Ctx) => next(ctx));

  const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const { searchParams } = url;

    const ctx: Ctx = Object.freeze({
      request,
      url,
      searchParams,
      json: <T extends Record<string, unknown>>() => jsonData<T>(request),
      form: () => formData(request),
      ext: {} as Ext,
    });

    const [err, resp] = await call(ctx);

    if (err) {
      return new Response(
        JSON.stringify({
          message: `Internal error: ${err.message}`,
        }),
        { status: 500 }
      );
    }

    return resp;
  };

  return {
    use,
    handler,
  };
};
