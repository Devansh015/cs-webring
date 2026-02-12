import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..");

const src = path.resolve(repoRoot, "data/webring.json");
const dest = path.resolve(repoRoot, "frontend/public/webring.json");

const srcMembers = path.resolve(repoRoot, "data/members.json");
const destMembers = path.resolve(repoRoot, "frontend/public/members.json");

fs.mkdirSync(path.dirname(dest), { recursive: true });

if (!fs.existsSync(src)) {
  console.error(`Missing file: ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`Synced ${src} -> ${dest}`);

if (fs.existsSync(srcMembers)) {
  fs.copyFileSync(srcMembers, destMembers);
  console.log(`Synced ${srcMembers} -> ${destMembers}`);
} else {
  console.warn(`members.json not found at ${srcMembers}`);
}
console.log(`Synced ${src} -> ${dest}`);
