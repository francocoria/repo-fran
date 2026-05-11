import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(__dirname, "../assets");

const targets = [
  { src: "icon-source.svg", out: "icon.png", size: 1024 },
  { src: "adaptive-icon-source.svg", out: "adaptive-icon.png", size: 1024 },
  { src: "splash-source.svg", out: "splash.png", width: 1242, height: 2436 },
];

async function run() {
  for (const t of targets) {
    const svgPath = resolve(assetsDir, t.src);
    const outPath = resolve(assetsDir, t.out);
    const svg = readFileSync(svgPath);

    const pipeline = sharp(svg, { density: 300 });
    if (t.width && t.height) {
      pipeline.resize(t.width, t.height);
    } else if (t.size) {
      pipeline.resize(t.size, t.size);
    }

    await pipeline.png().toFile(outPath);
    console.log(`✓ ${t.out}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
