/**
 * Etherscan re-shoot, headed so the Cloudflare challenge clears like a human visit.
 * Polls until the real transaction page content is present, refuses the challenge page.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "assets", "plates");
fs.mkdirSync(outDir, { recursive: true });

const TXS = [
  [
    "0x351952fe74bde54347382066d6de3e955074df9a61d6ca499cc672dc05d072ff",
    "18-etherscan-attest",
  ],
  [
    "0x898fe38c2b5e8a8c1a05b189e829ed803d93aecf35cd89de97b149f0dd62c8a1",
    "19-etherscan-quarantine",
  ],
];

const run = async () => {
  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    locale: "en-GB",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  for (const [tx, name] of TXS) {
    await page.goto(`https://sepolia.etherscan.io/tx/${tx}`, { waitUntil: "domcontentloaded" });

    let cleared = false;
    for (let i = 0; i < 36 && !cleared; i++) {
      await page.waitForTimeout(2500);
      const body = (await page.content()).toUpperCase();
      if (body.includes("TRANSACTION DETAILS") || body.includes("TRANSACTION STATUS")) {
        cleared = true;
      } else if (body.includes("PERFORMING SECURITY VERIFICATION")) {
        console.log(`${name}: challenge still up, waiting (${i})`);
      }
    }
    if (!cleared) throw new Error(`${name}: Cloudflare never cleared`);
    await page.waitForTimeout(2000);
    const accept = page.getByText("Got it!", { exact: true }).first();
    if (await accept.count().catch(() => 0)) {
      await accept.click().catch(() => {});
      await page.waitForTimeout(900);
    }
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${fs.statSync(file).size} ${name} cleared:true`);
  }

  await browser.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
