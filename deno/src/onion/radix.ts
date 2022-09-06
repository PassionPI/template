export type RadixNodeKey = string | symbol;
export type RadixNodeChild<T> = Map<RadixNodeKey, RadixNode<T>>;

export class RadixNode<T> {
  /**
   * 原始key
   * 标准字符串或者特殊类型的symbol
   */
  key: RadixNodeKey;
  /**
   * 子RadixNode集合
   * Map<RadixNodeKey, RadixNode>
   */
  child: RadixNodeChild<T>;
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

  noChild() {
    return this.child.size === 0;
  }

  setValue(value: T) {
    this.value = value;
  }
}
