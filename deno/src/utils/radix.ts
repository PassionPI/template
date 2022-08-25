import { by, ByConfig } from "./by.ts";
import { Context } from "./onion.ts";

type RadixNodeKey = string | symbol;
type RadixNodeMap<T> = Map<RadixNodeKey, RadixNode<T>>;
type GetParams<
  S extends string,
  P extends Record<string, string>
> = S extends `/${":" | "*"}${infer Params}`
  ? { [prop in keyof P | Params]: string }
  : P;

type PathParams<
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
const NO_RESPONSE = JSON.stringify({ message: "No Response!" });

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

class RadixNode<T> {
  /**
   * 原始key
   * 标准字符串或者特殊类型的symbol
   */
  key: RadixNodeKey;
  /**
   * 子RadixNode集合
   * Map<RadixNodeKey, RadixNode>
   */
  child: RadixNodeMap<T>;
  /**
   * 原始key的别名
   * 主要是用于区别特殊类型
   * 例如 :xxx 或者 *yyy
   * 后续获取url参数时, 则 { [xxx]: 'xxx val' }
   */
  alias?: string;
  /**
   * 存储值
   */
  value?: T;

  constructor({ key, alias }: { key: RadixNodeKey; alias?: string }) {
    this.key = key;
    this.alias = alias;
    this.child = new Map();
  }

  addChild(key: RadixNodeKey, child: RadixNode<T>) {
    this.child.set(key, child);
  }

  getChild(key: RadixNodeKey) {
    return this.child.get(key);
  }

  hasChild(key: RadixNodeKey) {
    return this.child.has(key);
  }

  setValue(value: T) {
    if (this.value) {
      throw new Error(
        `Value already set:
key: ${String(this.key)};
alias: ${this.alias}`
      );
    }
    this.value = value;
  }
}

export const createRouter = <Ctx extends Context, T>(
  cfg?: RouterConfig<Ctx>
) => {
  const root = new RadixNode<T>({ key: "" });
  const config: RouterConfig<Ctx> = Object.assign(
    {
      notFound: ({ url }: Ctx) =>
        new Response(
          JSON.stringify({
            message: `Not Found: ${url.pathname}`,
          }),
          { status: 404 }
        ),
    },
    cfg
  );

  const route = <S extends string>(
    path: S,
    value: (
      params: Ctx & {
        pathParams: PathParams<S>;
        by: (cfg: ByConfig) => RouteResp;
      }
    ) => RouteResp
  ) => {
    const names = split(path);
    const currentNode = names.reduce((acc, name) => {
      const { key, alias } = getKey(name);
      if (acc.hasChild(key)) {
        return acc.getChild(key)!;
      }
      const childNode = new RadixNode<T>({ key, alias });
      acc.addChild(key, childNode);
      return childNode;
    }, root);

    currentNode.setValue(value as any);
  };

  const match = (path: string) => {
    const list = split(path);
    const acc = {
      radix: root,
      params: {} as Record<string, string>,
    };
    for (let i = 0; i < list.length; i++) {
      const name = list[i];
      const staticNode = acc.radix?.child.get(name)!;
      if (staticNode) {
        acc.radix = staticNode;
        continue;
      }

      const unitNode = acc.radix?.child.get(UNIT)!;
      if (unitNode) {
        acc.radix = unitNode;
        acc.params[unitNode.alias!] = name;
        continue;
      }

      const restNode = acc.radix?.child.get(REST)!;
      if (restNode) {
        acc.radix = restNode;
        acc.params[restNode.alias!] = `/${list.slice(i).join("/")}`;
        break;
      }
    }

    if (acc.radix?.value) {
      return {
        value: acc.radix.value,
        params: acc.params,
      };
    }
    return {
      value: config.notFound,
      params: {},
    };
  };

  const control = (ctx: Ctx) => {
    const { url, request } = ctx;
    const { value, params } = match(url.pathname);
    return async () =>
      (await (value as any)?.({
        ...ctx,
        pathParams: params,
        by: by(request),
      })) ?? new Response(NO_RESPONSE);
  };

  return {
    route,
    control,
  };
};
