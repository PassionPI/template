export type BaseContext = {
  method: string;
  pathname: string;
};

export type RecordValues<T extends Record<string, unknown>> = T extends Record<
  string,
  infer V
>
  ? V
  : never;
