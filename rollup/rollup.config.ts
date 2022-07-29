import alias from "@rollup/plugin-alias";
import cjs from "@rollup/plugin-commonjs";
import npm from "@rollup/plugin-node-resolve";
import ts from "@rollup/plugin-typescript";
import { wasm } from "@rollup/plugin-wasm";
import progress from "rollup-plugin-progress";
import { terser } from "rollup-plugin-terser";

export function common_config() {
  return {
    input: "src/main.ts",
    output: [
      {
        file: "dist/app.cjs.js",
        format: "cjs",
      },
    ],
  };
}

export function common_plugins() {
  return [
    ts(),
    npm(),
    cjs(),
    wasm(),
    alias({
      entries: [{ find: "@", replacement: "src" }],
    }),
  ];
}

export default {
  ...common_config(),
  plugins: [...common_plugins(), terser(), progress()],
};
