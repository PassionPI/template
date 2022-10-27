/**
 * 原始key
 * 标准字符串或者特殊类型的symbol
 */
export type RadixNodeKey = string | symbol;
export type RadixNodeChild<T> = Map<RadixNodeKey, RadixNode<T>>;

export class RadixNode<T> {
  /**
   * 存储值
   */
  value?: T;
  /**
   * 子RadixNode集合
   * Map<RadixNodeKey, RadixNode>
   */
  child: RadixNodeChild<T> = new Map();

  static of<T>(value?: T) {
    const node = new RadixNode<T>();
    node.value = value;
    return node;
  }

  addChild(key: RadixNodeKey, child: RadixNode<T>) {
    return this.child.set(key, child);
  }

  getChild(key: RadixNodeKey) {
    return this.child.get(key);
  }

  reduce<PathItem>(
    paths: PathItem[],
    fn: (node: RadixNode<T>, path: PathItem) => RadixNode<T>
  ) {
    // deno-lint-ignore no-this-alias
    let acc: RadixNode<T> = this;
    for (let i = 1; i < paths.length; i++) {
      acc = fn(acc, paths[i]);
    }
    return acc;
  }
}
