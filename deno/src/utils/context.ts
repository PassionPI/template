import { Pipeline } from "@/libs/fp_async.ts";
import { formData, jsonData } from "./parse.ts";

export type Context<T extends Record<string, unknown> = Record<never, never>> =
  {
    url: URL;
    ext: Partial<T>;
    request: Request;
    searchParams: URLSearchParams;
    form: () => Pipeline<FormData>;
    json: <J>() => Pipeline<J>;
  };

export const context = <Ext extends Record<string, unknown>>(
  request: Request
) => {
  const url = new URL(request.url);
  const { searchParams } = url;

  const ctx: Context<Ext> = Object.freeze({
    request,
    url,
    searchParams,
    form: () => formData(request),
    json: <T>() => jsonData<T>(request),
    ext: {} as Ext,
  });

  return ctx;
};
