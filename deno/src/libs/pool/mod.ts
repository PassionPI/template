import { either, lock, pended } from "@/libs/fp_async.ts";

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
 * @description 并发控制函数
 *
 * 1、是否有空闲
 * 2、数量池
 * 3、排队等待
 */
const currency = (config?: { max?: number }) => {
  const { max } = config || {};
};

//* 判断不同环境的函数
const isDeno = () => {
  return typeof Deno !== "undefined" && Deno.version != null;
};
const isNode = () => {
  //@ts-expect-error 环境判断函数
  return typeof process !== "undefined" && process.versions != null;
};
const isBrowser = () => {
  //@ts-expect-error 环境判断函数
  return typeof window !== "undefined" && window.document != null;
};
const getCpuCount = () => {
  if (isNode()) {
    //@ts-expect-error 环境判断函数
    return require("os").cpus().length;
  }
  if (isDeno() || isBrowser()) {
    return navigator.hardwareConcurrency;
  }
  throw new Error("Un Support Environment");
};
const createWorker = (): Worker => {
  if (isDeno() || isBrowser()) {
    const url = new URL("./_worker_web.js", import.meta.url);
    return new Worker(url, { type: "module" });
  }
  if (isNode()) {
    //@ts-expect-error node 环境
    const url = require("path").resolve(__dirname, "./_worker_node.js");
    //@ts-expect-error 环境判断函数
    return new require("worker_threads").Worker(url);
  }
  throw new Error("Un Support Environment");
};
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
 *  1、 错误处理
 *  2、 terminal
 *  3、 currency
 */
function useWorker() {
  const worker = createWorker();

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

  return { worker, run: lock(run) };
}

export function usePool(config?: { max?: number }) {
  type Exec = <P extends unknown[], R extends unknown>(
    fn: (...arg: P) => R,
    arg: P,
    defer?: ReturnType<typeof pended>
  ) => Promise<Awaited<R>>;

  type ExecParam = Parameters<Exec>;

  const { max = getCpuCount() - 1 } = config || {};
  //* 存放worker实例
  const pool = new Map<number, ReturnType<typeof useWorker>>();
  //* 当前闲置可用的worker的key
  const resting: LinkList<number> = new LinkList();
  //* 等待worker执行的任务
  const waiting: LinkList<ExecParam> = new LinkList();

  const create = (key: number) => {
    pool.set(key, useWorker());
    resting.push(key);
  };

  const _exec: Exec = async (fn, arg, defer) => {
    //* 如果没有闲置worker, 并且worker数量未达上限
    if (resting.size() === 0 && pool.size < max) {
      create(pool.size);
      return _exec(fn, arg, defer);
    }
    //* 有闲置worker, 使用闲置worker
    if (resting.size() > 0) {
      const key = resting.shift()!;
      //* 运行worker, 执行函数
      const [err, result] = await pool.get(key)!.run(fn, arg);
      //* 执行完毕, 在休息区存放key
      resting.push(key);

      //* 如果有等待中的任务, 则执行第一个等待中的任务
      if (waiting.size()) {
        //* 取出等待中的任务参数
        //* 错误目测不需要处理, 通过defer跳出来
        _exec(...waiting.shift()!).catch(() => {});
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
    } else {
      //* 此时没有闲置可用worker, 并且worker数量已达上限
      //* 直接放入等待队列中, 通过defer返回异步状态
      const defer = pended();
      waiting.push([fn as (...arg: unknown[]) => unknown, arg, defer]);
      return await (defer.pending as any);
    }
  };

  const exec = either(
    <P extends unknown[], R extends unknown>(fn: (...arg: P) => R, arg: P) =>
      _exec(fn, arg)
  );

  const terminate = () => {
    for (const { worker } of pool.values()) {
      worker.terminate();
    }
    pool.clear();
  };

  return {
    exec,
    terminate,
  };
}
