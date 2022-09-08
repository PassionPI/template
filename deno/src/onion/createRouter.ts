import { NOT_FOUND, NOT_SUPPORTED, NO_RESPONSE } from "./common.ts";
import { Context } from "./context.ts";
import { Middleware } from "./mod.ts";
import { oni } from "./oni.ts";
import { RadixNode, RadixNodeKey } from "./radix.ts";
import { assertFn, assertStr, startWithSlash } from "./utils.ts";

const REST = Symbol();
const UNIT = Symbol();
const ZERO = Symbol();
const REST_BYTE = "*";
const UNIT_BYTE = ":";
const METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
  "all",
] as const;
const UNIQ_ROUTE = { index: "" } as const;

type UniqRoute = keyof typeof UNIQ_ROUTE;
type Methods = typeof METHODS[number];

export type GetParams<
  S extends string,
  P extends Record<string, string>
> = S extends `/${typeof UNIT_BYTE | typeof REST_BYTE}${infer Params}`
  ? { [prop in keyof P | Params]: string }
  : P;

export type PathParams<
  S extends string,
  P extends Record<string, string> = Record<never, never>
> = S extends `/${infer Head}/${infer Rest}`
  ? PathParams<`/${Rest}`, GetParams<`/${Head}`, P>>
  : GetParams<S, P>;

export type ControllerReturn = Promise<Response> | Response;

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
  type Controller<S extends string> = (
    params: Ctx & {
      pathParams: PathParams<S>;
    }
  ) => ControllerReturn;

  type Mid = Middleware<Ctx>;

  type MethodValue<S extends string = string> = {
    routeMiddleware: Mid[];
    controller?: Controller<S>;
  };

  type RadixValue<S extends string = string> = {
    middleware: Mid[];
    methods: Map<Methods, MethodValue<S>>;
  };

  type Register = ReturnType<typeof routeRegister>;

  type ScopeConfigItem = {
    middleware?: Mid[];
    routes?: (register: Register) => void;
    scopes?: ScopeConfig;
  };

  type ScopeConfig = Record<`/${string}`, ScopeConfigItem>;

  /**
   * 注册时使用的函数
   */

  const root = new RadixNode<RadixValue>({ key: "" });

  const initRadixValue = (): RadixValue => ({
    middleware: [],
    methods: new Map(),
  });

  const initMethodValue = (): MethodValue => ({
    routeMiddleware: [],
  });

  const getRadixValue = <S extends string>(path: S) => {
    const radixNode = split(path).reduce((acc, name) => {
      const { key, alias } = getKey(name);
      const child = acc.getChild(key);
      if (child) {
        return child;
      }
      const childNode = new RadixNode<RadixValue<S>>({ key, alias });
      acc.addChild(key, childNode);
      return childNode;
    }, root);
    radixNode.value ??= initRadixValue();
    return radixNode.value;
  };

  const routeCreator = (method: Methods, basePath: string) => {
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      middleware: Mid[],
      controller: Controller<S>
    ): void;
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      controller: Controller<S>
    ): void;
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      middleware: Mid[] | Controller<S>,
      controller?: Controller<S>
    ) {
      assertStr("Path", path);

      const [mids, ctrl] = Array.isArray(middleware)
        ? [middleware, assertFn("Controller", controller)]
        : [[], assertFn("Controller", middleware)];

      const accPath = `${basePath}${
        Reflect.has(UNIQ_ROUTE, path)
          ? Reflect.get(UNIQ_ROUTE, path)
          : startWithSlash("Route path", path)
      }`;

      const radixValue = getRadixValue(accPath);

      if (!radixValue.methods.has(method)) {
        radixValue.methods.set(method, initMethodValue());
      }
      const methodVal = radixValue.methods.get(method)!;

      if (methodVal.controller) {
        throw Error(
          `Route with <Method: ${method} & Path: ${accPath}> already Registered!`
        );
      }

      methodVal.controller = ctrl;
      methodVal.routeMiddleware.push(
        ...mids.map((mid) => assertFn("Middleware", mid))
      );
    }
    return route;
  };

  const routeRegister = (basePath: string) => {
    return Object.fromEntries(
      METHODS.map((method) => {
        return [method.toLocaleLowerCase(), routeCreator(method, basePath)];
      })
    ) as {
      [key in Lowercase<Methods>]: ReturnType<typeof routeCreator>;
    };
  };

  const scopeCreator = (basePath: string | symbol, config: ScopeConfig) => {
    const isZero = basePath == ZERO;
    const base = isZero ? "" : (basePath as string);
    assertStr("Scope base", base);
    if (!isZero && base === "/") {
      throw Error('Scope should not use "/"');
    }
    if (!isZero) {
      startWithSlash("Scope", base);
    }
    for (const [key, { middleware, routes, scopes }] of Object.entries(
      config
    )) {
      const accPath = `${base}${key}`;

      const radixValue = getRadixValue(accPath);

      if (radixValue.middleware.length > 0) {
        throw Error(`Scope with <Path: ${accPath}> already Registered!`);
      }

      radixValue.middleware.push(...(middleware ?? []));
      routes?.(routeRegister(accPath));
      scopeCreator(accPath, scopes ?? {});
    }
  };

  const routes = (fn: (register: Register) => void) => fn(routeRegister(""));
  const scopes = (config: ScopeConfig) => scopeCreator(ZERO, config);

  const defineController = <S extends `/${string}` = `/`>(
    fn: (...ctx: Parameters<Controller<S>>) => ControllerReturn
  ) => fn;
  const defineRoutes = (fn: (register: Register) => void) => fn;
  const defineScopes = (config: ScopeConfig) => config;

  /**
   *
   * 下面是运行时使用的函数
   */

  const match = (path: string) => {
    type Acc = {
      radix: null | RadixNode<RadixValue>;
      middleware: Mid[];
      params: Record<string, string>;
      rest: Omit<Acc, "rest">;
    };

    const acc: Acc = {
      radix: root,
      middleware: [],
      params: {},
      rest: {
        radix: null,
        middleware: [],
        params: {},
      },
    };

    const assign = (name: string, radixNode: RadixNode<RadixValue<string>>) => {
      acc.radix = radixNode;
      if (radixNode.alias) {
        acc.params[radixNode.alias] = name;
      }
      acc.middleware.push(...(radixNode?.value?.middleware ?? []));
    };

    const list = split(path);

    for (let i = 0; i < list.length; i++) {
      const name = list[i];
      const nameNode = acc.radix?.getChild(name);
      const unitNode = acc.radix?.getChild(UNIT);
      const restNode = acc.radix?.getChild(REST);
      /**
       * 把rest类型的path参数, 保存起来, 后面没匹配到的话, 就算匹配rest参数
       */
      if (restNode) {
        acc.rest.radix = restNode;
        acc.rest.params[restNode.alias!] = `/${list.slice(i).join("/")}`;
        acc.rest.middleware = [
          ...acc.middleware,
          ...(restNode?.value?.middleware ?? []),
        ];
      }

      if (nameNode) {
        assign(name, nameNode);
        continue;
      }

      if (unitNode) {
        assign(name, unitNode);
        continue;
      }

      if (restNode || acc.rest) {
        Object.assign(acc, acc.rest);
        break;
      }
    }

    return acc.radix?.value?.methods.size ? acc : acc.rest;
  };

  const control = async (ctx: Ctx) => {
    const {
      url: { pathname },
      request,
    } = ctx;
    const method = request.method as Methods;
    const { middleware = [], radix, params } = match(pathname);
    const { methods } = radix?.value ?? {};

    if (!methods?.size) {
      return NOT_FOUND(pathname);
    }

    const { controller, routeMiddleware = [] } =
      methods?.get(method) ?? methods?.get("all") ?? {};

    if (!controller) {
      return NOT_SUPPORTED(method);
    }

    const mids = [...middleware, ...routeMiddleware];

    const response = await oni(
      mids,
      controller as () => Promise<Response>
    )({
      ...ctx,
      pathParams: params ?? {},
    });

    return response ?? NO_RESPONSE();
  };

  return {
    scopes,
    routes,
    control,
    defineController,
    defineScopes,
    defineRoutes,
  };
};
