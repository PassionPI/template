export interface Pipe {
  <T1, R>(fn1: (t1: T1) => R): (init?: T1) => R;
  <T1, T2, R>(fn1: (t1: T1) => T2, fn2: (t2: T2) => R): (init?: T1) => R;
  <T1, T2, T3, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, T5, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => T5,
    fn5: (t5: T5) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, T5, T6, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => T5,
    fn5: (t5: T5) => T6,
    fn6: (t6: T6) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, T5, T6, T7, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => T5,
    fn5: (t5: T5) => T6,
    fn6: (t6: T6) => T7,
    fn7: (t7: T7) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, T5, T6, T7, T8, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => T5,
    fn5: (t5: T5) => T6,
    fn6: (t6: T6) => T7,
    fn7: (t7: T7) => T8,
    fn8: (t7: T8) => R
  ): (init?: T1) => R;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, R>(
    fn1: (t1: T1) => T2,
    fn2: (t2: T2) => T3,
    fn3: (t3: T3) => T4,
    fn4: (t4: T4) => T5,
    fn5: (t5: T5) => T6,
    fn6: (t6: T6) => T7,
    fn7: (t7: T7) => T8,
    fn8: (t7: T8) => T9,
    fn9: (t7: T9) => R
  ): (init?: T1) => R;
}

type Out<T> = T extends Promise<infer U> ? U : T;
type Init<T> = T extends Promise<infer U> ? T | U : Promise<T> | T;
type Chain<T> = T extends Promise<infer U> ? Promise<U> : T;
type Result<T> = T extends Promise<infer U> ? Promise<U> : Promise<T>;

export interface AsyncPipe {
  <T1, R>(fn1: (t1: Out<T1>) => Chain<R>): (init?: Init<T1>) => Result<R>;
  <T1, T2, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, T5, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<T5>,
    fn5: (t5: Out<T5>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, T5, T6, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<T5>,
    fn5: (t5: Out<T5>) => Chain<T6>,
    fn6: (t5: Out<T6>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, T5, T6, T7, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<T5>,
    fn5: (t5: Out<T5>) => Chain<T6>,
    fn6: (t5: Out<T6>) => Chain<T7>,
    fn7: (t5: Out<T7>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, T5, T6, T7, T8, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<T5>,
    fn5: (t5: Out<T5>) => Chain<T6>,
    fn6: (t5: Out<T6>) => Chain<T7>,
    fn7: (t5: Out<T7>) => Chain<T8>,
    fn8: (t5: Out<T8>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, R>(
    fn1: (t1: Out<T1>) => Chain<T2>,
    fn2: (t2: Out<T2>) => Chain<T3>,
    fn3: (t3: Out<T3>) => Chain<T4>,
    fn4: (t4: Out<T4>) => Chain<T5>,
    fn5: (t5: Out<T5>) => Chain<T6>,
    fn6: (t5: Out<T6>) => Chain<T7>,
    fn7: (t5: Out<T7>) => Chain<T8>,
    fn8: (t5: Out<T8>) => Chain<T9>,
    fn9: (t5: Out<T9>) => Chain<R>
  ): (init?: Init<T1>) => Result<R>;
}

export const pipe: Pipe =
  (...fns: Function[]) =>
  (acc?: unknown) => {
    for (const fn of fns) {
      acc = fn(acc);
    }
    return acc;
  };

export const asyncPipe: AsyncPipe =
  (...fns: Function[]) =>
  async (acc?: unknown) => {
    for (const fn of fns) {
      acc = fn(await acc);
    }
    return acc;
  };

export const log = <T>(v: T) => {
  console.log("Pipe log: ", v);
  return v;
};
