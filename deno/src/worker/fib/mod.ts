import { poster } from "@/worker/init.ts";

export type Data = {
  x: number;
};

export type Resp = {
  val: number;
};

export const fib_worker = () => poster<Data, Resp>(import.meta, "./worker.ts");
