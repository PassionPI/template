import { oni, Unit } from "./oni.ts";

export const createDispatcher = <Ctx, Result>(
  initMids: Unit<Ctx, Result>[] = []
) => {
  type Mid = Unit<Ctx, Result>;

  const middlers: Mid[] = initMids;

  const use = (...m: Mid[]) => middlers.push(...m);

  const defineMiddleware = (mid: Mid) => mid;

  const dispatcher = async (
    context: Ctx,
    control: (ctx: Ctx) => Promise<Awaited<Result>>
  ) => await oni(middlers, control)(context);

  return { use, dispatcher, defineMiddleware };
};