export const once = <A extends unknown[], T>(
  fn: (...args: A) => Promise<T>
) => {
  let done = false;
  let result: T;
  return async (...args: A) => {
    if (!done) {
      done = true;
      result = await fn(...args);
    }
    return result;
  };
};

export const assertFn = <T>(tag: string, fn: T): T => {
  if (typeof fn != "function") {
    throw Error(`${tag} Must Be Function!`);
  }
  return fn;
};

export const assertStr = <T>(tag: string, fn: T): T => {
  if (typeof fn != "string") {
    throw Error(`${tag} Must Be String!`);
  }
  return fn;
};
