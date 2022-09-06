import { once } from "./utils.ts";

type Unit<T, R> = (ctx: T, next: () => Promise<R>) => Promise<R>;

export const oni = <Ctx, Resp>(
  fns: Array<Unit<Ctx, Resp>>,
  end: (ctx: Ctx) => Promise<Resp>
) => {
  const len = fns?.length ?? 0;
  return (ctx: Ctx) => {
    const next = (i: number): Promise<Resp> => {
      if (i < len) {
        return fns[i](
          ctx,
          once(() => next(i + 1))
        );
      }
      return end(ctx);
    };
    return next(0);
  };
};
