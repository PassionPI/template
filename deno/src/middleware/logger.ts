import { app } from "@/app/mod.ts";

export const logger = (tag?: string) =>
  app.defineMiddleware(async ({ method, pathname, response }, next) => {
    console.log(`-->${tag ? ` ${tag}` : ""}`, method, pathname);
    const st = Date.now();
    const resp = await next();
    const et = Date.now();
    console.log(
      `<--${tag ? ` ${tag}` : ""}`,
      method,
      pathname,
      response.status ?? 200,
      `${et - st}ms`
    );
    return resp;
  });
