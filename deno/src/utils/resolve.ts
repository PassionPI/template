export function resolve(base_url: string, path: string): URL {
  return new URL(path, base_url);
}
