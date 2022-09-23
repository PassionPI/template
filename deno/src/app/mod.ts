import { COMMON_HEADERS } from "@/app/help.ts";
import { Context, createContext } from "@/onion/binding/deno.ts";
import { createOnion } from "@/onion/createOnion.ts";

type Body = string | Record<string, unknown> | Blob | ReadableStream;

type Help = {
  ok: <T extends Record<string, unknown>>(
    data: T
  ) => {
    code: 1000;
    message: "ok";
    data: T;
  };
  bad: (config: { code: number; status?: number; message: string }) => {
    code: number;
    message: string;
  };
};

export const app = createOnion<[Request], Context & Help, Body, Response>({
  context([request]) {
    const ctx = createContext({ request });
    return {
      ...ctx,
      ok(data) {
        Object.assign(ctx.response.headers, COMMON_HEADERS);
        return {
          code: 1000,
          message: "ok",
          data,
        };
      },
      bad({ code, status, message }) {
        Object.assign(ctx.response.headers, COMMON_HEADERS);
        ctx.response.status = status;
        return {
          code,
          message,
        };
      },
    };
  },
  notFound({ request: { method }, pathname, bad }) {
    return bad({
      code: 4000,
      status: 404,
      message: `Not Found: ${method} ${pathname}`,
    });
  },
  responseOk({ response }, result) {
    if (
      result == null ||
      result instanceof Blob ||
      result instanceof ReadableStream ||
      typeof result == "string"
    ) {
      return new Response(result, response);
    }
    return new Response(JSON.stringify(result), response);
  },
  responseErr(_, { message }) {
    return new Response(
      JSON.stringify({
        code: 5000,
        message,
      }),
      {
        status: 500,
      }
    );
  },
});
