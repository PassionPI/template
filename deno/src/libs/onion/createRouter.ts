import { BaseContext } from "./common.ts";
import { createDispatcher } from "./createDispatcher.ts";
import { Unit } from "./onion.ts";
import { RadixNode, RadixNodeKey } from "./radix.ts";
import {
  assertFn,
  assertStr,
  assign,
  endWithNoSlash,
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

export type RouterContext<S extends string, Ctx extends BaseContext> = Ctx & {
  pathParams: PathParams<S>;
};

export type ControllerFn<S extends string, Ctx extends BaseContext, Result> = (
  params: RouterContext<S, Ctx>
) => ControllerReturn<Result>;

export type Register<Ctx extends BaseContext, Result> = {
  [key in Lowercase<Methods>]: RouterRegisterFn<Ctx, Result>;
};

export type ScopeConfig<Ctx extends BaseContext, Result> = Record<
  `/${string}`,
  {
    middleware?: Unit<Ctx, Result>[];
    routes?: (register: Register<Ctx, Result>) => void;
    scopes?: ScopeConfig<Ctx, Result>;
  }
>;

export interface RouterRegisterFn<Ctx extends BaseContext, Result> {
  <S extends `/${string}`>(
    path: UniqRoute | S,
    middleware: Unit<RouterContext<S, Ctx>, Result>[],
    controller: ControllerFn<S, Ctx, Result>
  ): void;
  <S extends `/${string}`>(
    path: UniqRoute | S,
    controller: ControllerFn<S, Ctx, Result>
  ): void;
}

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
  onNotFound: (ctx: Ctx) => Result;
}) => {
  type RouterCtx<S extends string> = RouterContext<S, Ctx>;
  type Controller<S extends string> = ControllerFn<S, Ctx, Result>;

  type BaseMid = Unit<Ctx, Result>;
  type RouteMid<S extends string> = Unit<RouterCtx<S>, Result>;

  type RegisterWithCtx = Register<Ctx, Result>;
  type ScopeConfigWithCtx = ScopeConfig<Ctx, Result>;

  type MethodValue<S extends string = string> = {
    routeMiddleware: RouteMid<S>[];
    controller?: Controller<S>;
  };

  type RadixValue<S extends string = string> = {
    alias: Alias;
    middleware: BaseMid[];
    methods: Map<Methods, MethodValue<S>>;
  };

  const { onNotFound } = routerConfig ?? {};

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
    const route: RouterRegisterFn<Ctx, Result> = <S extends `/${string}`>(
      path: UniqRoute | S,
      middleware: RouteMid<S>[] | Controller<S>,
      controller?: Controller<S>
    ) => {
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
    };

    return route;
  };

  const routeRegister = (basePath: string) => {
    return fromEntries(
      METHODS.map((method) => {
        return [method.toLocaleLowerCase(), routeCreator(method, basePath)];
      })
    ) as RegisterWithCtx;
  };

  const scopeCreator = (
    basePath: string | symbol,
    config: ScopeConfigWithCtx
  ) => {
    const isZero = basePath == ZERO;
    const base = isZero ? "" : (basePath as string);
    assertStr("Scope base", base);
    if (!isZero && base === "/") {
      throw Error('Scope should not use "/"');
    }
    if (!isZero) {
      startWithSlash("Scope", base);
      endWithNoSlash("Scope", base);
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

  const routes = (fn: (register: RegisterWithCtx) => void) =>
    fn(routeRegister(""));
  const scopes = (config: ScopeConfigWithCtx) => scopeCreator(ZERO, config);

  /**
   *
   * 下面是运行时使用的函数
   */

  type Acc = {
    radix: null | RadixNode<RadixValue>;
    middleware: BaseMid[];
    params: Record<string, string>;
  };

  const accAssign = (params: {
    target: Acc;
    alias: string;
    radix: RadixNode<RadixValue<string>>;
  }) => {
    const { alias, middleware = [] } = params.radix.value ?? {};
    params.target.radix = params.radix;
    params.target.middleware.push(...middleware);
    if (alias) {
      params.target.params[alias] = params.alias;
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
        accAssign({
          target: rest,
          alias: `/${list.slice(i).join("/")}`,
          radix: restNode,
        });
      }

      if (nameNode) {
        accAssign({ target: acc, alias: name, radix: nameNode });
        continue;
      }

      if (unitNode) {
        accAssign({ target: acc, alias: name, radix: unitNode });
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
      return await onNotFound?.(ctx);
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
  };
};
