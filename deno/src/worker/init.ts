import { either, pended } from "@/libs/fp_async.ts";
import { nanoid } from "@/libs/nanoid.ts";

type WorkerAction<T = unknown> = {
  meta: { id: string };
  payload: T;
};

function createAction<T>(
  payload: T,
  init?: Pick<WorkerAction, "meta">
): WorkerAction<T> {
  if (init) {
    return { ...init, payload };
  }
  return {
    meta: { id: nanoid() },
    payload,
  };
}

export function defineWorkerListener<M, R>(
  listener: (event: MessageEvent<WorkerAction<M>>) => R | Promise<Awaited<R>>
) {
  return async (event: MessageEvent<WorkerAction<M>>) => {
    const meta = Object.freeze(event?.data?.meta);
    const resp = await listener(event);
    const action = createAction(resp, { meta });
    self.postMessage(action);
  };
}

export function poster<M, R>(base_url: string, path: string) {
  let err: null | string = null;
  const worker = new Worker(new URL(path, base_url), {
    type: "module",
  });

  const pool = new Map<string, ReturnType<typeof pended>>();

  const post = either((msg: M) => {
    if (err) {
      return Promise.reject(err);
    }
    const pend = pended();
    const action = createAction(msg);
    pool.set(action.meta.id, pend);
    worker.postMessage(action);
    return pend.pending as Promise<R>;
  });

  worker.addEventListener("message", ({ data }) => {
    const id = data?.meta?.id;
    pool.get(id)?.resolve?.(data.payload);
    pool.delete(id);
  });

  worker.addEventListener("error", (event) => {
    err = event.message;
    worker.terminate();
    event.preventDefault();
    pool.forEach(({ reject }) => reject(err));
    pool.clear();
  });

  return post;
}
