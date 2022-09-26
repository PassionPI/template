import { app } from "@/app/mod.ts";

type Access = { access: string[] };

export const access = (...tags: string[]) =>
  app.defineMiddleware(async (_, next) => {
    const body = (await next()) as { data: Access };
    if (typeof body === "object" && body != null) {
      body.data ??= {} as Access;
      body.data.access ??= [];
      body.data.access.unshift(...tags);
    }
    return body;
  });
