import { execFileSync } from "node:child_process";
import fs from "node:fs";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? "true"];
  }),
);
const baseRef = args.get("base") ?? "origin/main";
const file = "src/content/generated-exercises.json";

const current = JSON.parse(fs.readFileSync(file, "utf8"));
let base = [];
try {
  const raw = execFileSync("git", ["show", `${baseRef}:${file}`], { encoding: "utf8" });
  base = JSON.parse(raw || "[]");
} catch {
  base = [];
}

let onlyContentChanged = false;
try {
  const files = execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  onlyContentChanged = files.length > 0 && files.every((name) => name === file);
} catch {
  onlyContentChanged = false;
}

const baseById = new Map(base.map((item) => [item.id, JSON.stringify(item)]));
const changed = current.filter((item) => baseById.get(item.id) !== JSON.stringify(item));
const pending = changed.filter((item) => item.review?.status !== "approved");
const shouldMerge = onlyContentChanged && changed.length > 0 && pending.length === 0;

console.log(`Only content file changed: ${onlyContentChanged}`);
console.log(`Changed items: ${changed.length}; pending/non-approved: ${pending.length}`);
for (const item of pending) {
  console.log(`  waiting: ${item.id} (${item.review?.status ?? "no review"})`);
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_merge=${shouldMerge}\n`);
} else {
  console.log(shouldMerge ? "should_merge=true" : "should_merge=false");
}
