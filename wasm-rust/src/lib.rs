use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn fib(x: i32) -> i32 {
    if x < 3 {
        return 1;
    }
    fib(x - 1) + fib(x - 2)
}
