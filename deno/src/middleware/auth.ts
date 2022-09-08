import { app } from "@/app/mod.ts";

export const auth = () =>
  app.defineMiddleware(async (_, next) => {
    return await next();
  });
