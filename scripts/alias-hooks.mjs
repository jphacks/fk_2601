import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function isFile(url) {
  const path = fileURLToPath(url);
  return existsSync(path) && statSync(path).isFile();
}

function findFile(base) {
  if (isFile(base)) return base;
  for (const ext of EXTENSIONS) {
    const candidate = new URL(base.href + ext);
    if (isFile(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let base = null;
  if (specifier.startsWith("@/")) {
    base = new URL(specifier.slice(2), SRC);
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith(SRC.href)) {
    base = new URL(specifier, context.parentURL);
  }
  if (base) {
    const found = findFile(base);
    if (found) return nextResolve(pathToFileURL(fileURLToPath(found)).href, context);
  }
  return nextResolve(specifier, context);
}
