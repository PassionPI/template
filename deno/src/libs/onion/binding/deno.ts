import { BaseContext } from "../common.ts";
import { fromEntries, once } from "../utils.ts";

export type Context = BaseContext & {
  url: URL;
  request: Request;
  form: () => Promise<FormData>;
  json: <J>(defaultValue?: J) => Promise<J | undefined>;
  header: <H extends Record<string, string> = Record<never, never>>() => H;
  cookie: <C extends Record<string, string> = Record<never, never>>() => C;
  response: {
    headers: Record<string, string>;
    stream?: ReadableStream;
    status?: number;
    text?: string;
    blob?: Blob;
  };
};

export const createContext = ({ request }: { request: Request }) => {
  const { url: href, method } = request;
  const url = new URL(href);
  const { pathname } = url;

  const form = once(() => request.formData());
  const json = once(async <T>(defaultValue?: T) => {
    const result = (await request.json()) as T;
    return result ?? defaultValue;
  });
  const header = once(() => fromEntries(request.headers.entries()) as any);
  const cookie = once(
    () =>
      fromEntries(
        header()
          .Cookie?.split("; ")
          .map((kv: string) => kv.split("=")) ?? []
      ) as any
  );

  const ctx: Context = Object.freeze({
    method,
    pathname,
    request,
    url,
    form,
    json,
    header,
    cookie,
    response: {
      headers: {},
    },
  });

  return ctx;
};
