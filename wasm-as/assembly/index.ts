// The entry file of your WebAssembly module.

export function fib(n: i32): i32 {
  let a = 0;
  let b = 1;
  if (n > 0) {
    while (--n) {
      let t = a + b;
      a = b;
      b = t;
    }
    return b;
  }
  return a;
}

function primeNum(val: i32): bool {
  let n: i32 = val;
  let num: i32 = 0;
  for (let i: i32 = 1; i <= n; i++) {
    if (n % i == 0) {
      num++;
    }
  }
  if (num > 2) {
    return false;
  }
  return true;
}

export function prime(n: i32): i32[] {
  const result: i32[] = [];
  while (n > 1) {
    if (primeNum(n)) {
      result.push(n);
    }
    n--;
  }
  return result;
}
