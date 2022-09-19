import { app } from "@/app/mod.ts";

export const access = (...tags: string[]) =>
  app.defineMiddleware(async ({ state: { ok } }, next) => {
    const resp = await next();
    const body = await resp.json();
    body.data.access ??= [];
    body.data.access.unshift(...tags);
    return ok(body.data);
  });
