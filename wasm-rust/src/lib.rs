use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn fib(x: i64) -> i64 {
    if x < 3 {
        return 1;
    }
    fib(x - 1) + fib(x - 2)
}
