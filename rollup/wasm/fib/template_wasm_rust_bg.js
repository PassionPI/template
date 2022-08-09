import * as wasm from './template_wasm_rust_bg.wasm';

/**
* @param {number} x
* @returns {number}
*/
export function fib(x) {
    var ret = wasm.fib(x);
    return ret;
}

