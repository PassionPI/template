import { app } from "@/app/mod.ts";

export const access = (...tags: string[]) =>
  app.defineMiddleware(async (_, next) => {
    const body = (await next()) as any;
    if (typeof body === "object" && body != null) {
      body.data ??= {};
      body.data.access ??= [];
      body.data.access.unshift(...tags);
    }
    return body;
  });
