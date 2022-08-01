export function resolve(meta: ImportMeta, path: string): string {
  const url = meta.url.split("/").slice(0, -1);
  const dir = path.split("/");
  for (let i = 0; i < dir.length; i++) {
    if (dir[i] === "..") {
      url.pop();
    } else if (dir[i] !== ".") {
      url.push(dir[i]);
    }
  }
  return url.join("/");
}

export async function wasm<Mod extends Record<string, unknown>>(
  meta: ImportMeta,
  path: string
) {
  const stream = fetch(resolve(meta, path));
  const mod = await WebAssembly.instantiateStreaming(stream);
  return mod.instance.exports as Mod;
}
