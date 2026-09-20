import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },

  // @std/assert (used only in tests) relies on newer lib.d.ts types
  // (ErrorOptions, Set.prototype.union/intersection/symmetricDifference)
  // that aren't in dnt's default "ES2021" lib set.
  compilerOptions: {
    lib: ["ESNext"],
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
