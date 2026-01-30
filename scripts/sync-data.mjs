import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root is one level above /scripts
const repoRoot = path.resolve(__dirname, "..");

// source and destination
const src = path.resolve(repoRoot, "data/webring.json");
const dest = path.resolve(repoRoot, "frontend/public/webring.json");

fs.mkdirSync(path.dirname(dest), { recursive: true });

if (!fs.existsSync(src)) {
  console.error(`Missing file: ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`Synced ${src} -> ${dest}`);