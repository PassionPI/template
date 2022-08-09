export async function wasm<Mod extends Record<string, unknown>>(
  meta: ImportMeta,
  path: string
) {
  return await fetch(new URL(path, meta.url))
    .then(WebAssembly.instantiateStreaming)
    .then((mod) => mod.instance.exports as Mod);
}
