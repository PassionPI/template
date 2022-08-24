let imports = {};
let wasm;

/**
* @param {number} x
* @returns {number}
*/
module.exports.fib = function(x) {
    var ret = wasm.fib(x);
    return ret;
};

const path = require('path').join(__dirname, 'template_wasm_rust_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

