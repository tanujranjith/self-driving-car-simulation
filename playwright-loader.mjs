import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "playwright") {
    const entry = pathToFileURL(`${process.cwd()}/node_modules/playwright/index.mjs`).href;
    return nextResolve(entry, context);
  }
  return nextResolve(specifier, context);
}
