import fs from "node:fs";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.textContent = "";
    this.innerHTML = "";
    this.hidden = false;
    this.open = false;
  }
  addEventListener() {}
  matches() { return false; }
}

const elements = new Map();
const element = (key) => {
  if (!elements.has(key)) elements.set(key, new FakeElement());
  return elements.get(key);
};
const document = { querySelector: element, addEventListener() {} };
const context = vm.createContext({ console, document, Math });
const source = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
if (/H\s*\(\s*j|admittance|\bY\s*=|\bY\s*\(/i.test(source)) {
  throw new Error("A transfer-function or admittance method remains in app.js");
}
vm.runInContext(source, context);

function nearly(actual, expected, tolerance = 1e-6) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${expected}, received ${actual}`);
}

function nearlyRelative(actual, expected, tolerance = 1e-10) {
  const scale = Math.max(Math.abs(expected), 1e-30);
  if (Math.abs(actual - expected) / scale > tolerance) throw new Error(`Expected ${expected}, received ${actual}`);
}

// Independent fixed reference checks for the complex-number operations used by templates.
const division = vm.runInContext("divide({re: 10, im: 0}, {re: 100, im: -100})", context);
nearly(division.re, .05); nearly(division.im, .05);
const product = vm.runInContext("multiply({re: .05, im: .05}, {re: 0, im: -100})", context);
nearly(product.re, 5); nearly(product.im, -5);

const generatorNames = vm.runInContext("Object.keys(generators)", context);
if (generatorNames.length !== 34) throw new Error(`Expected 34 generators, found ${generatorNames.length}`);
if (source.includes("parallelResistorPower")) throw new Error("A trivial resistor-directly-across-source power template remains");
const advancedVariants = new Map();
const unknownVariants = new Map();
const loadedVariants = new Set();
const filterDesignVariants = new Map();
const gainFrequencyVariants = new Set();
for (const name of generatorNames) {
  for (let i = 0; i < 100; i += 1) {
    const result = vm.runInContext(`generators.${name}()`, context);
    if (![result.result.re, result.result.im].every(Number.isFinite)) throw new Error(`${name}: non-finite result`);
    if (!result.answer || !result.steps.length || !result.given.length) throw new Error(`${name}: incomplete problem`);
    if (result.group === "waveforms" && result.image !== null) throw new Error(`${name}: phasor/waveform problems must not use a generic diagram`);
    if (result.group !== "waveforms" && !result.image) throw new Error(`${name}: circuit diagram is missing`);
    const visibleText = [result.prompt, result.detail, result.answer, ...result.steps, ...result.given.flat()].join(" ");
    if (/[A-Za-z]_[A-Za-z]/.test(visibleText)) throw new Error(`${name}: visible underscore notation remains`);
    if (result.angleGuard !== false && result.group !== "power" && result.group !== "unknown" && name !== "cutoffFrequency" && name !== "rlcFilterMetrics") {
      const angle = Math.abs(Math.atan2(result.result.im, result.result.re) * 180 / Math.PI);
      if (angle < 10 || angle > 80) throw new Error(`${name}: angle ${angle.toFixed(2)}° is outside the intended practice range`);
    }
    if (result.group === "filters" && (/low-pass|high-pass/i.test(result.tag) || !/what type of filter/i.test(result.prompt))) {
      throw new Error(`${name}: filter type is disclosed before the answer`);
    }
    if (name === "rlcFilterMetrics") {
      const quality = result.result.re / result.result.im;
      if (quality < .2 || quality > 5) throw new Error(`${name}: Q=${quality.toFixed(3)} violates the factor-of-five constraint`);
    }
    if (result.group === "advanced") {
      if (result.given.length !== 4 || result.given[1][0] !== "R" || result.resistorCount !== 1) {
        throw new Error(`${name}: multi-component circuit must contain exactly one resistor and two reactive components`);
      }
      if (!result.reactanceRatios.every((ratio) => ratio >= .2 && ratio <= 5)) {
        throw new Error(`${name}: a component reactance is outside the factor-of-five constraint`);
      }
      if (!advancedVariants.has(name)) advancedVariants.set(name, new Set());
      advancedVariants.get(name).add(result.reactivePair);
    }
    if (result.group === "power") {
      if (result.result.re <= 0 || result.result.im !== 0) throw new Error(`${name}: invalid real-power result`);
      if (result.resistorDirectlyAcrossSource !== false) throw new Error(`${name}: resistor may be directly across the source`);
    }
    if (result.group === "unknown") {
      if (Math.abs(result.targetAngle) < 10 || Math.abs(result.targetAngle) > 80) throw new Error(`${name}: target angle is outside the intended range`);
      nearly(result.verificationAngle, result.targetAngle, 1e-10);
      if (result.result.re <= 0 || result.result.im !== 0) throw new Error(`${name}: invalid solved value`);
      if (!unknownVariants.has(name)) unknownVariants.set(name, new Set());
      unknownVariants.get(name).add(result.circuitFamily);
    }
    if (name === "seriesComponentVoltages") {
      nearly(result.voltageCheck.sum.re, result.voltageCheck.source.re);
      nearly(result.voltageCheck.sum.im, result.voltageCheck.source.im);
      if (!result.reactanceRatios.every((ratio) => ratio >= .2 && ratio <= 5)) {
        throw new Error(`${name}: a component reactance is outside the factor-of-five constraint`);
      }
    }
    if (name === "loadedVoltageDivider") {
      const expected = {
        re: result.dividerCheck.sourceMagnitude * result.dividerCheck.ratio.re,
        im: result.dividerCheck.sourceMagnitude * result.dividerCheck.ratio.im
      };
      nearly(result.result.re, expected.re);
      nearly(result.result.im, expected.im);
      loadedVariants.add(result.circuitFamily);
    }
    if (name === "requiredSourceVoltage") {
      nearly(Math.hypot(result.result.re, result.result.im), result.targetMagnitude);
      const sourceVoltageText = [result.prompt, result.detail, result.answer, ...result.steps].join(" ");
      if (/angle|reference|∠|°/i.test(sourceVoltageText)) throw new Error(`${name}: magnitude-only problem still mentions phase`);
    }
    if (result.designCheck) nearlyRelative(result.designCheck.actual, result.designCheck.target);
    if (["filterComponentDesign", "resonantComponentDesign", "rlcMetricDesign"].includes(name)) {
      if (!filterDesignVariants.has(name)) filterDesignVariants.set(name, new Set());
      filterDesignVariants.get(name).add(result.designMode || result.circuitFamily);
    }
    if (name === "filterFrequencyComparison") {
      if (result.frequencyRows.length !== 3) throw new Error(`${name}: expected three frequency rows`);
      nearly(result.frequencyRows[1].magnitude, Math.SQRT1_2);
      nearly(result.frequencyRows[1].db, 20 * Math.log10(Math.SQRT1_2));
      for (const row of result.frequencyRows) nearly(row.db, 20 * Math.log10(row.magnitude));
    }
    if (result.gainCheck) nearly(result.gainCheck.db, 20 * Math.log10(result.gainCheck.ratioMagnitude));
    if (name === "filterGainFrequency") gainFrequencyVariants.add(result.circuitFamily);
    if (result.operationCheck) {
      const { a, b, operation } = result.operationCheck;
      if (operation === "add") {
        nearly(result.result.re, a.re + b.re);
        nearly(result.result.im, a.im + b.im);
      } else {
        const denominator = b.re * b.re + b.im * b.im;
        nearly(result.result.re, (a.re * b.re + a.im * b.im) / denominator);
        nearly(result.result.im, (a.im * b.re - a.re * b.im) / denominator);
      }
    }
    if (result.waveformCheck) {
      nearly(result.waveformCheck.peak, Math.SQRT2 * result.waveformCheck.rms);
      nearly(Math.hypot(result.result.re, result.result.im), result.waveformCheck.rms);
      nearly(Math.atan2(result.result.im, result.result.re) * 180 / Math.PI, result.waveformCheck.angle);
    }
    if (name === "resonanceCurrentVoltages") {
      nearly(result.resonanceCheck.reactiveSum.re, 0);
      nearly(result.resonanceCheck.reactiveSum.im, 0);
      nearly(result.resonanceCheck.resistorVoltageMagnitude, result.resonanceCheck.sourceMagnitude);
    }
  }
}
for (const [name, variants] of advancedVariants) {
  if (!["lc", "ll", "cc"].every((variant) => variants.has(variant))) {
    throw new Error(`${name}: did not generate LC, LL, and CC variants`);
  }
}
for (const [name, variants] of unknownVariants) {
  if (!["RC", "RL"].every((variant) => variants.has(variant))) throw new Error(`${name}: did not generate both RC and RL variants`);
}
if (!["RC", "RL"].every((variant) => loadedVariants.has(variant))) throw new Error("loadedVoltageDivider: did not generate both RC and RL variants");
if (!["RC", "LR"].every((variant) => gainFrequencyVariants.has(variant))) throw new Error("filterGainFrequency: did not generate both RC and LR variants");
for (const [name, expected] of [["filterComponentDesign", ["RC", "LR"]], ["resonantComponentDesign", ["C", "L"]], ["rlcMetricDesign", ["Q", "bandwidth"]]]) {
  const variants = filterDesignVariants.get(name) || new Set();
  if (!expected.every((variant) => variants.has(variant))) throw new Error(`${name}: did not generate all design variants`);
}

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
for (const id of ["problem-set", "circuit", "given-values", "answer-panel", "reveal-button", "new-button"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing UI element: ${id}`);
}
for (const removedText of ["Impedance Lab", "Included in", "Designed for practice", ">RC filters<"]) {
  if (html.includes(removedText)) throw new Error(`Removed interface text is still present: ${removedText}`);
}
if (!html.includes("AC circuit practice problem generator")) throw new Error("Page title is missing");
for (const category of ["advanced", "unknown", "power", "resonance", "waveforms"]) {
  if (!html.includes(`value="${category}"`)) throw new Error(`Missing problem category: ${category}`);
}
if (!html.includes('<p class="version-label">v0.14</p>')) throw new Error("Visible v0.14 footer label is missing");
if (/Work the problem on paper|answer-placeholder|class="pencil"/.test(html)) throw new Error("Removed pre-answer prompt is still present");

const assetNames = ["series-rc", "series-rc-vc", "series-rl", "series-rlc", "series-rlc-voltages", "parallel-rc", "parallel-rl", "loaded-rc-divider", "loaded-rl-divider", "series-r-lc", "series-r-ll", "series-r-cc", "parallel-r-lc", "parallel-r-ll", "parallel-r-cc", "series-r-parallel-lc", "series-r-parallel-ll", "series-r-parallel-cc", "parallel-r-series-lc", "parallel-r-series-ll", "parallel-r-series-cc", "series-r-parallel-rc", "rc-lowpass", "rc-highpass", "lr-output-r", "lr-output-l", "rlc-output-r", "rlc-output-lc"];
for (const name of assetNames) {
  const svg = fs.readFileSync(new URL(`./assets/${name}.svg`, import.meta.url), "utf8");
  if (!svg.includes("<title") || !svg.includes("<desc")) throw new Error(`${name}: missing accessible description`);
  if (/[₀₁₂₃₄₅₆₇₈₉ₛᵢₒᵤ]/u.test(svg)) throw new Error(`${name}: font-dependent Unicode subscript remains`);
}

const sourceAssetNames = ["series-rc", "series-rc-vc", "series-rl", "series-rlc", "series-rlc-voltages", "parallel-rc", "parallel-rl", "loaded-rc-divider", "loaded-rl-divider", "series-r-lc", "series-r-ll", "series-r-cc", "parallel-r-lc", "parallel-r-ll", "parallel-r-cc", "series-r-parallel-lc", "series-r-parallel-ll", "series-r-parallel-cc", "parallel-r-series-lc", "parallel-r-series-ll", "parallel-r-series-cc", "series-r-parallel-rc"];
for (const name of sourceAssetNames) {
  const svg = fs.readFileSync(new URL(`./assets/${name}.svg`, import.meta.url), "utf8");
  if (!/V<tspan baseline-shift="sub" font-size="15">s<\/tspan>/.test(svg)) throw new Error(`${name}: source label is not built from an SVG tspan`);
  if (!/<circle[^>]+r="3[235]"\/>\s*<path d="M ?\d+ 150 ?c/.test(svg)) throw new Error(`${name}: source does not use a drawn sinusoid`);
}

const standalone = fs.readFileSync(new URL("./ac-circuit-practice-v0.14.html", import.meta.url), "utf8");
if (!standalone.includes("<style>") || !standalone.includes("window.CIRCUIT_ASSETS")) throw new Error("Standalone assets are not embedded");
if (standalone.includes('href="styles.css"') || standalone.includes('src="app.js"')) throw new Error("Standalone file still references external assets");
for (const name of assetNames) {
  if (!standalone.includes(`\"${name}\":\"data:image/svg+xml;base64,`)) throw new Error(`${name}: not embedded`);
}

console.log("Smoke test passed: 3,400 randomized problems, 34 generators, magnitude-only source-voltage checks, 22 standardized AC sources, and 28 circuit assets.");
