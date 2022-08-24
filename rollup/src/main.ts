import { pipe } from "@/utils/pipe";
import { createServer } from "http";
import { add } from "rambda";
import { fib } from "./wasm/fib/template_wasm_rust";

async function main() {
  createServer((req, res) => {
    const url = new URL(req.url!, "http://localhost:8080");
    const count = Number(url.searchParams.get("count") || "0");
    res.end(url.pathname + `fib(${count}): ` + fib(count));
  }).listen(9091);
  console.log(pipe(add(1))(2));
}

main();
