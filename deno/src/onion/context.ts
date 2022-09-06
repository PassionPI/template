import { once } from "./utils.ts";

export type Context<T extends Record<string, unknown> = Record<never, never>> =
  {
    url: URL;
    ext: Partial<T>;
    request: Request;
    searchParams: URLSearchParams;
    form: () => Promise<FormData>;
    json: <J>() => Promise<J>;
  };

export const context = <Ext extends Record<string, unknown>>(
  request: Request
) => {
  const url = new URL(request.url);
  const { searchParams } = url;

  const form = once(() => request.formData());
  const json = once(<T>() => request.json() as Promise<T>);

  const ctx: Context<Ext> = Object.freeze({
    request,
    url,
    searchParams,
    form,
    json,
    ext: {} as Ext,
  });

  return ctx;
};
