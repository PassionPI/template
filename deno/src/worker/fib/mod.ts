export const fib = async (x: number) => {
  const mod_fib = await import("@/wasm/fib/mod.ts");

  const val = mod_fib.default.fib(x);

  return { val };
};
