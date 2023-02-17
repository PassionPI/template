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
  type DefinedControllerFn<S extends `/${string}` = `/${string}`> = (
    ...ctx: Parameters<Controller<S>>
  ) => ControllerReturn<Result>;
  type DefinedController = <S extends `/${string}` = `/${string}`>(
    fn: DefinedControllerFn<S>
  ) => DefinedControllerFn<S>;

  const defineMiddleware = (mid: Mid) => mid;

  const defineController: DefinedController = (fn) => fn;

  const defineRoutes = (fn: (register: RegisterWithCtx) => void) => fn;

  const defineScopes = (config: ScopeConfigWithCtx) => config;

  return {
    defineController,
    defineMiddleware,
    defineRoutes,
    defineScopes,
  };
};
