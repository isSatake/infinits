import * as esbuild from "esbuild";

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
};

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
