import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
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
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
