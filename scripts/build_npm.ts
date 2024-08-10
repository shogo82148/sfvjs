import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,

    // workaround for https://github.com/shogo82148/sfvjs/pull/5
    customDev: [
      {
        module: "./custom_error_options.ts",
        globalNames: ["ErrorOptions"],
      },
    ],
  },
  package: {
    // package.json properties
    name: "@shogo82148/sfv",
    version: Deno.args[0],
    description: "",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/shogo82148/sfvjs.git",
    },
    bugs: {
      url: "https://github.com/shogo82148/sfvjs/issues",
    },
  },

  // workaround for https://github.com/shogo82148/sfvjs/pull/5
  typeCheck: false,

  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
