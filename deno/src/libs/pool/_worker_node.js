const { parentPort } = require("node:worker_threads");

parentPort.on("message", (data) => {
  const { payload } = data || {};
  const { fn, arg } = payload || {};

  const msg = (m) => m || "No Err Msg!";
  const err = (e) => ({
    msg: e instanceof Error ? msg(e.message) : JSON.stringify(msg(e)),
  });

  Promise.resolve(`return (${fn})(...arguments)`)
    .then(Function)
    .then((fn) => fn(...arg))
    .then(
      (r) => [null, r],
      (e) => [err(e), null]
    )
    .then((data) => parentPort.postMessage({ data }));
});
