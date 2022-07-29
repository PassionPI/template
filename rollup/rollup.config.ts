import alias from "@rollup/plugin-alias";
import cjs from "@rollup/plugin-commonjs";
import modules from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { wasm } from "@rollup/plugin-wasm";
import progress from "rollup-plugin-progress";
import { terser } from "rollup-plugin-terser";

export function common_config() {
  return {
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
  };
}

export function common_plugins() {
  return [
    typescript(),
    modules(),
    cjs(),
    alias({
      entries: [
        { find: "@", replacement: "src" },
        { find: "$", replacement: "src/utils" },
        { find: "$$", replacement: "src/wasm" },
      ],
    }),
    wasm(),
  ];
}

export default {
  ...common_config(),
  plugins: [...common_plugins(), terser(), progress()],
};
