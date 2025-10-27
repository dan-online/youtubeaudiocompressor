import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import {
  chromeExtension,
  simpleReloader,
} from "rollup-plugin-chrome-extension";
import { emptyDir } from "rollup-plugin-empty-dir";
import Icons from 'unplugin-icons/rollup';

const isProduction = process.env.NODE_ENV === "production";
export default {
	input: "src/manifest.json",
	output: {
		dir: "dist",
		format: "esm",
		chunkFileNames: path.join("chunks", "[name]-[hash].js"),
	},
	plugins: [
		replace({
			"process.env.NODE_ENV": isProduction
				? JSON.stringify("production")
				: JSON.stringify("development"),
			preventAssignment: true,
		}),
		chromeExtension(),
		simpleReloader(),
		resolve(),
		commonjs(),
		typescript(),
		emptyDir(),
    Icons({
      compiler: "raw"
    }),
	],
};
