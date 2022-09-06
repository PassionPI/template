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
