import alias from "@rollup/plugin-alias";
import cjs from "@rollup/plugin-commonjs";
import npm from "@rollup/plugin-node-resolve";
import run from "@rollup/plugin-run";
import ts from "@rollup/plugin-typescript";
import { wasm } from "@rollup/plugin-wasm";
import progress from "rollup-plugin-progress";
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from "rollup-plugin-terser";

function common_config() {
  return {
    input: "src/main.ts",
    output: [
      {
        file: "dist/app.cjs.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
  };
}

function common_plugins() {
  return [
    ts(),
    npm(),
    cjs(),
    wasm(),
    alias({
      entries: [{ find: "@", replacement: "src" }],
    }),
    sourcemaps()
  ];
}

const dev = process.env.ROLLUP_WATCH === "true";

function dev_plugins() {
  return [
    ...common_plugins(),
    run({
      // execArgv: ["-r", "source-map-support/register"],
    }),
  ];
}

function build_plugins() {
  return [...common_plugins(), terser(), progress()];
}

export default {
  ...common_config(),
  plugins: dev ? dev_plugins() : build_plugins(),
};
