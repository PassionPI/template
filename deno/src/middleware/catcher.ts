import { app } from "@/app/mod.ts";

export const catcher = () =>
  app.defineMiddleware(async ({ state: { bad } }, next) => {
    try {
      return await next();
    } catch (e) {
      return bad({
        code: 5000,
        status: 500,
        message: e.message,
      });
    }
  });
