const esbuild = require("esbuild");
const { globSync } = require("glob");
const path = require("node:path");
const fs = require("node:fs");

const apiFiles = globSync(path.resolve(__dirname, "../src/api/**/*.ts"));
const jobsFiles = globSync(path.resolve(__dirname, "../src/jobs/**/*.ts"));

const files = [...apiFiles, ...jobsFiles];

const projectRootDir = path.resolve(__dirname, "..");

// Create a custom build for each file
files.forEach((file) => {
  const dirPath = path.dirname(file).replace(`${projectRootDir}/src`, "");
  const baseName = path.basename(file, ".ts");
  const outDir = path.join("dist", dirPath);
  const outPath = path.join(outDir, baseName, "index.js");

  // Ensure the directory structure exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  esbuild
    .build({
      entryPoints: [file],
      outfile: outPath,
      bundle: true,
      platform: "node",
      target: "es2020",
      format: "cjs",
      external: ["aws-sdk", "aws-lambda", "@types/aws-lambda"],
      minify: true,
    })
    .catch(() => process.exit(1));
});
