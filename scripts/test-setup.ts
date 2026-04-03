import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const publicDir = join(import.meta.dir, "../public");
mkdirSync(publicDir, { recursive: true });

const files: Record<string, string> = {
  "countries.json": JSON.stringify([
    { "cca3": "USA", "name": { "common": "United States" } },
    { "cca3": "JPN", "name": { "common": "Japan" } },
    { "cca3": "BRA", "name": { "common": "Brazil" } }
  ]),
  "gdp.json": JSON.stringify([{}, []]),
  "territories.json": "{}",
  "wikidata.json": "{}",
  "indicators.json": "{}"
};

console.log("🛠️ Preparing test environment...");

for (const [file, content] of Object.entries(files)) {
  const filePath = join(publicDir, file);
  if (!existsSync(filePath)) {
    console.log(`- Creating dummy ${file}...`);
    writeFileSync(filePath, content);
  } else {
    console.log(`- Found existing ${file}, skipping.`);
  }
}

console.log("✅ Test environment ready.");
