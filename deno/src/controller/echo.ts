import { app } from "@/app/mod.ts";

export const path = app.defineController(({ url, ok }) => {
  return ok({ value: url.pathname });
});
