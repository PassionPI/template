import { pipe } from "@/utils/pipe";
import { createServer } from "http";
import { add } from "rambda";
import "source-map-support/register";

async function main() {
  createServer((req, res) => {
    res.end(req.url);
  }).listen(9091);
  console.log(pipe(add(1))(2));
}

main();
