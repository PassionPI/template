import { COMMON_HEADERS } from "@/common/const.ts";
import { bindingContext, createApp } from "@/libs/onion/mod.ts";
import { mongo } from "@/service/mongo/mod.ts";

const context = (request: Request) => {
  const ctx = bindingContext.deno({ request });
  return {
    ...ctx,
    mongo,
    ok<T extends Record<string, unknown>>(data: T) {
      Object.assign(ctx.response.headers, COMMON_HEADERS);
      return {
        code: 1000,
        message: "ok",
        data,
      };
    },
    bad({
      code,
      status,
      message,
    }: {
      code: number;
      status?: number;
      message: string;
    }) {
      Object.assign(ctx.response.headers, COMMON_HEADERS);
      ctx.response.status = status;
      return {
        code,
        message,
      };
    },
  };
};

export const app = createApp<
  Parameters<typeof context>,
  ReturnType<typeof context>,
  Record<string, unknown> | null | undefined,
  Response
>({
  context,
  onOk({ response }, result) {
    const { stream, text, blob, ...ResponseInit } = response;
    const body = stream ?? blob ?? text;
    if (body) {
      if (body instanceof Response) {
        return body;
      }
      return new Response(body, ResponseInit);
    }
    if (result == null) {
      return new Response(result, ResponseInit);
    }
    return new Response(JSON.stringify(result), ResponseInit);
  },
  onThrow(_, err) {
    const message = err instanceof Error ? err.message : err;
    return new Response(
      JSON.stringify({
        code: 5000,
        message,
      }),
      {
        headers: COMMON_HEADERS,
        status: 500,
      }
    );
  },
  onNotFound({ method, pathname, bad }) {
    return bad({
      code: 4000,
      status: 404,
      message: `Not Found: ${method} ${pathname}`,
    });
  },
});
