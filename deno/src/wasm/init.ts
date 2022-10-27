export async function wasm<Mod extends Record<string, unknown>>(
  meta: ImportMeta,
  path: string
): Promise<Mod> {
  return await fetch(new URL(path, meta.url))
    .then(WebAssembly.instantiateStreaming)
    .then((mod) => mod.instance.exports as Mod);
}
