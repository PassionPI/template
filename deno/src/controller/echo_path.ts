import { app } from "@/app/mod.ts";

export const echo_path = app.defineController(({ url, state }) =>
  state.ok({ value: url.pathname })
);
