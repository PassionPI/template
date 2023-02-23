import { app } from "@/app/mod.ts";
import { serveDir } from "@/libs/file_server.ts";

export const dir = ({
  path,
  base_url,
  dir = `./`,
}: {
  path: `/${string}`;
  base_url: string;
  dir?: string;
}) => {
  const fsRoot = new URL(dir, base_url).pathname;

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
