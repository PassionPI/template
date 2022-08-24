import { Pipeline, pipeline } from "@/libs/fp_async.ts";

export const jsonData = <T>(request: Request): Pipeline<T> =>
  pipeline().pipe(() => request.json()) as Pipeline<T>;

export const formData = (request: Request) =>
  pipeline(request).pipe((req) => req.formData()) as Pipeline<FormData>;
