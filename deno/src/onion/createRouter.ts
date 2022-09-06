import { ByConfig, byCreator } from "./by.ts";
import { NO_RESPONSE } from "./common.ts";
import { Context } from "./context.ts";
import { RadixNode, RadixNodeKey } from "./radix.ts";

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
      by: (cfg: ByConfig) => RouteResp;
    }
  ) => RouteResp;

  type Value = {
    middleware: [];
    control: Record<string, Route>;
  };

  const root = new RadixNode<Route>({ key: "" });

  const route = <S extends string>(path: S, value: Route<S>) => {
    const names = split(path);
    const currentNode = names.reduce((acc, name) => {
      const { key, alias } = getKey(name);
      if (acc.hasChild(key)) {
        return acc.getChild(key)!;
      }
      const childNode = new RadixNode<Route>({ key, alias });
      acc.addChild(key, childNode);
      return childNode;
    }, root);

    currentNode.setValue(value);
  };

  const match = (path: string) => {
    const list = split(path);
    type Acc = {
      radix: RadixNode<Route>;
      params: Record<string, string>;
      rest: Partial<Acc>;
    };
    const acc: Acc = {
      radix: root,
      params: {},
      rest: {
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
      }

      if (nameNode) {
        acc.radix = nameNode;
        continue;
      }

      if (unitNode) {
        acc.radix = unitNode;
        acc.params[unitNode.alias!] = name;
        continue;
      }

      if (restNode || acc.rest) {
        acc.radix = acc.rest.radix!;
        acc.params = acc.rest.params!;
        break;
      }
    }

    if (acc.radix.value) {
      return {
        value: acc.radix.value,
        params: acc.params,
      };
    }
    return {
      value: acc.rest?.radix?.value,
      params: acc.rest?.params,
    };
  };

  const control = async (ctx: Ctx) => {
    const { url, request } = ctx;
    const { value, params } = match(url.pathname);
    const resp = await value?.({
      ...ctx,
      pathParams: params ?? {},
      by: byCreator(request),
    });
    return resp ?? NO_RESPONSE();
  };

  return {
    route,
    control,
  };
};
