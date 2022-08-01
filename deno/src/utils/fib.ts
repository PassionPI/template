import type * as Mod from "../../wasm/fib/mod.d.ts";
import { wasm } from "./resolve.ts";

export default await wasm<typeof Mod>(import.meta, "../../wasm/fib/mod.wasm");
