import { app } from "@/app/mod.ts";
import { z } from "@/libs/zod.ts";

const body = (zod: z.ZodType) =>
  app.defineMiddleware(async ({ json }, next) => {
    const result = zod.safeParse(await json());
    if (result.success) {
      return await next();
    } else {
      throw result.error.format();
    }
  });

export const validator = {
  body,
};
