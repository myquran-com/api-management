import * as esbuild from "esbuild";

await esbuild.build({
    entryPoints: ["src/client/toast.tsx"],
    bundle: true,
    minify: true,
    outfile: "src/static/toast.js",
    format: "iife",
    target: ["es2020"],
    jsx: "automatic",
    jsxImportSource: "react",
});

console.log("Toast client built successfully");
