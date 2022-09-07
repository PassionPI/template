import { defineMiddleware } from "@/app.ts";

export const logger = (tag?: string) =>
  defineMiddleware(async ({ request, url }, next) => {
    console.log(`-->${tag ? ` ${tag}` : ""}`, request.method, url.pathname);
    const st = Date.now();
    const resp = await next();
    const et = Date.now();
    console.log(
      `<--${tag ? ` ${tag}` : ""}`,
      request.method,
      url.pathname,
      resp.status,
      `${et - st}ms`
    );
    return resp;
  });
