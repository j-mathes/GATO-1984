// Copies the parsed scenario JSON written by analysis/parse_scenarios.py into src/data/scenarios so Vite can bundle it.
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const from = new URL("../analysis/json/", root);
const to = new URL("src/data/scenarios/", root);
for (const dir of ["courses", "orders", "map"]) {
  mkdirSync(new URL(`${dir}/`, to), { recursive: true });
  cpSync(fileURLToPath(new URL(`${dir}/`, from)), fileURLToPath(new URL(`${dir}/`, to)), { recursive: true });
}
console.log("copied", readdirSync(fileURLToPath(new URL("courses/", to))).length, "course files");
