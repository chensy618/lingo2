import fs from "node:fs";
import path from "node:path";
import { validateContent } from "./lib/content-schema.mjs";

const target = process.argv[2] ?? "src/content/generated-exercises.json";
const absolute = path.resolve(target);

if (!fs.existsSync(absolute)) {
  console.error(`Content file not found: ${target}`);
  process.exit(1);
}

let items;
try {
  items = JSON.parse(fs.readFileSync(absolute, "utf8"));
} catch (error) {
  console.error(`Invalid JSON in ${target}: ${error.message}`);
  process.exit(1);
}

const seedSource = fs.existsSync("src/lib/exercises.ts")
  ? fs.readFileSync("src/lib/exercises.ts", "utf8")
  : "";
const seedIds = [...seedSource.matchAll(/id:\s*"(tr_[^"]+)"/g)].map((match) => match[1]);
const { errors, warnings } = validateContent(items, { seedIds });

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

const approved = items.filter((item) => item.review?.status === "approved").length;
const pending = items.filter((item) => item.review?.status === "pending").length;
console.log(`Checked ${items.length} item(s): ${approved} approved, ${pending} pending, ${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length) process.exit(1);
