import { pipe } from "@/utils/pipe";
import { add } from "rambda";

async function main() {
  console.log(pipe(add(1))(2));
}

main();
