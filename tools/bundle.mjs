import * as esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

const isWatch = process.argv[2] === "-w";
const env = isWatch ? "dev" : "prd";

const onSucceeded = () => {
  console.log(`${env} build succeeded: ./src/index.ts -> ./public/index.js`);
};
const onError = (err) => {
  console.error(`${env} build failed: ./src/index.ts`, err);
};

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: env === "prd",
  sourcemap: true,
  outfile: "./public/index.js",
  format: "esm",
  mainFields: ["module", "main"],
  conditions: ["module", "import", "default"],
};

// @spotify/basic-pitchのモデルをコピー
await copyDir(
  "./node_modules/@spotify/basic-pitch/model",
  "./public/model"
);

if (isWatch) {
  const plugins = [
    {
      name: "rebuild",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            onError(result.errors);
          } else {
            onSucceeded();
          }
        });
      },
    },
  ];
  const ctx = await esbuild.context({ ...buildOptions, plugins });
  await ctx.watch();
} else {
  await esbuild.build(buildOptions).catch(onError).then(onSucceeded);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}