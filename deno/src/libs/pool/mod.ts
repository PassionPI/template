import { either, pended } from "@/libs/fp_async.ts";

/**
 * @description 链表节点
 */
class LinkNode<T> {
  value: T;
  next: null | LinkNode<T> = null;

  constructor(value: T) {
    this.value = value;
  }
}
/**
 * @description 链表
 */
class LinkList<T> {
  #head: null | LinkNode<T> = null;
  #last: null | LinkNode<T> = null;
  #size = 0;

  size() {
    return this.#size;
  }

  shift(): undefined | T {
    const head = this.#head;
    if (this.#size) {
      this.#head = head!.next;
      this.#size--;
    }
    if (!this.#size) {
      this.#head = null;
      this.#last = null;
    }
    return head?.value;
  }

  push(value: T): void {
    const last = new LinkNode(value);
    if (this.#size) {
      this.#last!.next = last;
      this.#last! = last;
    } else {
      this.#head! = last;
      this.#last! = last;
    }
    this.#size++;
  }
}
/**
 *
 * @description 创建 & 封装 worker
 * 后续拆分, 分成创建 & 封装两个函数
 *
 * 创建:  根据环境创建对应实例
 *    browser - worker -> module
 *    deno    - worker -> module
 *    node    - worker_thread
 *
 * 封装:  封装成单个Promise函数
 */
function useWorker(option?: { type: "module" | "classic" }) {
  const url = new URL("./_worker.js", import.meta.url);
  const script =
    option?.type === "module"
      ? url
      : URL.createObjectURL(
          new Blob([new TextDecoder("utf-8").decode(Deno.readFileSync(url))], {
            type: "text/javascript",
          })
        );

  const worker = new Worker(script, option);

  const ref = { defer: pended() };

  worker.addEventListener("message", (e) => {
    const [err, result] = e.data || [];
    if (err != null) {
      ref.defer.reject(err.msg);
    } else {
      ref.defer.resolve(result);
    }
    ref.defer = pended();
  });

  const run = async <P extends unknown[], R extends unknown>(
    fn: (...arg: P) => R,
    arg: P
  ): Promise<R> => {
    worker.postMessage({
      payload: {
        fn: fn.toString(),
        arg,
      },
    });
    return (await ref.defer.pending) as R;
  };

  return { worker, run: either(run) };
}

export function usePool(config?: { max?: number }) {
  type Exec = <P extends unknown[], R extends unknown>(
    fn: (...arg: P) => R,
    arg: P,
    defer?: ReturnType<typeof pended>
  ) => Promise<Awaited<R>>;

  type ExecParam = Parameters<Exec>;

  const { max = navigator.hardwareConcurrency - 1 } = config || {};
  //* 存放worker实例
  const pool = new Map<number, ReturnType<typeof useWorker>>();
  //* 当前闲置可用的worker的key
  const resting: LinkList<number> = new LinkList();
  //* 等待worker执行的任务
  const waiting: LinkList<ExecParam> = new LinkList();

  const exec: Exec = async (fn, arg, defer) => {
    //* 没有闲置worker, 并且worker数量尚未达上限, 创建新worker, 重新调用exec
    if (resting.size() === 0 && pool.size < max) {
      const key = pool.size + 1;
      const instance = useWorker({ type: "module" });

      pool.set(key, instance);

      resting.push(key);

      return await exec(fn, arg, defer);
    }

    //* 有闲置worker, 使用闲置worker
    if (resting.size() > 0) {
      const key = resting.shift()!;
      const instance = pool.get(key)!;

      //* 运行worker, 执行函数
      const [err, result] = await instance.run(fn, arg);
      //* 执行完毕, 在休息区存放key
      resting.push(key);

      //* 如果有等待中的任务, 则异步调用exec
      if (waiting.size()) {
        //* 取出等待中的任务参数
        //* 这块怎么错误处理?
        //* 目测不需要处理,通过defer跳出来
        exec(...waiting.shift()!).catch(() => {});
      }

      //* 如果手动传入了defer
      if (defer) {
        //* 看情况, 修改defer异步状态
        if (err != null) {
          defer.reject(err);
        } else {
          defer.resolve(result);
        }
      }

      if (err != null) {
        throw err;
      }

      return result;
    }

    //* 此时没有闲置可用worker, 并且worker数量已达上限, 不允许创建新worker
    waiting.push([
      fn as (...arg: unknown[]) => unknown,
      arg,
      (defer = pended()),
    ]);

    return await (defer.pending as any);
  };

  return {
    exec: either(exec),
  };
}
