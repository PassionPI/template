import { defineMiddleware } from "@/app.ts";
import { bad } from "../help.ts";

export const catcher = defineMiddleware(async (_, next) => {
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
