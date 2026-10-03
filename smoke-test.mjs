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
if (generatorNames.length !== 39) throw new Error(`Expected 39 generators, found ${generatorNames.length}`);
if (source.includes("parallelResistorPower")) throw new Error("A trivial resistor-directly-across-source power template remains");
const advancedVariants = new Map();
const unknownVariants = new Map();
const loadedVariants = new Set();
const filterDesignVariants = new Map();
const gainFrequencyVariants = new Set();
const complexFormVariants = new Map();
const qualitativeVariants = new Map();
for (const name of generatorNames) {
  for (let i = 0; i < 100; i += 1) {
    const result = vm.runInContext(`generators.${name}()`, context);
    if (![result.result.re, result.result.im].every(Number.isFinite)) throw new Error(`${name}: non-finite result`);
    if (!result.answer || !result.steps.length || !result.given.length) throw new Error(`${name}: incomplete problem`);
    if (!Array.isArray(result.hints) || result.hints.length !== 2 || result.hints.some((hint) => !hint)) throw new Error(`${name}: expected two progressive hints`);
    if (/combine the two reactive branches|parallel-impedance formula|impedance voltage divider|series-resonance relationships/i.test(result.detail)) {
      throw new Error(`${name}: strategy text remains visible below the problem title`);
    }
    if (result.group === "waveforms" && result.image !== null) throw new Error(`${name}: phasor/waveform problems must not use a generic diagram`);
    if (result.group !== "waveforms" && !result.image) throw new Error(`${name}: circuit diagram is missing`);
    const visibleText = [result.prompt, result.detail, result.answer, ...result.steps, ...result.given.flat()].join(" ");
    if (/[A-Za-z]_[A-Za-z]/.test(visibleText)) throw new Error(`${name}: visible underscore notation remains`);
    if (result.angleGuard !== false && result.group !== "power" && result.group !== "unknown" && name !== "cutoffFrequency" && name !== "rlcFilterMetrics") {
      const angle = Math.abs(Math.atan2(result.result.im, result.result.re) * 180 / Math.PI);
      if (angle < 10 || angle > 80) throw new Error(`${name}: angle ${angle.toFixed(2)}° is outside the intended practice range`);
    }
    if (result.group === "filters" && (/low-pass|high-pass/i.test(result.tag) || !/(what type of filter|identify the filter type)/i.test(result.prompt))) {
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
      } else if (operation === "multiply") {
        nearly(result.result.re, a.re * b.re - a.im * b.im);
        nearly(result.result.im, a.re * b.im + a.im * b.re);
      } else if (operation === "divide") {
        const denominator = b.re * b.re + b.im * b.im;
        nearly(result.result.re, (a.re * b.re + a.im * b.im) / denominator);
        nearly(result.result.im, (a.im * b.re - a.re * b.im) / denominator);
      } else {
        throw new Error(`${name}: unknown operation check ${operation}`);
      }
    }
    if (["phasorMultiplication", "phasorDivision"].includes(name)) {
      if (!Array.isArray(result.inputForms) || result.inputForms.length !== 2) throw new Error(`${name}: missing input-form metadata`);
      if (result.inputForms.filter((form) => form === "polar").length > 1) throw new Error(`${name}: both operands were shown in polar form`);
      const hintText = result.hints.join(" ");
      if (!/both operands in polar form/i.test(hintText)) throw new Error(`${name}: hints do not direct students to polar form`);
      if (name === "phasorMultiplication" && !/multiply the magnitudes and add the angles/i.test(hintText)) throw new Error(`${name}: polar multiplication rule is missing`);
      if (name === "phasorDivision" && !/divide the magnitudes and subtract the denominator angle/i.test(hintText)) throw new Error(`${name}: polar division rule is missing`);
      if (/conjugate/i.test([...result.hints, ...result.steps].join(" "))) throw new Error(`${name}: conjugate method remains in the teaching path`);
      if (result.answer.indexOf("∠") > result.answer.indexOf("j")) throw new Error(`${name}: polar answer should be shown before rectangular form`);
      if (!complexFormVariants.has(name)) complexFormVariants.set(name, new Set());
      complexFormVariants.get(name).add(result.inputForms.join(":"));
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
    if (result.qualitativeCheck) {
      const check = result.qualitativeCheck;
      if (!qualitativeVariants.has(name)) qualitativeVariants.set(name, new Set());
      qualitativeVariants.get(name).add(check.filterType);
      if (check.kind === "limits") {
        const expected = check.filterType === "low-pass"
          ? ["decreases", "source", "zero"]
          : ["increases", "zero", "source"];
        if ([check.trend, check.lowOutput, check.highOutput].join(":") !== expected.join(":")) throw new Error(`${name}: incorrect limiting behavior`);
      }
      if (check.kind === "phase") {
        const expected = check.filterType === "low-pass" ? "lags" : "leads";
        if (check.relation !== expected) throw new Error(`${name}: incorrect phase relationship`);
      }
      if (check.kind === "curve") {
        const expected = check.filterType === "low-pass" ? "A" : "B";
        if (check.choice !== expected) throw new Error(`${name}: incorrect response-curve choice`);
        if (!result.supplement || (result.supplement.match(/class="curve-option"/g) || []).length !== 4) throw new Error(`${name}: four response sketches were not supplied`);
      }
      if (check.kind === "rlc") {
        const expected = check.filterType === "band-pass" ? "greatest" : "smallest";
        if (check.resonanceBehavior !== expected) throw new Error(`${name}: incorrect resonance behavior`);
      }
      if (/f\s*(?:≪|<<|=|≫|>>).*f<sub>c<\/sub>/i.test(result.prompt)) throw new Error(`${name}: excluded normalized-frequency question was added`);
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
for (const name of ["phasorMultiplication", "phasorDivision"]) {
  const variants = complexFormVariants.get(name) || new Set();
  for (const expected of ["rectangular:rectangular", "polar:rectangular", "rectangular:polar"]) {
    if (!variants.has(expected)) throw new Error(`${name}: did not generate ${expected} inputs`);
  }
}
for (const [name, expected] of [
  ["qualitativeFilterLimits", ["low-pass", "high-pass"]],
  ["qualitativeFilterPhase", ["low-pass", "high-pass"]],
  ["qualitativeFilterCurve", ["low-pass", "high-pass"]],
  ["qualitativeRLCBehavior", ["band-pass", "band-stop"]]
]) {
  const variants = qualitativeVariants.get(name) || new Set();
  if (!expected.every((variant) => variants.has(variant))) throw new Error(`${name}: did not generate all qualitative variants`);
}

const subtypeSummary = JSON.parse(vm.runInContext("JSON.stringify(Object.fromEntries(Object.entries(subtypeSets).map(([group, options]) => [group, options.map(({value, generators}) => ({value, generators}))])))", context));
if (subtypeSummary.mixed.length !== 1 || subtypeSummary.mixed[0].value !== "all") throw new Error("Mixed practice should expose only the all-types subtype");
for (const category of ["impedance", "advanced", "phasors", "unknown", "power", "filters", "resonance", "waveforms"]) {
  if (!subtypeSummary[category] || subtypeSummary[category][0].value !== "all" || subtypeSummary[category].length < 2) throw new Error(`${category}: subtype choices are incomplete`);
}
const qualitativeSubtype = subtypeSummary.filters.find((option) => option.value === "qualitative");
if (!qualitativeSubtype || qualitativeSubtype.generators.length !== 4) throw new Error("Filters: qualitative subtype is incomplete");

vm.runInContext('state.set = "filters"; populateProblemTypes(); state.subtype = "qualitative"; state.lastType = null; newProblem()', context);
const selectedQualitativeType = vm.runInContext("state.problem.type", context);
if (!qualitativeSubtype.generators.includes(selectedQualitativeType)) throw new Error("Qualitative subtype generated a problem outside its selection");
vm.runInContext("showHint()", context);
if (element("#hint-panel").hidden || !/Hint 1 of 2/.test(element("#hint-heading").textContent)) throw new Error("First progressive hint did not render");
const firstHintMarkup = element("#hint-text").innerHTML;
vm.runInContext("showHint()", context);
if (!element("#hint-text").innerHTML.includes(firstHintMarkup) || !/Hints 1–2 of 2/.test(element("#hint-heading").textContent)) throw new Error("Second hint did not preserve the first hint");
vm.runInContext("revealAnswer()", context);
if (element("#answer-panel").hidden || !element("#hint-button").hidden) throw new Error("Answer reveal did not complete the progressive-hint flow");

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
for (const id of ["problem-set", "problem-type", "problem-supplement", "circuit", "given-values", "hint-panel", "hint-button", "answer-panel", "reveal-button", "new-button"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing UI element: ${id}`);
}
for (const removedText of ["Impedance Lab", "Included in", "Designed for practice", ">RC filters<"]) {
  if (html.includes(removedText)) throw new Error(`Removed interface text is still present: ${removedText}`);
}
if (!html.includes("AC circuit practice problem generator")) throw new Error("Page title is missing");
for (const category of ["advanced", "unknown", "power", "resonance", "waveforms"]) {
  if (!html.includes(`value="${category}"`)) throw new Error(`Missing problem category: ${category}`);
}
if (!html.includes('<p class="version-label">v0.16</p>')) throw new Error("Visible v0.16 footer label is missing");
if (!html.includes('<link rel="canonical" href="https://wgannett.github.io/ac-practice-problems/">')) throw new Error("Production canonical URL is missing");
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

const centeredAssetSnippets = new Map([
  ["rc-lowpass", ["M410 95v52M375 147h70M375 173h70M410 173v52"]],
  ["rc-highpass", ["M410 95v25l-18 10 36 20-36 20 36 20-18 10v25"]],
  ["lr-output-r", ["M410 95v25l-18 10 36 20-36 20 36 20-18 10v25"]],
  ["lr-output-l", ["M410 95v25c20 0 20 20 0 20c20 0 20 20 0 20c20 0 20 20 0 20c20 0 20 20 0 20v25"]],
  ["rlc-output-r", ["M410 95v25l-18 10 36 20-36 20 36 20-18 10v25"]],
  ["loaded-rc-divider", ["M350 110l-13 8 26 16-26 16 26 16-26 16 13 8v50", "M453 137h44M453 163h44"]],
  ["loaded-rl-divider", ["M350 110l-13 8 26 16-26 16 26 16-26 16 13 8v50", "M475 100c20 0 20 25 0 25c20 0 20 25 0 25c20 0 20 25 0 25c20 0 20 25 0 25"]],
  ["parallel-rc", ["M315 60v50", "M470 60v77M470 163v77", "M448 137h44M448 163h44"]],
  ["parallel-rl", ["M315 60v50", "M470 60v54M470 186v54", "M470 114c18 0 18 18 0 18c18 0 18 18 0 18c18 0 18 18 0 18c18 0 18 18 0 18"]],
  ["series-r-parallel-rc", ["M350 110l-13 8 26 16-26 16 26 16-26 16 13 8v50", "M453 137h44M453 163h44"]]
]);
for (const [name, snippets] of centeredAssetSnippets) {
  const svg = fs.readFileSync(new URL(`./assets/${name}.svg`, import.meta.url), "utf8");
  for (const snippet of snippets) if (!svg.includes(snippet)) throw new Error(`${name}: expected centered component geometry is missing`);
}

for (const expected of [
  'hostname: "wgannett.github.io"',
  'pathPrefix: "/ac-practice-problems/"',
  'endpoint: "https://wgannett.goatcounter.com/count"',
  'no_session: true',
  'trackUsage("problem-generated", state.set, type)',
  'trackUsage("answer-revealed", state.set, state.problem.type)',
  'trackUsage("category-selected", state.set)',
  'trackUsage("problem-type-selected", state.set, state.subtype)',
  'trackUsage("hint-revealed", state.set'
]) {
  if (!source.includes(expected)) throw new Error(`Analytics configuration is missing: ${expected}`);
}

const standalone = fs.readFileSync(new URL("./ac-circuit-practice-v0.16.html", import.meta.url), "utf8");
if (!standalone.includes("<style>") || !standalone.includes("window.CIRCUIT_ASSETS")) throw new Error("Standalone assets are not embedded");
if (standalone.includes('href="styles.css"') || standalone.includes('src="app.js"')) throw new Error("Standalone file still references external assets");
for (const name of assetNames) {
  if (!standalone.includes(`\"${name}\":\"data:image/svg+xml;base64,`)) throw new Error(`${name}: not embedded`);
}

console.log("Smoke test passed: 3,900 randomized problems, 39 generators, two-level hints, category subtypes, qualitative filter checks, mixed-form complex arithmetic, production-only usage tracking, 22 standardized AC sources, and 28 circuit assets.");
