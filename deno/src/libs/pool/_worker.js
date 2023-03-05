self.onmessage = (e) => {
  const { payload } = e.data || {};
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
    .then(self.postMessage);
};
