import { fromEntries, once } from "../utils.ts";
import { BaseContext } from "./mod.ts";

export type Context = BaseContext & {
  url: URL;
  request: Request;
  form: () => Promise<FormData>;
  json: <J>() => Promise<J>;
  query: URLSearchParams;
  cookie: <C extends Record<string, string> = Record<never, never>>() => C;
  response: {
    status?: number;
    headers: Record<string, string>;
  };
};

export const createContext = ({ request }: { request: Request }) => {
  const { url: href, method } = request;
  const url = new URL(href);
  const { searchParams: query, pathname } = url;

  const form = once(() => request.formData());
  const json = once(<T>() => request.json() as Promise<T>);
  const cookie = once(() =>
    fromEntries(
      request.headers
        .get("Cookie")
        ?.split("; ")
        .map((kv) => kv.split("=")) ?? []
    )
  );

  const ctx: Context = Object.freeze({
    method,
    pathname,
    request,
    url,
    form,
    json,
    query,
    cookie,
    response: {
      headers: {},
    },
  });

  return ctx;
};