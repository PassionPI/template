import { createContext } from "./binding/deno.ts";
import { createApp } from "./createApp.ts";

const bindingContext = {
  deno: createContext,
};

export { createApp, bindingContext };
