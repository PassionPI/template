import { pended } from "../libs/fp_async.ts";
import { nanoid } from "../libs/nanoid.ts";

type Posted<T = unknown> = {
  meta: { id: string };
  payload: T;
};

function posted<T>(payload: T, init?: Posted): Posted<T> {
  if (init) {
    return { ...init, payload };
  }
  return {
    meta: { id: nanoid() },
    payload,
  };
}

export function defineWorkerListener<M, R>(
  listener: (api: {
    recall: (payload: R) => void;
  }) => (event: MessageEvent<Posted<M>>) => void
) {
  return (event: MessageEvent<Posted<M>>) => {
    const { data } = event;
    const recall = (payload: R) => {
      self.postMessage(posted(payload, data));
    };
    listener({ recall })(event);
  };
}

export function poster<M, R>(meta: ImportMeta, path: string) {
  const worker = new Worker(new URL(path, meta.url), {
    type: "module",
  });

  const pool = new Map<string, (data?: unknown) => void>();

  const post = (msg: M) => {
    const pend = pended();
    const value = posted(msg);
    pool.set(value.meta.id, pend.resolve);
    worker.postMessage(value);
    return pend.pending as Promise<R>;
  };

  worker.addEventListener("message", ({ data }) => {
    const id = data?.meta?.id;
    pool.get(id)?.(data.payload);
    pool.delete(id);
  });

  return post;
}
