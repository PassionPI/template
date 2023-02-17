import { app } from "@/app/mod.ts";
import { serveDir } from "@/libs/file_server.ts";

export const dir = ({
  path,
  meta,
  dir = `./`,
}: {
  path: `/${string}`;
  meta: ImportMeta;
  dir?: string;
}) => {
  const fsRoot = new URL(dir, meta.url).pathname;

  return app.defineMiddleware(async ({ pathname, request, response }, next) => {
    if (pathname.startsWith(path)) {
      response.stream = await serveDir(request, {
        fsRoot,
      });
      return;
    }
    return await next();
  });
};
