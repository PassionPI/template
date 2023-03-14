import { lock, pended } from "@/libs/fp_async.ts";

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

  clear() {
    this.#head = null;
    this.#last = null;
    this.#size = 0;
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

  unshift(value: T): void {
    const head = new LinkNode(value);
    if (this.#size) {
      head.next = this.#head;
      this.#head = head;
    } else {
      this.#head! = head;
      this.#last! = head;
    }
    this.#size++;
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
type Task<T> = () => Promise<T>;

type TaskItem<T> = {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

class ConcurrentControl {
  #max_concurrency: number;
  #current_count = 0;
  #queue = new LinkList<TaskItem<any>>();

  constructor(config: { max_concurrency: number }) {
    const { max_concurrency } = config || {};
    this.#max_concurrency = max_concurrency;
  }

  add_task = <T>(task: Task<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      this.#queue.push({
        task,
        resolve,
        reject,
      });
      this.#next();
    });
  };

  busy = (): boolean => {
    return this.#current_count === this.#max_concurrency;
  };

  clear = () => {
    this.#queue.clear();
  };

  #check = (): boolean => {
    return !this.busy() && this.#queue.size() > 0;
  };

  #next = (): void => {
    while (this.#check()) {
      const { task, resolve, reject } = this.#queue.shift()!;
      this.#current_count++;
      Promise.resolve()
        .then(task)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.#current_count--;
          this.#next();
        });
    }
  };
}

//* 判断不同环境的函数
const is_deno = () => {
  return typeof Deno !== "undefined" && Deno.version != null;
};
const is_node = () => {
  //@ts-expect-error 环境判断函数
  return typeof process !== "undefined" && process.versions != null;
};
const is_browser = () => {
  //@ts-expect-error 环境判断函数
  return typeof window !== "undefined" && window.document != null;
};
const get_cpu_count = () => {
  if (is_node()) {
    //@ts-expect-error 环境判断函数
    return require("os").cpus().length;
  }
  if (is_deno() || is_browser()) {
    return navigator.hardwareConcurrency;
  }
  throw new Error("Un Support Environment");
};
/**
 *
 * @description 创建 worker
 * 创建:  根据环境创建对应实例
 *    browser - worker -> module
 *    deno    - worker -> module
 *    node    - worker_thread
 */
const create_worker = (): Worker => {
  if (is_deno() || is_browser()) {
    const url = new URL("./_worker_web.js", import.meta.url);
    return new Worker(url, { type: "module" });
  }
  if (is_node()) {
    //@ts-expect-error node 环境
    const url = require("path").resolve(__dirname, "./_worker_node.js");
    //@ts-expect-error 环境判断函数
    return new require("worker_threads").Worker(url);
  }
  throw new Error("Un Support Environment");
};
/**
 *
 * @description 封装 worker
 * 封装:  封装成单个Promise函数
 *  1、 错误处理
 *  2、 terminal
 *  3、 currency
 */
const worker_handler = () => {
  const worker = create_worker();

  const ref = { defer: pended<any>() };

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
    return await ref.defer.pending;
  };

  return { worker, run: lock(run) };
};

export function worker_pool(config?: { max?: number }) {
  const { max = get_cpu_count() - 1 } = config || {};
  //* 并发控制器
  const concurrent = new ConcurrentControl({ max_concurrency: max });
  //* 存放worker实例
  const pool = new Map<number, ReturnType<typeof worker_handler>>();
  //* 当前闲置可用的worker的key
  const rest: Array<number> = [];

  const create = () => {
    const { size } = pool;
    //* 如果没有闲置worker, 并且worker数量未达上限
    if (rest.length === 0 && size < max) {
      //* 创建一个worker实例, 并放入休息区
      pool.set(size, worker_handler());
      rest.push(size);
    }
  };

  const exec = <P extends unknown[], R extends unknown>(
    fn: (...arg: P) => R,
    arg: P
  ) => {
    //* 检查是否可创建新worker
    create();
    //* 并发任务队列添加任务
    return concurrent.add_task(async () => {
      //* 取出第一个休息区的key
      const key = rest.pop()!;
      //* 运行worker, 执行函数
      const result = await pool.get(key)!.run(fn, arg);
      //* 执行完毕, 在休息区存放key
      rest.push(key);

      return result;
    });
  };
  //* 关闭所有worker
  const terminate = () => {
    for (const { worker } of pool.values()) {
      worker.terminate();
    }
    pool.clear();
    rest.length = 0;
    concurrent.clear();
  };

  return {
    exec,
    terminate,
  };
}
