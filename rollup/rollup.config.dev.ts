import alias from "@rollup/plugin-alias";
import cjs from "@rollup/plugin-commonjs";
import modules from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { wasm } from "@rollup/plugin-wasm";

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
  plugins: [
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
  ],
};
