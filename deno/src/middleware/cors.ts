import { app } from "@/app/mod.ts";

export const cors = () =>
  app.defineMiddleware(async (_, next) => {
    return await next();
  });
