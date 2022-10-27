import { BaseContext } from "./common.ts";
import { createDispatcher } from "./createDispatcher.ts";
import { Unit } from "./onion.ts";
import { RadixNode, RadixNodeKey } from "./radix.ts";
import {
  assertFn,
  assertStr,
  assign,
  entries,
  fromEntries,
  get,
  has,
  isArray,
  startWithSlash,
} from "./utils.ts";

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
/**
 * 原始key的别名
 * 主要是用于区别特殊类型
 * 例如 :xxx 或者 *yyy
 * 后续获取url参数时, 则 { [xxx]: 'xxx val' }
 */
type Alias = undefined | string;

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

export type ControllerReturn<T> = Promise<T> | T;

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

export const createRouter = <Ctx extends BaseContext, Result>(routerConfig: {
  notFound: (ctx: Ctx) => Result;
}) => {
  type RouterCtx<S extends string> = Ctx & {
    pathParams: PathParams<S>;
  };
  type Controller<S extends string> = (
    params: RouterCtx<S>
  ) => ControllerReturn<Result>;

  type BaseMid = Unit<Ctx, Result>;
  type RouteMid<S extends string> = Unit<RouterCtx<S>, Result>;

  type MethodValue<S extends string = string> = {
    routeMiddleware: RouteMid<S>[];
    controller?: Controller<S>;
  };

  type RadixValue<S extends string = string> = {
    alias: Alias;
    middleware: BaseMid[];
    methods: Map<Methods, MethodValue<S>>;
  };

  type Register = ReturnType<typeof routeRegister>;

  type ScopeConfigItem = {
    middleware?: BaseMid[];
    routes?: (register: Register) => void;
    scopes?: ScopeConfig;
  };

  type ScopeConfig = Record<`/${string}`, ScopeConfigItem>;

  const { notFound } = routerConfig ?? {};

  /**
   * 注册时使用的函数
   */

  const root = new RadixNode<RadixValue>();

  const initRadixValue = ({ alias }: { alias: Alias }): RadixValue => ({
    alias,
    middleware: [],
    methods: new Map(),
  });

  const initMethodValue = <S extends string>(): MethodValue<S> => ({
    routeMiddleware: [],
  });

  const getRadixValue = (path: string) => {
    return root.reduce(path.split("/").map(getKey), (node, { key, alias }) => {
      const child =
        node.getChild(key) ?? RadixNode.of(initRadixValue({ alias }));
      node.addChild(key, child);
      return child;
    }).value!;
  };

  const routeCreator = (method: Methods, basePath: string) => {
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      middleware: RouteMid<S>[],
      controller: Controller<S>
    ): void;
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      controller: Controller<S>
    ): void;
    function route<S extends `/${string}`>(
      path: UniqRoute | S,
      middleware: RouteMid<S>[] | Controller<S>,
      controller?: Controller<S>
    ) {
      assertStr("Path", path);

      const [mids, ctrl] = isArray(middleware)
        ? [
            middleware.map((mid) => assertFn("Middleware", mid)),
            assertFn("Controller", controller),
          ]
        : [[], assertFn("Controller", middleware)];

      const accPath = `${basePath}${
        has(UNIQ_ROUTE, path)
          ? get(UNIQ_ROUTE, path)
          : startWithSlash("Route path", path)
      }`;

      const radixValue = getRadixValue(accPath);

      const methodValue = (radixValue.methods.get(method) ??
        initMethodValue()) as MethodValue<S>;

      if (methodValue.controller) {
        throw Error(
          `Route with <Method: ${method} & Path: ${accPath}> already Registered!`
        );
      }

      methodValue.controller = ctrl;
      methodValue.routeMiddleware.push(...mids);
      radixValue.methods.set(method, methodValue);
    }
    return route;
  };

  const routeRegister = (basePath: string) => {
    return fromEntries(
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
    for (const [key, { middleware, routes, scopes }] of entries(config)) {
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

  const defineController = <S extends `/${string}` = `/${string}`>(
    fn: (...ctx: Parameters<Controller<S>>) => ControllerReturn<Result>
  ) => fn;
  const defineRoutes = (fn: (register: Register) => void) => fn;
  const defineScopes = (config: ScopeConfig) => config;

  /**
   *
   * 下面是运行时使用的函数
   */

  type Acc = {
    radix: null | RadixNode<RadixValue>;
    middleware: BaseMid[];
    params: Record<string, string>;
  };

  const accAssign = (
    target: Acc,
    aliasVal: string,
    radixNode: RadixNode<RadixValue<string>>
  ) => {
    const { alias, middleware = [] } = radixNode.value ?? {};
    target.radix = radixNode;
    target.middleware.push(...middleware);
    if (alias) {
      target.params[alias] = aliasVal;
    }
  };

  const match = (path: string) => {
    const acc: Acc = {
      radix: root,
      middleware: [],
      params: {},
    };
    const rest: Acc = {
      radix: null,
      middleware: [],
      params: {},
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
        rest.middleware = [...acc.middleware];
        accAssign(rest, `/${list.slice(i).join("/")}`, restNode);
      }

      if (nameNode) {
        accAssign(acc, name, nameNode);
        continue;
      }

      if (unitNode) {
        accAssign(acc, name, unitNode);
        continue;
      }

      assign(acc, rest);
      break;
    }

    return acc.radix?.value?.methods.size ? acc : rest;
  };

  const router = async (ctx: Ctx): Promise<Awaited<Result>> => {
    const { pathname, method } = ctx;
    const { middleware = [], radix, params } = match(pathname);
    const { methods } = radix?.value ?? {};

    const { controller, routeMiddleware = [] } =
      methods?.get(method as Methods) ?? methods?.get("all") ?? {};

    if (!controller) {
      return await notFound?.(ctx);
    }

    const { dispatcher } = createDispatcher<Ctx, Result>([
      ...middleware,
      ...(routeMiddleware as BaseMid[]),
    ]);

    return await dispatcher(
      {
        ...ctx,
        pathParams: params ?? {},
      },
      controller as () => Promise<Awaited<Result>>
    );
  };

  return {
    scopes,
    routes,
    router,
    defineController,
    defineScopes,
    defineRoutes,
  };
};
