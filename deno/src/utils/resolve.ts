export function resolve(meta: ImportMeta, path: string): string {
  return new URL(path, meta.url).href;
}

export async function wasm<Mod extends Record<string, unknown>>(
  meta: ImportMeta,
  path: string
) {
  const stream = fetch(resolve(meta, path));
  const mod = await WebAssembly.instantiateStreaming(stream);
  return mod.instance.exports as Mod;
}

export function worker<Mod extends Record<string, unknown>>(
  meta: ImportMeta,
  path: string
) {
  return new Worker(resolve(meta, path), {
    type: "module",
  });
}
