import { defineMiddleware } from "@/app.ts";

export const logger = defineMiddleware(async ({ request, url }, next) => {
  console.log("-->", request.method, url.pathname);
  const st = Date.now();
  const resp = await next();
  const et = Date.now();
  console.log(
    "<--",
    request.method,
    url.pathname,
    resp.status,
    `${et - st}ms`,
    "\n"
  );
  return resp;
});
