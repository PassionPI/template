import { RouteResp } from "./radix.ts";

type Methods = "get" | "post" | "put" | "delete" | "patch" | "any";

export type ByConfig = {
  [prop in Methods]?: () => RouteResp;
};

export const by = (req: Request) => (handler: ByConfig) => {
  const method = req.method.toLowerCase() as Methods;
  const fx = handler?.[method] ?? handler?.any;
  if (fx) {
    return fx();
  }
  return new Response(
    JSON.stringify({
      message: `Method <${method}> is not supported!`,
    }),
    {
      status: 404,
    }
  );
};
