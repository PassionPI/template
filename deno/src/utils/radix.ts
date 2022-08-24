type RadixNodeKey = string | symbol;
type RadixNodeMap = Map<RadixNodeKey, RadixNode>;

const REST = Symbol();
const UNIT = Symbol();
const REST_BYTE = "*";
const UNIT_BYTE = ":";

const getKey = (
  key: string,
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

class RadixNode {
  /**
   * 原始key
   * 标准字符串或者特殊类型的symbol
   */
  key: RadixNodeKey;
  /**
   * 子RadixNode集合
   * Map<RadixNodeKey, RadixNode>
   */
  child: RadixNodeMap;
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
  value?: () => void;

  constructor({ key, alias }: { key: RadixNodeKey; alias?: string }) {
    this.key = key;
    this.alias = alias;
    this.child = new Map();
  }

  addChild(key: RadixNodeKey, child: RadixNode) {
    this.child.set(key, child);
  }

  getChild(key: RadixNodeKey) {
    return this.child.get(key);
  }

  hasChild(key: RadixNodeKey) {
    return this.child.has(key);
  }

  noChild() {
    return !this.child.size;
  }

  setValue(value: () => void) {
    if (this.value) {
      throw new Error(
        `Value already set:
key: ${String(this.key)};
alias: ${this.alias}`,
      );
    }
    this.value = value;
  }
}

const path1 = "/asd/qwe/zxc";
const path2 = "/asd/:qwe/zxc";
const path3 = "/poi/*qwe";
const path4 = "/";

const createRoute = () => {
  const root = new RadixNode({ key: "" });

  const router = (path: string, value: () => void) => {
    const names = path.split("/").slice(1);
    const currentNode = names.reduce((acc, name) => {
      const { key, alias } = getKey(name);
      if (acc.hasChild(key)) {
        return acc.getChild(key)!;
      }
      const childNode = new RadixNode({ key, alias });
      acc.addChild(key, childNode);
      return childNode;
    }, root);

    currentNode.setValue(value);
  };

  const match = (path: string) =>
    path
      .split("/")
      .slice(1)
      .reduce(
        (acc, item) =>
          acc?.child.get(item) ?? acc?.child.get(UNIT) ?? acc?.child.get(REST)!,
        root,
      )
      ?.value;

  return {
    match,
    router,
  };
};

const { router, match } = createRoute();
router(path1, async () => {
  return await "path1";
});
router(path2, async () => {
  return await "path2";
});
console.log(await match(path1)?.());
console.log(await match(path2)?.());

/**
 * 取逻辑
 * -. 节点优先级 {Const} > {:Params} > {*Rest}; [即描述越精确的节点优先级越高]
 * -. 如果有{Const}，则继续往下找
 * -. 如果没有{Const}，则判断是否有{:Params}或{*Rest}
 *    ? 有{:Params}或{*Rest},记录两者,继续往下找[都需要保留到最后,因为是rest和alias...]
 *      ? 有结果 ->
 *    : 无 -> 404
 */
