import { once } from "./utils.ts";

export type Context<T extends Record<string, unknown> = Record<never, never>> =
  {
    url: URL;
    state: T;
    request: Request;
    searchParams: URLSearchParams;
    form: () => Promise<FormData>;
    json: <J>() => Promise<J>;
  };

export const context = <State extends Record<string, unknown>>({
  request,
  state,
}: {
  request: Request;
  state: State;
}) => {
  const url = new URL(request.url);
  const { searchParams } = url;

  const form = once(() => request.formData());
  const json = once(<T>() => request.json() as Promise<T>);

  const ctx: Context<State> = Object.freeze({
    request,
    url,
    searchParams,
    form,
    json,
    state,
  });

  return ctx;
};
