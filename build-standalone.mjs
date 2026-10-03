import fs from "node:fs";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
const assetNames = ["series-rc", "series-rc-vc", "series-rl", "series-rlc", "series-rlc-voltages", "parallel-rc", "parallel-rl", "loaded-rc-divider", "loaded-rl-divider", "phasor-reference", "sine-wave-reference", "series-r-lc", "series-r-ll", "series-r-cc", "parallel-r-lc", "parallel-r-ll", "parallel-r-cc", "series-r-parallel-lc", "series-r-parallel-ll", "series-r-parallel-cc", "parallel-r-series-lc", "parallel-r-series-ll", "parallel-r-series-cc", "series-r-parallel-rc", "rc-lowpass", "rc-highpass", "lr-output-r", "lr-output-l", "rlc-output-r", "rlc-output-lc"];
const assets = Object.fromEntries(assetNames.map((name) => {
  const bytes = fs.readFileSync(new URL(`./assets/${name}.svg`, import.meta.url));
  return [name, `data:image/svg+xml;base64,${bytes.toString("base64")}`];
}));
const embeddedJs = `window.CIRCUIT_ASSETS = ${JSON.stringify(assets)};\n${js}`;

const standalone = html
  .replace('  <link rel="stylesheet" href="styles.css">', `  <style>\n${css}\n  </style>`)
  .replace('  <script src="app.js"></script>', `  <script>\n${embeddedJs}\n  </script>`);

if (standalone === html || standalone.includes('href="styles.css"') || standalone.includes('src="app.js"')) {
  throw new Error("Standalone build failed to inline its assets.");
}

fs.writeFileSync(new URL("./ac-circuit-practice-v0.12.html", import.meta.url), standalone);
console.log("Built ac-circuit-practice-v0.12.html");
