import { pipeline } from "../libs/fp_async.ts";

export const jsonData = <T>(request: Request) =>
  pipeline().pipe(() => request.json() as Promise<T>);

export const formDataEntries = (
  request: Request,
  deal: (value: FormData) => FormData = (v) => v
) =>
  pipeline(request)
    .pipe((req) => req.formData())
    .pipe(deal)
    .pipe((value) => value.entries());

export const formData = <T extends Record<string, FormDataEntryValue>>(
  request: Request,
  deal: (value: FormData) => FormData = (v) => v
) =>
  formDataEntries(request, deal).pipe(
    (entries) => Object.fromEntries(entries) as T
  );
