import { either, pended } from "@/libs/fp_async.ts";
import { nanoid } from "@/libs/nanoid.ts";

type Posted<T = unknown> = {
  meta: { id: string };
  payload: T;
};

function posted<T>(payload: T, init?: Pick<Posted, "meta">): Posted<T> {
  if (init) {
    return { ...init, payload };
  }
  return {
    meta: { id: nanoid() },
    payload,
  };
}

export function defineWorkerListener<M, R>(
  listener: (event: MessageEvent<Posted<M>>) => R | Promise<Awaited<R>>
) {
  return async (event: MessageEvent<Posted<M>>) => {
    const meta = Object.freeze(event?.data?.meta);
    const response = await listener(event);
    self.postMessage(posted(response, { meta }));
  };
}

export function poster<M, R>(meta: ImportMeta, path: string) {
  let err: null | string = null;
  const worker = new Worker(new URL(path, meta.url), {
    type: "module",
  });

  const pool = new Map<string, ReturnType<typeof pended>>();

  const post = either((msg: M) => {
    if (err) {
      return Promise.reject(err);
    }
    const pend = pended();
    const value = posted(msg);
    pool.set(value.meta.id, pend);
    worker.postMessage(value);
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
