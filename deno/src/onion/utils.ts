type BaseRecord<K extends string = string, V = unknown> = Record<K, V>;
export type RecordValues<T extends BaseRecord> = T extends BaseRecord<
  string,
  infer V
>
  ? V
  : never;

export const once = <A extends unknown[], T>(fn: (...args: A) => T) => {
  let done = false;
  let result: T;
  return (...args: A) => {
    if (!done) {
      done = true;
      result = fn(...args);
    }
    return result;
  };
};

const assertType =
  (
    type:
      | "string"
      | "number"
      | "bigint"
      | "boolean"
      | "symbol"
      | "undefined"
      | "object"
      | "function"
  ) =>
  <T>(tag: string, x: T): T => {
    if (typeof x != type) {
      throw Error(`${tag} Must Be ${type}!`);
    }
    return x;
  };

export const assertFn = assertType("function");

export const assertStr = assertType("string");

export const startWithSlash = (tag: string, str: string): string => {
  assertStr("StartWithSlash Params", str);
  if (str[0] !== "/") {
    throw Error(`${tag ?? "Str"} should start with "/"`);
  }
  return str;
};
