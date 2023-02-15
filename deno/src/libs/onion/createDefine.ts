import { BaseContext } from "./common.ts";
import {
  ControllerFn,
  ControllerReturn,
  Register,
  ScopeConfig,
} from "./createRouter.ts";
import { Unit } from "./onion.ts";

export const createDefine = <Ctx extends BaseContext, Result>() => {
  type Mid = Unit<Ctx, Result>;
  type Controller<S extends string> = ControllerFn<S, Ctx, Result>;
  type RegisterWithCtx = Register<Ctx, Result>;
  type ScopeConfigWithCtx = ScopeConfig<Ctx, Result>;

  const defineMiddleware = (mid: Mid) => mid;

  const defineController = <S extends `/${string}` = `/${string}`>(
    fn: (...ctx: Parameters<Controller<S>>) => ControllerReturn<Result>
  ) => fn;

  const defineRoutes = (fn: (register: RegisterWithCtx) => void) => fn;

  const defineScopes = (config: ScopeConfigWithCtx) => config;

  return {
    defineMiddleware,
    defineController,
    defineRoutes,
    defineScopes,
  };
};
