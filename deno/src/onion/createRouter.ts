import { NOT_SUPPORTED, NO_RESPONSE } from "./common.ts";
import { Context } from "./context.ts";
import { Middleware } from "./mod.ts";
import { oni } from "./oni.ts";
import { RadixNode, RadixNodeKey } from "./radix.ts";

type Methods =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "any";

type LowerMethods =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "any";

export type GetParams<
  S extends string,
  P extends Record<string, string>
> = S extends `/${":" | "*"}${infer Params}`
  ? { [prop in keyof P | Params]: string }
  : P;

export type PathParams<
  S extends string,
  P extends Record<string, string> = Record<never, never>
> = S extends `/${infer Head}/${infer Rest}`
  ? PathParams<`/${Rest}`, GetParams<`/${Head}`, P>>
  : GetParams<S, P>;

export type RouterConfig<Ctx> = {
  notFound: (params: Ctx) => Promise<Response> | Response;
};

export type RouteResp = Promise<Response | undefined> | Response | undefined;

const REST = Symbol();
const UNIT = Symbol();
const REST_BYTE = "*";
const UNIT_BYTE = ":";

const split = (path: string) => path.split("/").slice(1);

const getKey = (
  key: string
): {
  key: RadixNodeKey;
  alias?: string;
} => {
  switch (key[0]) {
    case REST_BYTE:
      return {
        key: REST,
        alias: key.slice(1),
      };
    case UNIT_BYTE:
      return {
        key: UNIT,
        alias: key.slice(1),
      };
    default:
      return { key };
  }
};

export const createRouter = <Ctx extends Context>() => {
  type Route<S extends string = string> = (
    params: Ctx & {
      pathParams: PathParams<S>;
    }
  ) => RouteResp;

  type Mid = Middleware<Ctx>;

  type ValueMethod<S extends string = string> = {
    routeMiddleware: Mid[];
    control?: Route<S>;
  };
  type Value<S extends string = string> = {
    middleware: Mid[];
    methods: {
      [key in Methods]?: ValueMethod<S>;
    };
  };

  const root = new RadixNode<Value>({ key: "" });

  const initRadixValue = (): Value => ({
    middleware: [],
    methods: {},
  });

  const initRadixValueMethod = (): ValueMethod => ({
    routeMiddleware: [],
  });

  const getRadixValue = <S extends string>(path: S) => {
    return split(path).reduce((acc, name) => {
      const { key, alias } = getKey(name);
      if (acc.hasChild(key)) {
        return acc.getChild(key)!;
      }
      const childNode = new RadixNode<Value<S>>({ key, alias });
      acc.addChild(key, childNode);
      return childNode;
    }, root);
  };

  const routeCreator = (method: Methods) => {
    function route<S extends string>(
      path: S,
      middleware: Mid[],
      control: Route<S>
    ): void;
    function route<S extends string>(path: S, control: Route<S>): void;
    function route<S extends string>(
      path: S,
      middleware: Mid[] | Route<S>,
      control?: Route<S>
    ) {
      const [mids, ctrl] = Array.isArray(middleware)
        ? [middleware, control]
        : [[], middleware];
      if (typeof ctrl != "function") {
        throw Error("Must have route controller!");
      }
      const currentNode = getRadixValue<S>(path);
      currentNode.value ??= initRadixValue();
      currentNode.value.methods[method] ??= initRadixValueMethod();
      currentNode.value.methods[method]!.routeMiddleware.push(...mids);
      currentNode.value.methods[method]!.control = ctrl;
    }
    return route;
  };

  const route: {
    [key in LowerMethods]: ReturnType<typeof routeCreator>;
  } = {
    get: routeCreator("GET"),
    post: routeCreator("POST"),
    put: routeCreator("PUT"),
    delete: routeCreator("DELETE"),
    patch: routeCreator("POST"),
    head: routeCreator("HEAD"),
    options: routeCreator("OPTIONS"),
    any: routeCreator("any"),
  };

  const match = (path: string) => {
    const list = split(path);
    type Acc = {
      radix: RadixNode<Value>;
      middleware: Mid[];
      params: Record<string, string>;
      rest: Partial<Acc>;
    };
    const acc: Acc = {
      radix: root,
      middleware: [],
      params: {},
      rest: {
        middleware: [],
        params: {},
      },
    };

    const len = list.length;

    for (let i = 0; i < len; i++) {
      const name = list[i];
      const nameNode = acc.radix?.child.get(name);
      const unitNode = acc.radix?.child.get(UNIT);
      const restNode = acc.radix?.child.get(REST);
      /**
       * 把rest类型的path参数, 保存起来, 后面没匹配到的话, 就算匹配rest参数
       */
      if (restNode) {
        acc.rest.radix = restNode;
        acc.rest.params![restNode.alias!] = `/${list.slice(i).join("/")}`;
        acc.rest.middleware!.push(...(restNode?.value?.middleware ?? []));
      }

      if (nameNode) {
        acc.radix = nameNode;
        acc.middleware.push(...(acc.radix?.value?.middleware ?? []));
        continue;
      }

      if (unitNode) {
        acc.radix = unitNode;
        acc.params[unitNode.alias!] = name;
        acc.middleware.push(...(acc.radix?.value?.middleware ?? []));
        continue;
      }

      if (restNode || acc.rest) {
        acc.radix = acc.rest.radix!;
        acc.params = acc.rest.params!;
        acc.middleware.push(...(acc.radix?.value?.middleware ?? []));
        break;
      }
    }

    if (acc.radix.value) {
      return {
        value: acc.radix.value,
        middleware: acc.middleware,
        params: acc.params,
      };
    }
    return {
      value: acc.rest?.radix?.value,
      middleware: acc.rest.middleware,
      params: acc.rest?.params,
    };
  };

  const control = async (ctx: Ctx) => {
    const {
      url: { pathname },
      request,
    } = ctx;
    const method = request.method as Methods;
    const { middleware, value, params } = match(pathname);
    const { methods } = value ?? {};

    const { control, routeMiddleware } =
      methods?.[method] ?? methods?.any ?? {};

    const notSupported = () => NOT_SUPPORTED(method);
    const end = (control ?? notSupported) as () => Promise<Response>;

    const mids = [...(middleware ?? []), ...(routeMiddleware ?? [])];

    const response = await oni(
      mids,
      end
    )({
      ...ctx,
      pathParams: params ?? {},
    });

    return response ?? NO_RESPONSE();
  };

  return {
    route,
    control,
  };
};
