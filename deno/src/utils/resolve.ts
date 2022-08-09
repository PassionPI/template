export function resolve(meta: ImportMeta, path: string): URL {
  return new URL(path, meta.url);
}
