type BaseType = string | number | boolean;

export function filterBaseTypeRecord(record: Record<string, unknown>) {
  return Object.entries(record ?? {}).reduce((acc, [key, val]) => {
    if (typeof val != "object") {
      acc[key] = val as BaseType;
    }
    return acc;
  }, {} as Record<string, BaseType>);
}
