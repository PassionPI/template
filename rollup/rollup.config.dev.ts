import progress from "rollup-plugin-progress";
import { terser } from "rollup-plugin-terser";
import { common_config, common_plugins } from "./rollup.config";

export default {
  ...common_config(),
  plugins: [...common_plugins(), terser(), progress()],
};
