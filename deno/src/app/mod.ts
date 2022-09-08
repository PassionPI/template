import { bad, ok } from "@/app/help.ts";
import { onion } from "@/onion/mod.ts";

export const app = onion({
  state: {
    bad,
    ok,
  },
});
