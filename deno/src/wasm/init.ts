export async function wasm<Mod extends Record<string, unknown>>(
  base_url: string,
  path: string
): Promise<Mod> {
  return await fetch(new URL(path, base_url))
    .then(WebAssembly.instantiateStreaming)
    .then((mod) => mod.instance.exports as Mod);
}
