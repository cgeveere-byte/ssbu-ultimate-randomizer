#!/usr/bin/env node
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ogBg = join(root, "artifacts/imagine_images/0a88a0cc-475d-4a94-a530-031e29e46bdb.jpg");
const bannerBg = join(root, "artifacts/imagine_images/ff19ad73-d470-4a42-9ffd-7bb9fa9f6a1a.jpg");
const portraitIds = [
  "mario",
  "link",
  "samus",
  "pikachu",
  "fox",
  "kirby",
  "captain-falcon",
  "cloud",
  "joker",
  "inkling",
];

function dataUri(path, mime) {
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

const ogBgUri = dataUri(ogBg, "image/jpeg");
const bannerBgUri = dataUri(bannerBg, "image/jpeg");
const portraits = portraitIds.map((id) =>
  dataUri(join(root, `public/portraits/${id}.webp`), "image/webp"),
);

const ogHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: "Segoe UI", system-ui, sans-serif;
    background: #0a0a0b url("${ogBgUri}") center / cover no-repeat;
    color: #f4f4f5;
    position: relative;
  }
  .veil {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(10,10,11,.78) 0%, rgba(10,10,11,.38) 42%, rgba(10,10,11,.12) 70%, transparent 100%);
  }
  .copy {
    position: absolute; left: 56px; top: 96px; width: 540px;
    z-index: 2;
  }
  .kicker {
    font-size: 15px; letter-spacing: .28em; text-transform: uppercase;
    color: #e8c96a; font-weight: 600; margin: 0 0 14px;
  }
  h1 {
    margin: 0; font-size: 64px; line-height: .92; font-weight: 700;
    letter-spacing: -0.03em; text-shadow: 0 8px 28px rgba(0,0,0,.55);
  }
  .sub {
    margin: 18px 0 0; font-size: 22px; color: #d4d8e0; font-weight: 500;
    letter-spacing: -0.01em;
  }
  .row {
    position: absolute; left: 56px; bottom: 44px; display: flex; gap: 10px; z-index: 2;
  }
  .tile {
    width: 78px; height: 78px; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(232,201,106,.45);
    box-shadow: 0 10px 24px rgba(0,0,0,.45);
    background: #1a1a1e;
  }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>
  <div class="veil"></div>
  <div class="copy">
    <p class="kicker">Super Smash Bros. Ultimate</p>
    <h1>Ultimate<br>Randomizer</h1>
    <p class="sub">Weighted character select</p>
  </div>
  <div class="row">
    ${portraits.slice(0, 8).map((p) => `<div class="tile"><img src="${p}" alt=""></div>`).join("")}
  </div>
</body>
</html>`;

const bannerHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1200px; height: 264px; overflow: hidden; }
  body {
    font-family: "Segoe UI", system-ui, sans-serif;
    background: #0a0a0b url("${bannerBgUri}") center / cover no-repeat;
    color: #f4f4f5;
    position: relative;
  }
  .veil {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(10,10,11,.82) 0%, rgba(10,10,11,.42) 38%, rgba(10,10,11,.08) 68%, transparent 100%);
  }
  .copy {
    position: absolute; left: 36px; top: 50%; transform: translateY(-50%);
    z-index: 2; width: 400px;
  }
  .kicker {
    font-size: 11px; letter-spacing: .26em; text-transform: uppercase;
    color: #e8c96a; font-weight: 600; margin: 0 0 6px;
  }
  h1 {
    margin: 0; font-size: 34px; line-height: .95; font-weight: 700;
    letter-spacing: -0.03em; text-shadow: 0 6px 18px rgba(0,0,0,.5);
  }
  .sub { margin: 8px 0 0; font-size: 14px; color: #d4d8e0; font-weight: 500; }
  .row {
    position: absolute; left: 450px; top: 50%; transform: translateY(-50%);
    display: flex; gap: 8px; z-index: 2;
  }
  .tile {
    width: 72px; height: 72px; border-radius: 10px; overflow: hidden;
    border: 1px solid rgba(232,201,106,.45);
    box-shadow: 0 8px 18px rgba(0,0,0,.45);
    background: #1a1a1e;
  }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>
  <div class="veil"></div>
  <div class="copy">
    <p class="kicker">Smash Ultimate</p>
    <h1>Ultimate Randomizer</h1>
    <p class="sub">Weighted character select</p>
  </div>
  <div class="row">
    ${portraits.slice(0, 6).map((p) => `<div class="tile"><img src="${p}" alt=""></div>`).join("")}
  </div>
</body>
</html>`;

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shoot(html, width, height, outJpg) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const png = join(tmpdir(), `share-${width}x${height}.png`);
  await page.screenshot({ path: png, type: "png", fullPage: false });
  await page.close();
  execFileSync("ffmpeg", [
    "-y",
    "-i",
    png,
    "-vf",
    `scale=${width}:${height}`,
    "-q:v",
    "2",
    outJpg,
  ]);
}

mkdirSync(join(root, "public"), { recursive: true });
await shoot(ogHtml, 1200, 630, join(root, "public/og.jpg"));
await shoot(bannerHtml, 1200, 264, join(root, "public/x-banner.jpg"));
await browser.close();
console.log("wrote public/og.jpg 1200x630 and public/x-banner.jpg 1200x264");
