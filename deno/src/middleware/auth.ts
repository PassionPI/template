import { app } from "@/app/mod.ts";

export const jwt = () =>
  app.defineMiddleware(async (_, next) => {
    return await next();
  });
