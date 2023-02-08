import { createContext } from "./binding/deno.ts";
import { createXVX } from "./createXVX.ts";

const bindingContext = {
  deno: createContext,
};

export { createXVX, bindingContext };
