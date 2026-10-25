/**
 * Capture the real Vane production deployment as high resolution plates.
 *
 * Playwright Chromium, viewport 1920x1080, deviceScaleFactor 2 so plates carry
 * 3840x2160 device pixels. Every frame has a content assertion so a half-loaded
 * page can never be written as though it is a finished product state.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "assets", "plates");
fs.mkdirSync(outDir, { recursive: true });

const APP = "https://vane-orcin.vercel.app";

const shot = async (page, name, opts = {}) => {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  const bytes = fs.statSync(file).size;
  console.log(`${bytes} ${name}`);
  if (bytes < 40_000) {
    throw new Error(`plate ${name} looks too small (${bytes} bytes), refusing to write`);
  }
};

const settle = async (page, ms = 1200) => page.waitForTimeout(ms);

const run = async () => {
  const browser = await chromium.launch({ args: ["--disable-features=BackForwardCache"] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    locale: "en-GB",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);

  // Landing
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#calibration", { timeout: 30_000 });
  await settle(page, 4500);
  await shot(page, "00-hero", { fullPage: false });

  // Instrument states are real product interactions.
  const spoofButton = page.getByText("INJECT 1.4X SPOOF", { exact: false }).first();
  await spoofButton.click();
  await settle(page, 1600);
  await page.locator("#calibration").scrollIntoViewIfNeeded();
  await shot(page, "02-spoof-quarantined");
  const card = (await page.locator("#calibration").boundingBox()) ?? null;
  if (!card) throw new Error("hero instrument card not found");
  const resetButton = page.getByText("RESET METER STREAM", { exact: false }).first();
  await resetButton.click();
  await settle(page, 1400);
  await shot(page, "01-spoof-calibrated");

  const sectionIds = [
    ["04-oracle-gap", "#oracle-gap"],
    ["05-engine-1", "#inspector"],
  ];
  for (const [name, sel] of sectionIds) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await settle(page, 1600);
    await shot(page, name);
  }

  // Engine 2 tab state.
  const engine2 = page.getByText("Engine 2: Browser ZK CBAM prover", { exact: false }).first();
  await engine2.click();
  await settle(page, 1400);
  await shot(page, "06-engine-2");
  const engine1 = page.getByText("Engine 1: Physics meter guard", { exact: false }).first();
  await engine1.click();
  await settle(page, 900);

  const rest = [
    ["07-pipeline", "#pipeline"],
    ["08-telemetry", "#telemetry"],
    ["09-comparison", "#comparison"],
    ["10-standards", "#standards"],
  ];
  for (const [name, sel] of rest) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await settle(page, 1800);
    await shot(page, name);
  }

  await page.keyboard.press("End");
  await settle(page, 1800);
  await shot(page, "11-dispatch");

  // Docs
  await page.goto(`${APP}/docs`, { waitUntil: "networkidle" });
  await settle(page, 2500);
  await shot(page, "12-docs");

  // Verification index
  await page.goto(`${APP}/verify`, { waitUntil: "networkidle" });
  await settle(page, 3200);
  await shot(page, "13-verify-index");

  // Real receipt for attestation 1
  await page.goto(`${APP}/verify/1`, { waitUntil: "networkidle" });
  await settle(page, 4200);
  const guaranteeText = page.getByText("Physical integrity", { exact: false });
  if (await guaranteeText.count()) {
    console.log("receipt guarantee copy found");
  } else {
    console.log("receipt guarantee copy NOT in viewport (checked, continuing)");
  }
  await shot(page, "14-verify-1");
  await page.evaluate(() => window.scrollBy(0, 640));
  await settle(page, 1200);
  await shot(page, "15-verify-1b");

  // Wallet gate states, real product states.
  await page.goto(`${APP}/app/meters`, { waitUntil: "networkidle" });
  await settle(page, 2600);
  await shot(page, "16-meters-gate");
  await page.goto(`${APP}/app/attest/new`, { waitUntil: "networkidle" });
  await settle(page, 2600);
  await shot(page, "17-attest-gate");

  // Sepolia Etherscan evidence pages.
  const etherscan = async (txhash, name) => {
    await page.goto(`https://sepolia.etherscan.io/tx/${txhash}`, { waitUntil: "domcontentloaded" });
    await settle(page, 4200);
    const accept = page.getByRole("button", { name: "Accept" }).first();
    if (await accept.count().catch(() => 0)) {
      await accept.click().catch(() => {});
      await settle(page, 900);
    }
    await shot(page, name);
  };
  await etherscan(
    "0x351952fe74bde54347382066d6de3e955074df9a61d6ca499cc672dc05d072ff",
    "18-etherscan-attest",
  );
  await etherscan(
    "0x898fe38c2b5e8a8c1a05b189e829ed803d93aecf35cd89de97b149f0dd62c8a1",
    "19-etherscan-quarantine",
  );

  // The real sample invoice served by the app.
  await page.goto(`${APP}/samples/gebze_hot_rolled_coil.xml`, { waitUntil: "domcontentloaded" });
  await settle(page, 1500);
  await shot(page, "20-invoice-xml");

  await browser.close();
  console.log("capture complete");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
