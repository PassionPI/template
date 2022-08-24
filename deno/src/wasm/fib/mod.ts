import { wasm } from "@/wasm/init.ts";
import type * as Mod from "./mod.d.ts";

export default await wasm<typeof Mod>(import.meta, "./mod.wasm");
