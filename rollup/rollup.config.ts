import cjs from "@rollup/plugin-commonjs";
import modules from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { wasm } from "@rollup/plugin-wasm";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/main.ts",
  output: [
    {
      file: "dist/bundle.esm.js",
      format: "esm",
    },
    {
      file: "dist/bundle.cjs.js",
      format: "cjs",
    },
  ],
  plugins: [modules(), cjs(), typescript(), wasm(), terser()],
};
