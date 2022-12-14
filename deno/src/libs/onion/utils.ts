export const { assign, entries, fromEntries } = Object;
export const { isArray } = Array;
export const { get, has } = Reflect;

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
    // deno-lint-ignore valid-typeof
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
    throw Error(`${tag ?? str ?? "Str"} should start with "/"`);
  }
  return str;
};

export const endWithNoSlash = (tag: string, str: string): string => {
  assertStr("EndWithNoSlash Params", str);
  if (str.length > 1 && str.at(-1) === "/") {
    throw Error(`${tag ?? str ?? "Str"} should not end with "/"`);
  }
  return str;
};
