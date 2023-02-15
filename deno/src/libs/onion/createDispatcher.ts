import { onion, Unit } from "./onion.ts";

export const createDispatcher = <Ctx, Result>(
  initMids: Unit<Ctx, Result>[] = []
) => {
  type Mid = Unit<Ctx, Result>;

  const middlers: Mid[] = initMids;

  const use = (...m: Mid[]) => middlers.push(...m);

  const dispatcher = async (
    context: Ctx,
    control: (ctx: Ctx) => Promise<Awaited<Result>>
  ) => await onion(middlers, control)(context);

  return { use, dispatcher };
};
