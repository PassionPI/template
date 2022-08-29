import { Pipeline, pipeline } from "@/libs/fp_async.ts";

function memory() {}

export const jsonData = <T>(request: Request): Pipeline<T> =>
  pipeline().pipe(() => request.json()) as Pipeline<T>;

export const formData = (request: Request) =>
  pipeline(request).pipe((req) => req.formData()) as Pipeline<FormData>;
