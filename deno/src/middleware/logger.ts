import { app } from "@/app/mod.ts";

export const log = (tag?: string) =>
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

type Access = { access: string[] };

export const path = (...tags: string[]) =>
  app.defineMiddleware(async (_, next) => {
    const body = (await next()) as { data: Access };
    if (typeof body === "object" && body != null) {
      body.data ??= {} as Access;
      body.data.access ??= [];
      body.data.access.unshift(...tags);
    }
    return body;
  });
