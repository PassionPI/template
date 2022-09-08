import { once } from "./utils.ts";

export type Context<T extends Record<string, unknown> = Record<never, never>> =
  {
    url: URL;
    state: T;
    request: Request;
    form: () => Promise<FormData>;
    json: <J>() => Promise<J>;
    query: URLSearchParams;
    cookie: <C extends Record<string, string> = Record<never, never>>() => C;
  };

export const context = <State extends Record<string, unknown>>({
  request,
  state,
}: {
  request: Request;
  state: State;
}) => {
  const url = new URL(request.url);
  const { searchParams: query } = url;

  const form = once(() => request.formData());
  const json = once(<T>() => request.json() as Promise<T>);
  const cookie = once(() =>
    Object.fromEntries(
      request.headers
        .get("Cookie")
        ?.split("; ")
        .map((kv) => kv.split("=")) ?? []
    )
  );

  const ctx: Context<State> = Object.freeze({
    request,
    url,
    form,
    json,
    query,
    state,
    cookie,
  });

  return ctx;
};
