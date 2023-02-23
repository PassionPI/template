import { wasm } from "@/wasm/init.ts";
import * as Mod from "./mod.d.ts";

export default await wasm<typeof Mod>(import.meta.url, "./mod.wasm");
