import { NOT_SUPPORTED } from "./common.ts";
import { RouteResp } from "./createRouter.ts";

type Methods =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "any";

export type ByConfig = {
  [prop in Methods]?: () => RouteResp;
};

export const byCreator =
  (req: Request) =>
  (handler: ByConfig): RouteResp => {
    const method = req.method.toLowerCase() as Methods;
    const fx = handler?.[method] ?? handler?.any;
    return fx ? fx() : NOT_SUPPORTED(method);
  };
