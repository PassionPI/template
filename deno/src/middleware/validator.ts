import { app } from "@/app/mod.ts";
import { z } from "@/libs/zod.ts";

export const body = (zod: z.ZodType) =>
  app.defineMiddleware(async ({ json }, next) => {
    const result = zod.safeParse(await json());
    if (result.success) {
      return await next();
    } else {
      throw result.error.format();
    }
  });

export const header = (zod: z.ZodType) =>
  app.defineMiddleware(async ({ header }, next) => {
    const result = zod.safeParse(header());
    if (result.success) {
      return await next();
    } else {
      throw result.error.format();
    }
  });
