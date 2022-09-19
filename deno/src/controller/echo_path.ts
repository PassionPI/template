import { app } from "@/app/mod.ts";

export const echo_path = app.defineController(({ url, state: { ok } }) => {
  return ok({ value: url.pathname });
});
