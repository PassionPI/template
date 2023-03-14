import { wasm } from "@/utils/wasm/init.ts";
import * as Mod from "./mod.d.ts";

export default await wasm<typeof Mod>(import.meta.url, "./mod.wasm");
