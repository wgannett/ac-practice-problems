"use strict";

const TWO_PI = 2 * Math.PI;
const values = {
  frequency: [100, 200, 500, 1000, 2000, 5000, 10000],
  voltage: [1, 2, 5, 10, 12],
  resistance: [100, 150, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000],
  capacitance: [10e-9, 22e-9, 47e-9, 100e-9, 220e-9, 470e-9, 1e-6, 2.2e-6, 4.7e-6, 10e-6],
  inductance: [1e-3, 2.2e-3, 4.7e-3, 10e-3, 22e-3, 47e-3, 100e-3, 220e-3, 470e-3, 1]
};

const circuitNames = [
  "series-rc", "series-rc-vc", "series-rl", "series-rlc", "series-rlc-voltages", "parallel-rc", "parallel-rl",
  "loaded-rc-divider", "loaded-rl-divider",
  "series-r-lc", "series-r-ll", "series-r-cc",
  "parallel-r-lc", "parallel-r-ll", "parallel-r-cc",
  "series-r-parallel-lc", "series-r-parallel-ll", "series-r-parallel-cc",
  "parallel-r-series-lc", "parallel-r-series-ll", "parallel-r-series-cc",
  "series-r-parallel-rc", "rc-lowpass", "rc-highpass", "lr-output-r", "lr-output-l", "rlc-output-r", "rlc-output-lc"
];
const embeddedAssets = typeof window !== "undefined" ? window.CIRCUIT_ASSETS : null;
const CIRCUIT_ASSETS = embeddedAssets || Object.fromEntries(circuitNames.map((name) => [name, `assets/${name}.svg`]));

const state = { count: 0, set: "mixed", problem: null, lastType: null };
const $ = (selector) => document.querySelector(selector);
const pick = (array) => array[Math.floor(Math.random() * array.length)];
const BALANCE_MIN = .2;
const BALANCE_MAX = 5;
const TARGET_ANGLES = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
const PHASOR_ANGLES = [-75, -65, -55, -45, -35, -25, -15, 15, 25, 35, 45, 55, 65, 75];
const PHASOR_MAGNITUDES = [5, 10, 12, 15, 20, 25, 30, 40, 50];
const RECTANGULAR_COMPONENTS = [-40, -30, -25, -20, -15, -12, -10, -5, 5, 10, 12, 15, 20, 25, 30, 40];
const COMPLEX_INPUT_FORMS = [["rectangular", "rectangular"], ["polar", "rectangular"], ["rectangular", "polar"]];
const ANALYTICS = Object.freeze({
  hostname: "wgannett.github.io",
  pathPrefix: "/ac-practice-problems/",
  endpoint: "https://wgannett.goatcounter.com/count"
});
const S = Object.freeze({
  ZC: "Z<sub>C</sub>", ZC1: "Z<sub>C1</sub>", ZC2: "Z<sub>C2</sub>",
  ZL: "Z<sub>L</sub>", ZL1: "Z<sub>L1</sub>", ZL2: "Z<sub>L2</sub>",
  Za: "Z<sub>a</sub>", Zp: "Z<sub>p</sub>", Zb: "Z<sub>b</sub>",
  VC: "V<sub>C</sub>", VL: "V<sub>L</sub>", Vs: "V<sub>s</sub>", Vin: "V<sub>in</sub>", Vout: "V<sub>out</sub>", Vp: "V<sub>p</sub>", VR: "V<sub>R</sub>",
  Is: "I<sub>s</sub>", IR: "I<sub>R</sub>", IC: "I<sub>C</sub>",
  R1: "R<sub>1</sub>", R2: "R<sub>2</sub>", Rp: "R<sub>p</sub>",
  L1: "L<sub>1</sub>", L2: "L<sub>2</sub>", C1: "C<sub>1</sub>", C2: "C<sub>2</sub>",
  PR: "P<sub>R</sub>", PR1: "P<sub>R1</sub>", PR2: "P<sub>R2</sub>",
  fc: "f<sub>c</sub>", f0: "f<sub>0</sub>"
});

function pickDifferent(array, previous) {
  const choices = array.filter((item) => item !== previous);
  return pick(choices.length ? choices : array);
}

function isBalanced(ratio) { return ratio >= BALANCE_MIN && ratio <= BALANCE_MAX; }

function balancedRC() {
  const candidates = [];
  for (const f of values.frequency) {
    for (const R of values.resistance) {
      for (const C of values.capacitance) {
        const Xc = 1 / (TWO_PI * f * C);
        if (isBalanced(Xc / R)) candidates.push({ f, R, C, Xc });
      }
    }
  }
  return pick(candidates);
}

function balancedRL() {
  const candidates = [];
  for (const f of values.frequency) {
    for (const R of values.resistance) {
      for (const L of values.inductance) {
        const Xl = TWO_PI * f * L;
        if (isBalanced(Xl / R)) candidates.push({ f, R, L, Xl });
      }
    }
  }
  return pick(candidates);
}

function balancedRLC() {
  const candidates = [];
  for (const f of values.frequency) {
    for (const R of values.resistance) {
      for (const L of values.inductance) {
        const Xl = TWO_PI * f * L;
        for (const C of values.capacitance) {
          const Xc = 1 / (TWO_PI * f * C);
          if (isBalanced(Math.abs(Xl - Xc) / R)) candidates.push({ f, R, L, C, Xl, Xc });
        }
      }
    }
  }
  return pick(candidates);
}

function balancedSeriesRLCVoltages() {
  const candidates = [];
  for (const f of values.frequency) {
    for (const R of values.resistance) {
      for (const L of values.inductance) {
        const Xl = TWO_PI * f * L;
        if (!isBalanced(Xl / R)) continue;
        for (const C of values.capacitance) {
          const Xc = 1 / (TWO_PI * f * C);
          if (isBalanced(Xc / R) && isBalanced(Math.abs(Xl - Xc) / R)) candidates.push({ f, R, L, C, Xl, Xc });
        }
      }
    }
  }
  return pick(candidates);
}

function balancedResonantRLC() {
  const candidates = [];
  for (const R of values.resistance) {
    for (const L of values.inductance) {
      for (const C of values.capacitance) {
        const X0 = Math.sqrt(L / C);
        if (isBalanced(X0 / R)) candidates.push({ R, L, C, X0, f0: 1 / (TWO_PI * Math.sqrt(L * C)) });
      }
    }
  }
  return pick(candidates);
}

function sig(value, digits = 3) {
  if (Math.abs(value) < 1e-12) return "0";
  return Number(value.toPrecision(digits)).toString();
}

function engineering(value, unit) {
  const abs = Math.abs(value);
  if (abs < 1e-12) return `0 ${unit}`;
  const scales = [
    { n: 1e6, p: "M" }, { n: 1e3, p: "k" }, { n: 1, p: "" },
    { n: 1e-3, p: "m" }, { n: 1e-6, p: "µ" }, { n: 1e-9, p: "n" }
  ];
  const scale = scales.find((item) => abs >= item.n * .999) || scales.at(-1);
  return `${sig(value / scale.n)} ${scale.p}${unit}`;
}

function degrees(radians) { return radians * 180 / Math.PI; }

function polar(complex) {
  return { magnitude: Math.hypot(complex.re, complex.im), angle: degrees(Math.atan2(complex.im, complex.re)) };
}

function add(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }

function divide(a, b) {
  const denominator = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / denominator, im: (a.im * b.re - a.re * b.im) / denominator };
}

function multiply(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function parallelZ(a, b) { return divide(multiply(a, b), add(a, b)); }

function balancedComplex(factory) {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const candidate = factory();
    const angle = Math.abs(polar(candidate.z).angle);
    if (candidate.valid !== false && [candidate.z.re, candidate.z.im, angle].every(Number.isFinite) && angle >= 10 && angle <= 80) return candidate;
  }
  throw new Error("Could not generate a balanced multi-component circuit.");
}

function validCandidate(factory, message) {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const candidate = factory();
    if (candidate) return candidate;
  }
  throw new Error(message);
}

function complexLines(symbol, complex, unit) {
  const p = polar(complex);
  const sign = complex.im < 0 ? "−" : "+";
  return `<div>${symbol} = ${engineering(complex.re, unit)} ${sign} j${engineering(Math.abs(complex.im), unit)}</div>
    <div>${symbol} = ${engineering(p.magnitude, unit)} ∠ ${sig(p.angle)}°</div>`;
}

function rectangular(complex, unit) {
  const sign = complex.im < 0 ? "−" : "+";
  return `${engineering(complex.re, unit)} ${sign} j${engineering(Math.abs(complex.im), unit)}`;
}

function polarLine(symbol, complex, unit) {
  const p = polar(complex);
  return `<div>${symbol} = ${engineering(p.magnitude, unit)} ∠ ${sig(p.angle)}°</div>`;
}

function fromPolar(magnitude, angle) {
  const radians = angle * Math.PI / 180;
  return { re: magnitude * Math.cos(radians), im: magnitude * Math.sin(radians) };
}

function phasorText(magnitude, angle, unit = "") {
  return `${sig(magnitude)} ∠ ${sig(angle)}°${unit ? ` ${unit}` : ""}`;
}

function signedAngle(angle) {
  return angle < 0 ? `− ${sig(Math.abs(angle))}°` : `+ ${sig(angle)}°`;
}

function complexText(complex) {
  const sign = complex.im < 0 ? "−" : "+";
  return `${sig(complex.re)} ${sign} j${sig(Math.abs(complex.im))}`;
}

function randomRectangularComplex() {
  return { re: pick(RECTANGULAR_COMPONENTS), im: pick(RECTANGULAR_COMPONENTS) };
}

function complexInputText(value, form) {
  const p = polar(value);
  return form === "polar" ? phasorText(p.magnitude, p.angle) : complexText(value);
}

function conversionSteps(a, b, forms) {
  const steps = [];
  if (forms[0] === "polar") steps.push(`Convert A to rectangular form: A = ${complexText(a)}.`);
  if (forms[1] === "polar") steps.push(`Convert B to rectangular form: B = ${complexText(b)}.`);
  return steps;
}

function decibels(ratioMagnitude) { return 20 * Math.log10(ratioMagnitude); }

function rcFilterRatio(R, C, f, outputAcrossC) {
  const zc = { re: 0, im: -1 / (TWO_PI * f * C) };
  return divide(outputAcrossC ? zc : { re: R, im: 0 }, add({ re: R, im: 0 }, zc));
}

function lrFilterRatio(R, L, f, outputAcrossR) {
  const zl = { re: 0, im: TWO_PI * f * L };
  return divide(outputAcrossR ? { re: R, im: 0 } : zl, add({ re: R, im: 0 }, zl));
}

function circuitImage(name, alt) {
  return `<img src="${CIRCUIT_ASSETS[name]}" alt="${alt}" width="640" height="300">`;
}

function problem(config) { return config; }

function seriesRCImpedance() {
  const { f, R, C, Xc } = balancedRC(), z = { re: R, im: -Xc }, p = polar(z);
  return problem({ type: "seriesRCImpedance", group: "impedance", tag: "Equivalent impedance", image: "series-rc", imageAlt: "Series resistor-capacitor circuit",
    prompt: "Find the equivalent impedance seen by the source.", detail: "Express Z in rectangular and polar form.",
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")]], answer: complexLines("Z", z, "Ω"),
    steps: [`${S.ZC} = 1/(j2πfC) = −j${engineering(Xc, "Ω")}`, `Z = R + ${S.ZC} = ${engineering(R, "Ω")} − j${engineering(Xc, "Ω")}`, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`], result: z });
}

function seriesRLImpedance() {
  const { f, R, L, Xl } = balancedRL(), z = { re: R, im: Xl }, p = polar(z);
  return problem({ type: "seriesRLImpedance", group: "impedance", tag: "Equivalent impedance", image: "series-rl", imageAlt: "Series resistor-inductor circuit",
    prompt: "Find the equivalent impedance seen by the source.", detail: "Express Z in rectangular and polar form.",
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")]], answer: complexLines("Z", z, "Ω"),
    steps: [`${S.ZL} = j2πfL = j${engineering(Xl, "Ω")}`, `Z = R + ${S.ZL} = ${engineering(R, "Ω")} + j${engineering(Xl, "Ω")}`, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`], result: z });
}

function seriesRLCImpedance() {
  const { f, R, L, C, Xl, Xc } = balancedRLC(), z = { re: R, im: Xl - Xc }, p = polar(z);
  const sign = z.im < 0 ? "−" : "+";
  return problem({ type: "seriesRLCImpedance", group: "impedance", tag: "Equivalent impedance", image: "series-rlc", imageAlt: "Series resistor-inductor-capacitor circuit",
    prompt: "Find the equivalent impedance seen by the source.", detail: "Decide whether the circuit is net inductive or capacitive.",
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")], ["C", engineering(C, "F")]], answer: complexLines("Z", z, "Ω"),
    steps: [`${S.ZL} = j${engineering(Xl, "Ω")}`, `${S.ZC} = −j${engineering(Xc, "Ω")}`, `Z = R + ${S.ZL} + ${S.ZC} = ${engineering(R, "Ω")} ${sign} j${engineering(Math.abs(z.im), "Ω")}`, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`], result: z });
}

function parallelRCImpedance() {
  const { f, R, C, Xc } = balancedRC(), zc = { re: 0, im: -Xc };
  const z = divide(multiply({ re: R, im: 0 }, zc), { re: R, im: -Xc }), p = polar(z);
  return problem({ type: "parallelRCImpedance", group: "impedance", tag: "Equivalent impedance", image: "parallel-rc", imageAlt: "Parallel resistor-capacitor circuit",
    prompt: "Find the equivalent impedance of the parallel network.", detail: `Use the parallel-impedance formula with R and ${S.ZC}.`,
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")]], answer: complexLines("Z", z, "Ω"),
    steps: [`${S.ZC} = 1/(j2πfC) = −j${engineering(Xc, "Ω")}`, `Z = (R ${S.ZC})/(R + ${S.ZC})`, `Z = ${engineering(z.re, "Ω")} − j${engineering(Math.abs(z.im), "Ω")}`, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`], result: z });
}

function parallelRLImpedance() {
  const { f, R, L, Xl } = balancedRL(), zl = { re: 0, im: Xl };
  const z = divide(multiply({ re: R, im: 0 }, zl), { re: R, im: Xl }), p = polar(z);
  return problem({ type: "parallelRLImpedance", group: "impedance", tag: "Equivalent impedance", image: "parallel-rl", imageAlt: "Parallel resistor-inductor circuit",
    prompt: "Find the equivalent impedance of the parallel network.", detail: `Use the parallel-impedance formula with R and ${S.ZL}.`,
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")]], answer: complexLines("Z", z, "Ω"),
    steps: [`${S.ZL} = j2πfL = j${engineering(Xl, "Ω")}`, `Z = (R ${S.ZL})/(R + ${S.ZL})`, `Z = ${engineering(z.re, "Ω")} + j${engineering(z.im, "Ω")}`, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`], result: z });
}

function reactivePair(f) {
  const suffix = pick(["lc", "ll", "cc"]);
  if (suffix === "lc") {
    const L = pick(values.inductance), C = pick(values.capacitance);
    const Xl = TWO_PI * f * L, Xc = 1 / (TWO_PI * f * C);
    return {
      suffix, names: "L and C", symbols: [S.ZL, S.ZC],
      impedances: [{ re: 0, im: Xl }, { re: 0, im: -Xc }],
      given: [["L", engineering(L, "H")], ["C", engineering(C, "F")]],
      steps: [`${S.ZL} = j${engineering(Xl, "Ω")}`, `${S.ZC} = −j${engineering(Xc, "Ω")}`]
    };
  }
  if (suffix === "ll") {
    const L1 = pick(values.inductance), L2 = pick(values.inductance);
    const Xl1 = TWO_PI * f * L1, Xl2 = TWO_PI * f * L2;
    return {
      suffix, names: "L₁ and L₂", symbols: [S.ZL1, S.ZL2],
      impedances: [{ re: 0, im: Xl1 }, { re: 0, im: Xl2 }],
      given: [[S.L1, engineering(L1, "H")], [S.L2, engineering(L2, "H")]],
      steps: [`${S.ZL1} = j${engineering(Xl1, "Ω")}`, `${S.ZL2} = j${engineering(Xl2, "Ω")}`]
    };
  }
  const C1 = pick(values.capacitance), C2 = pick(values.capacitance);
  const Xc1 = 1 / (TWO_PI * f * C1), Xc2 = 1 / (TWO_PI * f * C2);
  return {
    suffix, names: "C₁ and C₂", symbols: [S.ZC1, S.ZC2],
    impedances: [{ re: 0, im: -Xc1 }, { re: 0, im: -Xc2 }],
    given: [[S.C1, engineering(C1, "F")], [S.C2, engineering(C2, "F")]],
    steps: [`${S.ZC1} = −j${engineering(Xc1, "Ω")}`, `${S.ZC2} = −j${engineering(Xc2, "Ω")}`]
  };
}

function multiComponentImpedance(topology, type) {
  const selected = balancedComplex(() => {
    const f = pick(values.frequency), R = pick(values.resistance), pair = reactivePair(f);
    const [z1, z2] = pair.impedances, resistor = { re: R, im: 0 };
    let branch = null, first = null, z;
    if (topology === "series") z = add(resistor, add(z1, z2));
    if (topology === "parallel") {
      first = parallelZ(resistor, z1);
      z = parallelZ(first, z2);
    }
    if (topology === "series-parallel") {
      branch = parallelZ(z1, z2);
      z = add(resistor, branch);
    }
    if (topology === "parallel-series") {
      branch = add(z1, z2);
      z = parallelZ(resistor, branch);
    }
    const reactancesStayClose = pair.impedances.every((component) => isBalanced(Math.abs(component.im) / R));
    return { f, R, pair, branch, first, z, valid: reactancesStayClose };
  });

  const { f, R, pair, branch, first, z } = selected;
  const [z1Symbol, z2Symbol] = pair.symbols, p = polar(z);
  let image, imageAlt, detail, combinationSteps;
  if (topology === "series") {
    image = `series-r-${pair.suffix}`;
    imageAlt = `One resistor, ${pair.names}, all connected in series`;
    detail = "Combine all three series impedances, then convert the result to polar form.";
    combinationSteps = [`Z = R + ${z1Symbol} + ${z2Symbol}`, `Z = ${rectangular(z, "Ω")}`];
  } else if (topology === "parallel") {
    image = `parallel-r-${pair.suffix}`;
    imageAlt = `One resistor, ${pair.names}, all connected in parallel`;
    detail = "Combine the three branches two at a time using the parallel-impedance formula.";
    combinationSteps = [
      `${S.Za} = (R${z1Symbol})/(R + ${z1Symbol}) = ${rectangular(first, "Ω")}`,
      `Z = (${S.Za}${z2Symbol})/(${S.Za} + ${z2Symbol}) = ${rectangular(z, "Ω")}`
    ];
  } else if (topology === "series-parallel") {
    image = `series-r-parallel-${pair.suffix}`;
    imageAlt = `One resistor in series with ${pair.names} connected in parallel`;
    detail = "Combine the two reactive branches in parallel, then add the resistor in series.";
    combinationSteps = [
      `${S.Zp} = (${z1Symbol}${z2Symbol})/(${z1Symbol} + ${z2Symbol}) = ${rectangular(branch, "Ω")}`,
      `Z = R + ${S.Zp} = ${rectangular(z, "Ω")}`
    ];
  } else {
    image = `parallel-r-series-${pair.suffix}`;
    imageAlt = `One resistor in parallel with a series branch containing ${pair.names}`;
    detail = "Combine the two reactive impedances in series, then combine that branch with the resistor in parallel.";
    combinationSteps = [
      `${S.Zb} = ${z1Symbol} + ${z2Symbol} = ${rectangular(branch, "Ω")}`,
      `Z = (R${S.Zb})/(R + ${S.Zb}) = ${rectangular(z, "Ω")}`
    ];
  }

  return problem({
    type, group: "advanced", tag: "Multi-component impedance", image, imageAlt,
    prompt: "Find the equivalent impedance seen by the source.", detail,
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ...pair.given],
    answer: complexLines("Z", z, "Ω"),
    steps: [...pair.steps, ...combinationSteps, `|Z| = ${engineering(p.magnitude, "Ω")},   θ = ${sig(p.angle)}°`],
    result: z, reactivePair: pair.suffix, resistorCount: 1,
    reactanceRatios: pair.impedances.map((component) => Math.abs(component.im) / R)
  });
}

function seriesThreeImpedance() { return multiComponentImpedance("series", "seriesThreeImpedance"); }
function parallelThreeImpedance() { return multiComponentImpedance("parallel", "parallelThreeImpedance"); }
function seriesParallelImpedance() { return multiComponentImpedance("series-parallel", "seriesParallelImpedance"); }
function parallelSeriesImpedance() { return multiComponentImpedance("parallel-series", "parallelSeriesImpedance"); }

function seriesCurrent() {
  const useRC = Math.random() < .5;
  const Vs = pick(values.voltage);
  let f, R, z, reactiveGiven, reactanceStep, image, imageAlt;
  if (useRC) {
    const selected = balancedRC(), C = selected.C, Xc = selected.Xc;
    f = selected.f; R = selected.R;
    z = { re: R, im: -Xc }; reactiveGiven = ["C", engineering(C, "F")]; reactanceStep = `${S.ZC} = −j${engineering(Xc, "Ω")}`; image = "series-rc"; imageAlt = "Series RC circuit with source current";
  } else {
    const selected = balancedRL(), L = selected.L, Xl = selected.Xl;
    f = selected.f; R = selected.R;
    z = { re: R, im: Xl }; reactiveGiven = ["L", engineering(L, "H")]; reactanceStep = `${S.ZL} = j${engineering(Xl, "Ω")}`; image = "series-rl"; imageAlt = "Series RL circuit with source current";
  }
  const current = divide({ re: Vs, im: 0 }, z), pz = polar(z), pi = polar(current);
  return problem({ type: "seriesCurrent", group: "phasors", tag: "Current phasor", image, imageAlt,
    prompt: "Find the source current phasor I.", detail: "The source voltage is the 0° phase reference. Use RMS values.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], reactiveGiven], answer: complexLines("I", current, "A"),
    steps: [reactanceStep, `Z = ${engineering(pz.magnitude, "Ω")} ∠ ${sig(pz.angle)}°`, `I = ${S.Vs}/Z`, `|I| = ${engineering(pi.magnitude, "A")},   ∠I = 0° − (${sig(pz.angle)}°) = ${sig(pi.angle)}°`], result: current });
}

function capacitorVoltage() {
  const { f, R, C, Xc } = balancedRC(), Vs = pick(values.voltage), z = { re: R, im: -Xc }, zc = { re: 0, im: -Xc };
  const current = divide({ re: Vs, im: 0 }, z), vc = multiply(current, zc), pi = polar(current), pvc = polar(vc);
  return problem({ type: "capacitorVoltage", group: "phasors", tag: "Voltage phasor", image: "series-rc-vc", imageAlt: "Series RC circuit with capacitor voltage marked",
    prompt: `Find the capacitor voltage phasor ${S.VC}.`, detail: "Use the marked polarity and take the source as the 0° reference.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")]], answer: complexLines(S.VC, vc, "V"),
    steps: [`${S.ZC} = −j${engineering(Xc, "Ω")}`, `I = ${S.Vs}/(R + ${S.ZC}) = ${engineering(pi.magnitude, "A")} ∠ ${sig(pi.angle)}°`, `${S.VC} = I ${S.ZC}`, `|${S.VC}| = ${engineering(pvc.magnitude, "V")},   ∠${S.VC} = ${sig(pvc.angle)}°`], result: vc });
}

function seriesComponentVoltages() {
  const { f, R, L, C, Xl, Xc } = balancedSeriesRLCVoltages(), Vs = pick(values.voltage);
  const z = { re: R, im: Xl - Xc }, pz = polar(z);
  const current = divide({ re: Vs, im: 0 }, z);
  const vr = multiply(current, { re: R, im: 0 });
  const vl = multiply(current, { re: 0, im: Xl });
  const vc = multiply(current, { re: 0, im: -Xc });
  const voltageSum = add(add(vr, vl), vc);
  return problem({
    type: "seriesComponentVoltages", group: "phasors", tag: "Component voltage phasors",
    image: "series-rlc-voltages", imageAlt: "Series RLC circuit with the voltage polarity marked across each component",
    prompt: `Find I, ${S.VR}, ${S.VL}, and ${S.VC}.`,
    detail: "Use the marked polarities, RMS phasors, and the source voltage as the 0° reference.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")], ["C", engineering(C, "F")]],
    answer: `${polarLine("I", current, "A")}${polarLine(S.VR, vr, "V")}${polarLine(S.VL, vl, "V")}${polarLine(S.VC, vc, "V")}`,
    steps: [
      `${S.ZL} = j${engineering(Xl, "Ω")},   ${S.ZC} = −j${engineering(Xc, "Ω")}`,
      `Z = R + ${S.ZL} + ${S.ZC} = ${rectangular(z, "Ω")} = ${engineering(pz.magnitude, "Ω")} ∠ ${sig(pz.angle)}°`,
      `I = ${S.Vs}/Z = ${engineering(polar(current).magnitude, "A")} ∠ ${sig(polar(current).angle)}°`,
      `${S.VR} = IR = ${engineering(polar(vr).magnitude, "V")} ∠ ${sig(polar(vr).angle)}°`,
      `${S.VL} = I${S.ZL} = ${engineering(polar(vl).magnitude, "V")} ∠ ${sig(polar(vl).angle)}°`,
      `${S.VC} = I${S.ZC} = ${engineering(polar(vc).magnitude, "V")} ∠ ${sig(polar(vc).angle)}°`,
      `Check: ${S.VR} + ${S.VL} + ${S.VC} = ${S.Vs}`
    ],
    result: current, voltageCheck: { sum: voltageSum, source: { re: Vs, im: 0 } },
    reactanceRatios: [Xl / R, Xc / R]
  });
}

function unknownComponent() {
  const useRC = Math.random() < .5;
  const selected = validCandidate(() => {
    const f = pick(values.frequency), R = pick(values.resistance), angleMagnitude = pick(TARGET_ANGLES);
    const reactance = R * Math.tan(angleMagnitude * Math.PI / 180);
    if (useRC) {
      const component = 1 / (TWO_PI * f * reactance);
      if (component < values.capacitance[0] || component > values.capacitance.at(-1)) return null;
      return { f, R, angle: -angleMagnitude, reactance, component };
    }
    const component = reactance / (TWO_PI * f);
    if (component < values.inductance[0] || component > values.inductance.at(-1)) return null;
    return { f, R, angle: angleMagnitude, reactance, component };
  }, "Could not generate an unknown-component problem.");
  const { f, R, angle, reactance, component } = selected;
  const symbol = useRC ? "C" : "L", unit = useRC ? "F" : "H";
  const impedanceSymbol = useRC ? S.ZC : S.ZL;
  const image = useRC ? "series-rc" : "series-rl";
  const sign = useRC ? "−" : "+";
  const formulaStep = useRC
    ? `C = 1/(2πf${useRC ? "X<sub>C</sub>" : ""}) = ${engineering(component, unit)}`
    : `L = X<sub>L</sub>/(2πf) = ${engineering(component, unit)}`;
  return problem({
    type: "unknownComponent", group: "unknown", tag: "Unknown component",
    image, imageAlt: `Series ${useRC ? "RC" : "RL"} circuit with an unknown ${useRC ? "capacitor" : "inductor"}`,
    prompt: `Find the value of ${symbol} that gives the specified impedance angle.`,
    detail: `Use the angle of Z = R ${sign} jX and the series-circuit impedance relationship.`,
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["∠Z", `${angle}°`]],
    answer: `<div>${symbol} = ${engineering(component, unit)}</div>`,
    steps: [
      `|∠Z| = tan⁻¹(X/R), so X = R tan(|∠Z|).`,
      `|${impedanceSymbol}| = ${engineering(reactance, "Ω")}`,
      formulaStep,
      `Check: Z = ${engineering(R, "Ω")} ${sign} j${engineering(reactance, "Ω")} has ∠Z = ${angle}°.`
    ],
    result: { re: component, im: 0 }, targetAngle: angle, circuitFamily: useRC ? "RC" : "RL",
    verificationAngle: degrees(Math.atan2(useRC ? -reactance : reactance, R))
  });
}

function unknownFrequency() {
  const useRC = Math.random() < .5;
  const selected = validCandidate(() => {
    const R = pick(values.resistance), angleMagnitude = pick(TARGET_ANGLES);
    const reactance = R * Math.tan(angleMagnitude * Math.PI / 180);
    if (useRC) {
      const C = pick(values.capacitance), f = 1 / (TWO_PI * C * reactance);
      if (f < values.frequency[0] || f > values.frequency.at(-1)) return null;
      return { R, C, f, angle: -angleMagnitude, reactance };
    }
    const L = pick(values.inductance), f = reactance / (TWO_PI * L);
    if (f < values.frequency[0] || f > values.frequency.at(-1)) return null;
    return { R, L, f, angle: angleMagnitude, reactance };
  }, "Could not generate an unknown-frequency problem.");
  const { R, C, L, f, angle, reactance } = selected;
  const image = useRC ? "series-rc" : "series-rl";
  const reactiveGiven = useRC ? ["C", engineering(C, "F")] : ["L", engineering(L, "H")];
  const frequencyStep = useRC
    ? `f = 1/(2πC${"X<sub>C</sub>"}) = ${engineering(f, "Hz")}`
    : `f = X<sub>L</sub>/(2πL) = ${engineering(f, "Hz")}`;
  return problem({
    type: "unknownFrequency", group: "unknown", tag: "Unknown frequency",
    image, imageAlt: `Series ${useRC ? "RC" : "RL"} circuit at an unknown frequency`,
    prompt: "Find the frequency that gives the specified impedance angle.",
    detail: `Use the angle of Z = R ${useRC ? "−" : "+"} jX to find the required reactance first.`,
    given: [["R", engineering(R, "Ω")], reactiveGiven, ["∠Z", `${angle}°`]],
    answer: `<div>f = ${engineering(f, "Hz")}</div>`,
    steps: [
      `|∠Z| = tan⁻¹(X/R), so X = R tan(|∠Z|).`,
      `Required reactance: ${engineering(reactance, "Ω")}.`,
      frequencyStep,
      `Check: the resulting impedance angle is ${angle}°.`
    ],
    result: { re: f, im: 0 }, targetAngle: angle, circuitFamily: useRC ? "RC" : "RL",
    verificationAngle: degrees(Math.atan2(useRC ? -reactance : reactance, R))
  });
}

function phasorAddition() {
  const selected = balancedComplex(() => {
    const magnitudeA = pick(PHASOR_MAGNITUDES), angleA = pick(PHASOR_ANGLES);
    const magnitudeB = pick(PHASOR_MAGNITUDES), angleB = pick(PHASOR_ANGLES);
    const a = fromPolar(magnitudeA, angleA), b = fromPolar(magnitudeB, angleB), z = add(a, b);
    const valid = polar(z).magnitude >= .25 * (magnitudeA + magnitudeB);
    return { magnitudeA, angleA, magnitudeB, angleB, a, b, z, valid };
  });
  const { magnitudeA, angleA, magnitudeB, angleB, a, b, z } = selected, p = polar(z);
  const expression = `${phasorText(magnitudeA, angleA)} + ${phasorText(magnitudeB, angleB)}`;
  return problem({
    type: "phasorAddition", group: "waveforms", tag: "Phasor addition",
    image: null, imageAlt: "",
    prompt: `Calculate <span class="math-expression">${expression}</span>.`,
    detail: "Express the result in rectangular and polar form.",
    given: [["A", phasorText(magnitudeA, angleA)], ["B", phasorText(magnitudeB, angleB)]],
    answer: `<div>A + B = ${complexText(z)}</div><div>A + B = ${phasorText(p.magnitude, p.angle)}</div>`,
    steps: [`A = ${complexText(a)}`, `B = ${complexText(b)}`, `A + B = (${sig(a.re)} + ${sig(b.re)}) + j(${sig(a.im)} + ${sig(b.im)})`, `A + B = ${complexText(z)} = ${phasorText(p.magnitude, p.angle)}`],
    result: z, operationCheck: { operation: "add", a, b }
  });
}

function phasorMultiplication() {
  const selected = balancedComplex(() => {
    const a = randomRectangularComplex(), b = randomRectangularComplex(), z = multiply(a, b);
    return { a, b, z };
  });
  const { a, b, z } = selected, p = polar(z), forms = pick(COMPLEX_INPUT_FORMS);
  const aText = complexInputText(a, forms[0]), bText = complexInputText(b, forms[1]);
  return problem({
    type: "phasorMultiplication", group: "waveforms", tag: "Complex multiplication",
    image: null, imageAlt: "",
    prompt: `Calculate <span class="math-expression">(${aText})(${bText})</span>.`,
    detail: "Express the result in rectangular and polar form.",
    given: [["A", aText], ["B", bText]],
    answer: `<div>A × B = ${complexText(z)}</div><div>A × B = ${phasorText(p.magnitude, p.angle)}</div>`,
    steps: [
      ...conversionSteps(a, b, forms),
      `Real part: (${sig(a.re)})(${sig(b.re)}) − (${sig(a.im)})(${sig(b.im)}) = ${sig(z.re)}`,
      `Imaginary part: (${sig(a.re)})(${sig(b.im)}) + (${sig(a.im)})(${sig(b.re)}) = ${sig(z.im)}`,
      `A × B = ${complexText(z)} = ${phasorText(p.magnitude, p.angle)}`
    ],
    result: z, operationCheck: { operation: "multiply", a, b }, inputForms: forms
  });
}

function phasorDivision() {
  const selected = balancedComplex(() => {
    const a = randomRectangularComplex(), b = randomRectangularComplex(), z = divide(a, b);
    return { a, b, z };
  });
  const { a, b, z } = selected, p = polar(z), forms = pick(COMPLEX_INPUT_FORMS);
  const numerator = complexInputText(a, forms[0]), denominator = complexInputText(b, forms[1]);
  const conjugate = { re: b.re, im: -b.im }, expandedNumerator = multiply(a, conjugate);
  const denominatorMagnitudeSquared = b.re * b.re + b.im * b.im;
  return problem({
    type: "phasorDivision", group: "waveforms", tag: "Complex division",
    image: null, imageAlt: "",
    prompt: `Calculate <span class="math-fraction"><span>${numerator}</span><span>${denominator}</span></span>.`,
    detail: "Express the result in rectangular and polar form.",
    given: [["Numerator", numerator], ["Denominator", denominator]],
    answer: `<div>Result = ${complexText(z)}</div><div>Result = ${phasorText(p.magnitude, p.angle)}</div>`,
    steps: [
      ...conversionSteps(a, b, forms),
      `Multiply the numerator and denominator by the conjugate of B: ${complexText(conjugate)}.`,
      `Numerator after multiplication: ${complexText(expandedNumerator)}`,
      `Denominator: (${sig(b.re)})² + (${sig(b.im)})² = ${sig(denominatorMagnitudeSquared)}`,
      `Result = ${complexText(z)} = ${phasorText(p.magnitude, p.angle)}`
    ],
    result: z, operationCheck: { operation: "divide", a, b }, inputForms: forms
  });
}

function waveformToPhasor() {
  const peak = pick(PHASOR_MAGNITUDES), f = pick(values.frequency), angle = pick(PHASOR_ANGLES);
  const rms = peak / Math.sqrt(2), result = fromPolar(rms, angle);
  const waveform = `${sig(peak)} cos(2π(${engineering(f, "Hz")})t ${signedAngle(angle)}) V`;
  return problem({
    type: "waveformToPhasor", group: "waveforms", tag: "Waveform to phasor",
    image: null, imageAlt: "",
    prompt: `Convert <span class="math-expression">v(t) = ${waveform}</span> to an RMS phasor.`,
    detail: "Use cosine as the reference and convert peak amplitude to RMS.",
    given: [["Peak", engineering(peak, "V")], ["f", engineering(f, "Hz")], ["Phase", `${angle}°`]],
    answer: `<div>V = ${phasorText(rms, angle, "V RMS")}</div>`,
    steps: [`V<sub>rms</sub> = V<sub>p</sub>/√2 = ${engineering(peak, "V")}/√2 = ${engineering(rms, "V")}`, `The cosine phase becomes the phasor angle: ${angle}°.`, `V = ${phasorText(rms, angle, "V RMS")}`],
    result, waveformCheck: { peak, rms, angle, direction: "to-phasor" }
  });
}

function phasorToWaveform() {
  const rms = pick(PHASOR_MAGNITUDES), f = pick(values.frequency), angle = pick(PHASOR_ANGLES);
  const peak = rms * Math.sqrt(2), result = fromPolar(rms, angle);
  const waveform = `${sig(peak)} cos(2π(${engineering(f, "Hz")})t ${signedAngle(angle)}) V`;
  return problem({
    type: "phasorToWaveform", group: "waveforms", tag: "Phasor to waveform",
    image: null, imageAlt: "",
    prompt: `Convert <span class="math-expression">V = ${phasorText(rms, angle, "V RMS")}</span> to a time-domain waveform.`,
    detail: "Use cosine form and convert the RMS magnitude to peak amplitude.",
    given: [["V", phasorText(rms, angle, "V RMS")], ["f", engineering(f, "Hz")]],
    answer: `<div>v(t) = ${waveform}</div>`,
    steps: [`V<sub>p</sub> = √2 V<sub>rms</sub> = √2(${engineering(rms, "V")}) = ${engineering(peak, "V")}`, `ω = 2πf = 2π(${engineering(f, "Hz")})`, `v(t) = ${waveform}`],
    result, waveformCheck: { peak, rms, angle, direction: "to-waveform" }
  });
}

function parallelSourceCurrent() {
  const { f, R, C, Xc } = balancedRC(), Vs = pick(values.voltage), ir = Vs / R, ic = Vs / Xc, total = { re: ir, im: ic }, p = polar(total);
  return problem({ type: "parallelSourceCurrent", group: "phasors", tag: "Current phasor", image: "parallel-rc", imageAlt: "Parallel RC circuit with branch currents marked",
    prompt: "Find the total current supplied by the source.", detail: "Add the resistor and capacitor branch-current phasors.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")]], answer: complexLines(S.Is, total, "A"),
    steps: [`${S.ZC} = 1/(j2πfC) = −j${engineering(Xc, "Ω")}`, `${S.IR} = ${S.Vs}/R = ${engineering(ir, "A")} ∠ 0°`, `${S.IC} = ${S.Vs}/${S.ZC} = ${engineering(ic, "A")} ∠ 90°`, `${S.Is} = ${S.IR} + ${S.IC} = ${engineering(ir, "A")} + j${engineering(ic, "A")}`, `|${S.Is}| = ${engineering(p.magnitude, "A")},   ∠${S.Is} = ${sig(p.angle)}°`], result: total });
}

function loadedVoltageDivider() {
  const useRC = Math.random() < .5;
  const selected = validCandidate(() => {
    const f = pick(values.frequency), R1 = pick(values.resistance), R2 = pick(values.resistance), Vs = pick(values.voltage);
    if (!isBalanced(R2 / R1)) return null;
    let component, reactance, reactiveZ;
    if (useRC) {
      component = pick(values.capacitance);
      reactance = 1 / (TWO_PI * f * component);
      reactiveZ = { re: 0, im: -reactance };
    } else {
      component = pick(values.inductance);
      reactance = TWO_PI * f * component;
      reactiveZ = { re: 0, im: reactance };
    }
    if (!isBalanced(reactance / R2)) return null;
    const branch = parallelZ({ re: R2, im: 0 }, reactiveZ);
    const total = add({ re: R1, im: 0 }, branch);
    const current = divide({ re: Vs, im: 0 }, total);
    const vout = multiply(current, branch), angle = Math.abs(polar(vout).angle);
    if (angle < 10 || angle > 80) return null;
    return { f, R1, R2, Vs, component, reactance, reactiveZ, branch, total, current, vout };
  }, "Could not generate a balanced loaded voltage divider.");
  const { f, R1, R2, Vs, component, reactance, branch, total, vout } = selected;
  const reactiveSymbol = useRC ? S.ZC : S.ZL, componentSymbol = useRC ? "C" : "L", componentUnit = useRC ? "F" : "H";
  const sign = branch.im < 0 ? "−" : "+";
  return problem({
    type: "loadedVoltageDivider", group: "phasors", tag: "Loaded voltage divider",
    image: useRC ? "loaded-rc-divider" : "loaded-rl-divider",
    imageAlt: `Resistor R1 feeding a parallel R2-${componentSymbol} load with the output measured across the load`,
    prompt: `Find the loaded output-voltage phasor ${S.Vout}.`,
    detail: `First combine ${S.R2} and ${componentSymbol} in parallel, then use the impedance voltage divider.`,
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], [S.R1, engineering(R1, "Ω")], [S.R2, engineering(R2, "Ω")], [componentSymbol, engineering(component, componentUnit)]],
    answer: complexLines(S.Vout, vout, "V"),
    steps: [
      `${reactiveSymbol} = ${useRC ? "−" : ""}j${engineering(reactance, "Ω")}`,
      `${S.Zp} = (${S.R2}${reactiveSymbol})/(${S.R2} + ${reactiveSymbol}) = ${engineering(branch.re, "Ω")} ${sign} j${engineering(Math.abs(branch.im), "Ω")}`,
      `Z = ${S.R1} + ${S.Zp} = ${rectangular(total, "Ω")}`,
      `${S.Vout} = ${S.Vs}[${S.Zp}/(${S.R1} + ${S.Zp})]`,
      `${S.Vout} = ${engineering(polar(vout).magnitude, "V")} ∠ ${sig(polar(vout).angle)}°`
    ],
    result: vout, circuitFamily: useRC ? "RC" : "RL",
    dividerCheck: { ratio: divide(branch, total), sourceMagnitude: Vs }
  });
}

function requiredSourceVoltage() {
  const { f, R, C, Xc } = balancedRC(), targetMagnitude = pick(values.voltage);
  const zc = { re: 0, im: -Xc }, z = add({ re: R, im: 0 }, zc);
  const divider = divide(zc, z), requiredMagnitude = targetMagnitude / polar(divider).magnitude;
  const vc = multiply({ re: requiredMagnitude, im: 0 }, divider);
  return problem({
    type: "requiredSourceVoltage", group: "phasors", tag: "Required source voltage",
    image: "series-rc-vc", imageAlt: "Series RC circuit with the capacitor voltage marked",
    prompt: `Find the source-voltage magnitude required to make |${S.VC}| = ${engineering(targetMagnitude, "V")}.`,
    detail: "Use the impedance voltage-divider magnitude.",
    given: [["f", engineering(f, "Hz")], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")], [`Desired |${S.VC}|`, engineering(targetMagnitude, "V")]],
    answer: `<div>|${S.Vs}| = ${engineering(requiredMagnitude, "V")}</div>`,
    steps: [
      `${S.ZC} = −j${engineering(Xc, "Ω")}`,
      `|${S.VC}/${S.Vs}| = |${S.ZC}/(R + ${S.ZC})| = ${sig(polar(divider).magnitude)}`,
      `|${S.Vs}| = |${S.VC}|/|${S.VC}/${S.Vs}|`,
      `|${S.Vs}| = ${engineering(requiredMagnitude, "V")}`,
      `Check: |${S.VC}| = ${engineering(polar(vc).magnitude, "V")}`
    ],
    result: vc, solvedSourceMagnitude: requiredMagnitude, targetMagnitude
  });
}

function seriesResistorPower() {
  const useRC = Math.random() < .5, Vs = pick(values.voltage);
  let f, R, reactiveGiven, impedanceStep, z, image, imageAlt;
  if (useRC) {
    const selected = balancedRC();
    f = selected.f; R = selected.R; reactiveGiven = ["C", engineering(selected.C, "F")];
    z = { re: R, im: -selected.Xc }; impedanceStep = `${S.ZC} = −j${engineering(selected.Xc, "Ω")}`; image = "series-rc"; imageAlt = "Series RC circuit";
  } else {
    const selected = balancedRL();
    f = selected.f; R = selected.R; reactiveGiven = ["L", engineering(selected.L, "H")];
    z = { re: R, im: selected.Xl }; impedanceStep = `${S.ZL} = j${engineering(selected.Xl, "Ω")}`; image = "series-rl"; imageAlt = "Series RL circuit";
  }
  const current = divide({ re: Vs, im: 0 }, z), currentMagnitude = polar(current).magnitude, power = currentMagnitude * currentMagnitude * R;
  return problem({ type: "seriesResistorPower", group: "power", tag: "Resistor power", image, imageAlt,
    prompt: "Find the average power dissipated in the resistor.", detail: "Use RMS phasors and report real power.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], reactiveGiven],
    answer: `<div>${S.PR} = ${engineering(power, "W")}</div>`,
    steps: [impedanceStep, `Z = ${engineering(polar(z).magnitude, "Ω")} ∠ ${sig(polar(z).angle)}°`, `|I| = |${S.Vs}/Z| = ${engineering(currentMagnitude, "A")}`, `${S.PR} = |I|²R = ${engineering(power, "W")}`],
    result: { re: power, im: 0 }, resistorDirectlyAcrossSource: false });
}

function mixedResistorPower() {
  const selected = balancedComplex(() => {
    const f = pick(values.frequency), R1 = pick(values.resistance), R2 = pick(values.resistance), C = pick(values.capacitance);
    const Xc = 1 / (TWO_PI * f * C), zc = { re: 0, im: -Xc }, branch = parallelZ({ re: R2, im: 0 }, zc), z = add({ re: R1, im: 0 }, branch);
    return { f, R1, R2, C, Xc, branch, z };
  });
  const { f, R1, R2, C, Xc, branch, z } = selected, Vs = pick(values.voltage);
  const current = divide({ re: Vs, im: 0 }, z), branchVoltage = multiply(current, branch), branchVoltageMagnitude = polar(branchVoltage).magnitude;
  const power = branchVoltageMagnitude * branchVoltageMagnitude / R2;
  return problem({ type: "mixedResistorPower", group: "power", tag: "Resistor power", image: "series-r-parallel-rc", imageAlt: "Resistor R1 in series with parallel resistor R2 and capacitor C",
    prompt: `Find the average power dissipated in ${S.R2}.`, detail: "First find the RMS voltage across the parallel branch.",
    given: [["f", engineering(f, "Hz")], [S.Vs, `${engineering(Vs, "V")} ∠ 0°`], [S.R1, engineering(R1, "Ω")], [S.R2, engineering(R2, "Ω")], ["C", engineering(C, "F")]],
    answer: `<div>${S.PR2} = ${engineering(power, "W")}</div>`,
    steps: [`${S.ZC} = −j${engineering(Xc, "Ω")}`, `${S.Zp} = (${S.R2}${S.ZC})/(${S.R2} + ${S.ZC})`, `Z = ${S.R1} + ${S.Zp} = ${engineering(z.re, "Ω")} − j${engineering(Math.abs(z.im), "Ω")}`, `I = ${S.Vs}/Z`, `|${S.Vp}| = |I ${S.Zp}| = ${engineering(branchVoltageMagnitude, "V")}`, `${S.PR2} = |${S.Vp}|²/${S.R2} = ${engineering(power, "W")}`],
    result: { re: power, im: 0 }, resistorDirectlyAcrossSource: false });
}

function rcFilterResponse() {
  const { f, R, C, Xc } = balancedRC(), Vin = pick(values.voltage), x = R / Xc;
  const outputAcrossC = Math.random() < .5;
  const ratio = outputAcrossC
    ? { re: 1 / (1 + x * x), im: -x / (1 + x * x) }
    : { re: x * x / (1 + x * x), im: x / (1 + x * x) };
  const output = { re: Vin * ratio.re, im: Vin * ratio.im }, pr = polar(ratio);
  const filterType = outputAcrossC ? "low-pass" : "high-pass";
  const divider = outputAcrossC ? `${S.ZC}/(R + ${S.ZC})` : `R/(R + ${S.ZC})`;
  const behavior = outputAcrossC ? `At low frequency, |${S.ZC}| is large, so ${S.Vout} ≈ ${S.Vin}.` : `At low frequency, |${S.ZC}| is large, so ${S.Vout} ≈ 0.`;
  return problem({ type: "rcFilterResponse", group: "filters", tag: "RC filter", image: outputAcrossC ? "rc-lowpass" : "rc-highpass", imageAlt: `RC filter with output across the ${outputAcrossC ? "capacitor" : "resistor"}`,
    prompt: "What type of filter is this? Find its voltage ratio and output phasor.", detail: "Identify the filter from the output location, then use the impedance voltage divider.",
    given: [["f", engineering(f, "Hz")], [S.Vin, `${engineering(Vin, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["C", engineering(C, "F")]],
    answer: `<div>Filter type: ${filterType}</div><div>${S.Vout}/${S.Vin} = ${sig(pr.magnitude)} ∠ ${sig(pr.angle)}°</div>${complexLines(S.Vout, output, "V")}`,
    steps: [`${behavior} Therefore this is a ${filterType} filter.`, `${S.ZC} = 1/(j2πfC) = −j${engineering(Xc, "Ω")}`, `${S.Vout} = ${S.Vin}[${divider}]`, `|${S.Vout}/${S.Vin}| = ${sig(pr.magnitude)}`, `∠(${S.Vout}/${S.Vin}) = ${sig(pr.angle)}°`], result: output });
}

function lrFilterResponse() {
  const { f, R, L, Xl } = balancedRL(), Vin = pick(values.voltage), outputAcrossR = Math.random() < .5;
  const denominator = { re: R, im: Xl };
  const ratio = outputAcrossR ? divide({ re: R, im: 0 }, denominator) : divide({ re: 0, im: Xl }, denominator);
  const output = { re: Vin * ratio.re, im: Vin * ratio.im }, pr = polar(ratio);
  const filterType = outputAcrossR ? "low-pass" : "high-pass";
  const divider = outputAcrossR ? `R/(R + ${S.ZL})` : `${S.ZL}/(R + ${S.ZL})`;
  const behavior = outputAcrossR ? `At low frequency, |${S.ZL}| is small, so ${S.Vout} ≈ ${S.Vin}.` : `At low frequency, |${S.ZL}| is small, so ${S.Vout} ≈ 0.`;
  return problem({ type: "lrFilterResponse", group: "filters", tag: "LR filter", image: outputAcrossR ? "lr-output-r" : "lr-output-l", imageAlt: `LR filter with output across the ${outputAcrossR ? "resistor" : "inductor"}`,
    prompt: "What type of filter is this? Find its voltage ratio and output phasor.", detail: "Identify the filter from the output location, then use the impedance voltage divider.",
    given: [["f", engineering(f, "Hz")], [S.Vin, `${engineering(Vin, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")]],
    answer: `<div>Filter type: ${filterType}</div><div>${S.Vout}/${S.Vin} = ${sig(pr.magnitude)} ∠ ${sig(pr.angle)}°</div>${complexLines(S.Vout, output, "V")}`,
    steps: [`${behavior} Therefore this is a ${filterType} filter.`, `${S.ZL} = j2πfL = j${engineering(Xl, "Ω")}`, `${S.Vout} = ${S.Vin}[${divider}]`, `|${S.Vout}/${S.Vin}| = ${sig(pr.magnitude)}`, `∠(${S.Vout}/${S.Vin}) = ${sig(pr.angle)}°`], result: output });
}

function cutoffFrequency() {
  const useRC = Math.random() < .5, lowpass = Math.random() < .5, R = pick(values.resistance);
  let fc, image, imageAlt, reactiveGiven, cutoffSteps, family;
  if (useRC) {
    const C = pick(values.capacitance);
    fc = 1 / (TWO_PI * R * C); family = "RC"; reactiveGiven = ["C", engineering(C, "F")];
    image = lowpass ? "rc-lowpass" : "rc-highpass"; imageAlt = `RC filter with output across the ${lowpass ? "capacitor" : "resistor"}`;
    cutoffSteps = [`At cutoff, |${S.ZC}| = R.`, `1/(2π${S.fc}C) = R`, `${S.fc} = 1/(2πRC) = ${engineering(fc, "Hz")}`];
  } else {
    const L = pick(values.inductance);
    fc = R / (TWO_PI * L); family = "LR"; reactiveGiven = ["L", engineering(L, "H")];
    image = lowpass ? "lr-output-r" : "lr-output-l"; imageAlt = `LR filter with output across the ${lowpass ? "resistor" : "inductor"}`;
    cutoffSteps = [`At cutoff, |${S.ZL}| = R.`, `2π${S.fc}L = R`, `${S.fc} = R/(2πL) = ${engineering(fc, "Hz")}`];
  }
  return problem({ type: "cutoffFrequency", group: "filters", tag: `${family} filter`, image, imageAlt,
    prompt: "What type of filter is this? Find its cutoff frequency.", detail: "Also state the voltage ratio and phase shift at cutoff.",
    given: [["R", engineering(R, "Ω")], reactiveGiven],
    answer: `<div>Filter type: ${lowpass ? "low-pass" : "high-pass"}</div><div>${S.fc} = ${engineering(fc, "Hz")}</div><div>${S.Vout}/${S.Vin} = 0.707 ∠ ${lowpass ? "−45" : "+45"}°</div>`,
    steps: [`The output location makes this a ${lowpass ? "low-pass" : "high-pass"} filter.`, ...cutoffSteps, `The impedance divider gives |${S.Vout}/${S.Vin}| = 1/√2 = 0.707 and phase = ${lowpass ? "−45" : "+45"}°.`], result: { re: fc, im: 0 } });
}

function rlcFilterMetrics() {
  const { R, L, C, X0, f0 } = balancedResonantRLC(), outputAcrossR = Math.random() < .5;
  const bandwidth = R / (TWO_PI * L), quality = X0 / R, filterType = outputAcrossR ? "band-pass" : "band-stop";
  const behavior = outputAcrossR
    ? `At resonance, ${S.ZL} + ${S.ZC} = 0, current is maximum, and the resistor voltage is maximum.`
    : `At resonance, ${S.ZL} + ${S.ZC} = 0, so the combined voltage across L and C is zero.`;
  return problem({ type: "rlcFilterMetrics", group: "filters", tag: "Series RLC filter", image: outputAcrossR ? "rlc-output-r" : "rlc-output-lc", imageAlt: `Series RLC filter with output across ${outputAcrossR ? "the resistor" : "the inductor-capacitor pair"}`,
    prompt: `What type of filter is this? Find ${S.f0}, bandwidth, and quality factor.`, detail: "Use the series-resonance relationships and the marked output location.",
    given: [["R", engineering(R, "Ω")], ["L", engineering(L, "H")], ["C", engineering(C, "F")]],
    answer: `<div>Filter type: ${filterType}</div><div>${S.f0} = ${engineering(f0, "Hz")}</div><div>Bandwidth = ${engineering(bandwidth, "Hz")}</div><div>Q = ${sig(quality)}</div>`,
    steps: [`${behavior} Therefore this is a ${filterType} filter.`, `At resonance, ${S.ZL} + ${S.ZC} = 0.`, `${S.f0} = 1/(2π√(LC)) = ${engineering(f0, "Hz")}`, `Bandwidth = R/(2πL) = ${engineering(bandwidth, "Hz")}`, `Q = 2π${S.f0}L/R = ${S.f0}/Bandwidth = ${sig(quality)}`], result: { re: f0, im: bandwidth } });
}

function filterComponentDesign() {
  const useRC = Math.random() < .5, lowpass = Math.random() < .5;
  const selected = validCandidate(() => {
    const R = pick(values.resistance), component = pick(useRC ? values.capacitance : values.inductance);
    const fc = useRC ? 1 / (TWO_PI * R * component) : R / (TWO_PI * component);
    return fc >= 100 && fc <= 100000 ? { R, component, fc } : null;
  }, "Could not generate a filter-component design problem.");
  const { R, component: selectedComponent, fc: selectedCutoff } = selected;
  let component, unit, symbol, fc, image, imageAlt, formula, family;
  if (useRC) {
    component = selectedComponent; unit = "F"; symbol = "C"; family = "RC"; fc = selectedCutoff;
    image = lowpass ? "rc-lowpass" : "rc-highpass";
    imageAlt = `RC filter with output across the ${lowpass ? "capacitor" : "resistor"}`;
    formula = `C = 1/(2πR${S.fc}) = ${engineering(component, unit)}`;
  } else {
    component = selectedComponent; unit = "H"; symbol = "L"; family = "LR"; fc = selectedCutoff;
    image = lowpass ? "lr-output-r" : "lr-output-l";
    imageAlt = `LR filter with output across the ${lowpass ? "resistor" : "inductor"}`;
    formula = `L = R/(2π${S.fc}) = ${engineering(component, unit)}`;
  }
  const filterType = lowpass ? "low-pass" : "high-pass";
  return problem({
    type: "filterComponentDesign", group: "filters", tag: `${family} filter design`, image, imageAlt,
    prompt: `What type of filter is this? Find the required value of ${symbol}.`,
    detail: "Choose the reactive component to produce the specified cutoff frequency.",
    given: [["R", engineering(R, "Ω")], [S.fc, engineering(fc, "Hz")]],
    answer: `<div>Filter type: ${filterType}</div><div>${symbol} = ${engineering(component, unit)}</div>`,
    steps: [`The output location makes this a ${filterType} filter.`, useRC ? `At cutoff, 1/(2π${S.fc}C) = R.` : `At cutoff, 2π${S.fc}L = R.`, formula],
    result: { re: component, im: 0 }, angleGuard: false, designCheck: { actual: useRC ? 1 / (TWO_PI * R * component) : R / (TWO_PI * component), target: fc }, circuitFamily: family
  });
}

function resonantComponentDesign() {
  const selected = validCandidate(() => {
    const candidate = balancedResonantRLC();
    return candidate.f0 >= 100 && candidate.f0 <= 100000 ? candidate : null;
  }, "Could not generate a resonant-component design problem.");
  const { R, L, C, f0 } = selected, solveForC = Math.random() < .5;
  const symbol = solveForC ? "C" : "L", component = solveForC ? C : L, unit = solveForC ? "F" : "H";
  const knownGiven = solveForC ? ["L", engineering(L, "H")] : ["C", engineering(C, "F")];
  const formula = solveForC ? `C = 1/[(2π${S.f0})²L]` : `L = 1/[(2π${S.f0})²C]`;
  return problem({
    type: "resonantComponentDesign", group: "resonance", tag: "RLC resonance design",
    image: "series-rlc", imageAlt: "Series RLC circuit",
    prompt: `Find ${symbol} for the specified resonant frequency.`,
    detail: "Use the series-resonance relationship.",
    given: [["R", engineering(R, "Ω")], knownGiven, [S.f0, engineering(f0, "Hz")]],
    answer: `<div>${symbol} = ${engineering(component, unit)}</div>`,
    steps: [`${S.f0} = 1/(2π√(LC))`, `${formula} = ${engineering(component, unit)}`],
    result: { re: component, im: 0 }, angleGuard: false,
    designCheck: { actual: 1 / (TWO_PI * Math.sqrt(L * C)), target: f0 }, designMode: solveForC ? "C" : "L"
  });
}

function rlcMetricDesign() {
  const selected = validCandidate(() => {
    const candidate = balancedResonantRLC(), quality = candidate.X0 / candidate.R;
    return candidate.f0 >= 100 && candidate.f0 <= 100000 && quality >= .5 ? candidate : null;
  }, "Could not generate an RLC metric-design problem.");
  const { R, L, C, X0, f0 } = selected, designQ = Math.random() < .5;
  const bandwidth = R / (TWO_PI * L), quality = X0 / R;
  const metricName = designQ ? "quality factor" : "bandwidth";
  const metricGiven = designQ ? ["Q", sig(quality)] : ["Bandwidth", engineering(bandwidth, "Hz")];
  const calculation = designQ
    ? `R = √(L/C)/Q = ${engineering(R, "Ω")}`
    : `R = 2πL(Bandwidth) = ${engineering(R, "Ω")}`;
  return problem({
    type: "rlcMetricDesign", group: "resonance", tag: "RLC resonance design",
    image: "series-rlc", imageAlt: "Series RLC circuit",
    prompt: `Find R for the specified ${metricName}.`,
    detail: "Use the series-RLC bandwidth or quality-factor relationship.",
    given: [["L", engineering(L, "H")], ["C", engineering(C, "F")], [S.f0, engineering(f0, "Hz")], metricGiven],
    answer: `<div>R = ${engineering(R, "Ω")}</div>`,
    steps: [designQ ? `Q = √(L/C)/R` : `Bandwidth = R/(2πL)`, calculation],
    result: { re: R, im: 0 }, angleGuard: false,
    designCheck: { actual: designQ ? X0 / R : R / (TWO_PI * L), target: designQ ? quality : bandwidth }, designMode: designQ ? "Q" : "bandwidth"
  });
}

function filterFrequencyComparison() {
  const useRC = Math.random() < .5, lowpass = Math.random() < .5, Vin = pick(values.voltage);
  const selected = validCandidate(() => {
    const R = pick(values.resistance), component = pick(useRC ? values.capacitance : values.inductance);
    const fc = useRC ? 1 / (TWO_PI * R * component) : R / (TWO_PI * component);
    return fc >= 100 && fc <= 100000 ? { R, component, fc } : null;
  }, "Could not generate a filter frequency-comparison problem.");
  const { R, component: selectedComponent, fc: selectedCutoff } = selected;
  let component, fc, image, imageAlt, family, ratioAt;
  if (useRC) {
    component = selectedComponent; fc = selectedCutoff; family = "RC";
    image = lowpass ? "rc-lowpass" : "rc-highpass";
    imageAlt = `RC filter with output across the ${lowpass ? "capacitor" : "resistor"}`;
    ratioAt = (f) => rcFilterRatio(R, component, f, lowpass);
  } else {
    component = selectedComponent; fc = selectedCutoff; family = "LR";
    image = lowpass ? "lr-output-r" : "lr-output-l";
    imageAlt = `LR filter with output across the ${lowpass ? "resistor" : "inductor"}`;
    ratioAt = (f) => lrFilterRatio(R, component, f, lowpass);
  }
  const frequencies = [fc / 10, fc, fc * 10];
  const rows = frequencies.map((f) => {
    const ratio = ratioAt(f), p = polar(ratio);
    return { f, ratio, magnitude: p.magnitude, angle: p.angle, db: decibels(p.magnitude), outputMagnitude: Vin * p.magnitude };
  });
  const filterType = lowpass ? "low-pass" : "high-pass", unit = useRC ? "F" : "H";
  const answerRows = rows.map((row) => `<div>At ${engineering(row.f, "Hz")}: |${S.Vout}/${S.Vin}| = ${sig(row.magnitude)}, gain = ${sig(row.db)} dB, |${S.Vout}| = ${engineering(row.outputMagnitude, "V")}</div>`).join("");
  return problem({
    type: "filterFrequencyComparison", group: "filters", tag: `${family} filter`, image, imageAlt,
    prompt: "What type of filter is this? Compare its output and gain at three frequencies.",
    detail: `Calculate the response at 0.1${S.fc}, ${S.fc}, and 10${S.fc} using impedances.`,
    given: [[S.Vin, `${engineering(Vin, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], [useRC ? "C" : "L", engineering(component, unit)], [S.fc, engineering(fc, "Hz")]],
    answer: `<div>Filter type: ${filterType}</div>${answerRows}`,
    steps: [`The output location makes this a ${filterType} filter.`, `For each frequency, calculate the reactive impedance and use the impedance voltage divider.`, `Gain in dB = 20 log₁₀|${S.Vout}/${S.Vin}|.`, `At ${S.fc}, the ratio is 0.707 and the gain is −3.01 dB.`],
    result: multiply({ re: Vin, im: 0 }, rows[1].ratio), frequencyRows: rows
  });
}

function filterDecibelGain() {
  const useRC = Math.random() < .5, lowpass = Math.random() < .5, Vin = pick(values.voltage);
  let f, R, component, unit, ratio, image, imageAlt, family;
  if (useRC) {
    const selected = balancedRC(); f = selected.f; R = selected.R; component = selected.C; unit = "F"; family = "RC";
    ratio = rcFilterRatio(R, component, f, lowpass);
    image = lowpass ? "rc-lowpass" : "rc-highpass"; imageAlt = `RC filter with output across the ${lowpass ? "capacitor" : "resistor"}`;
  } else {
    const selected = balancedRL(); f = selected.f; R = selected.R; component = selected.L; unit = "H"; family = "LR";
    ratio = lrFilterRatio(R, component, f, lowpass);
    image = lowpass ? "lr-output-r" : "lr-output-l"; imageAlt = `LR filter with output across the ${lowpass ? "resistor" : "inductor"}`;
  }
  const p = polar(ratio), gainDb = decibels(p.magnitude), output = multiply({ re: Vin, im: 0 }, ratio);
  const filterType = lowpass ? "low-pass" : "high-pass";
  return problem({
    type: "filterDecibelGain", group: "filters", tag: `${family} filter`, image, imageAlt,
    prompt: "What type of filter is this? Find its voltage gain in decibels and its output phasor.",
    detail: "First use the impedance divider to find the voltage ratio, then convert its magnitude to dB.",
    given: [["f", engineering(f, "Hz")], [S.Vin, `${engineering(Vin, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], [useRC ? "C" : "L", engineering(component, unit)]],
    answer: `<div>Filter type: ${filterType}</div><div>Gain = ${sig(gainDb)} dB</div><div>${S.Vout}/${S.Vin} = ${sig(p.magnitude)} ∠ ${sig(p.angle)}°</div>${complexLines(S.Vout, output, "V")}`,
    steps: [`The output location makes this a ${filterType} filter.`, `Use the impedance divider to obtain |${S.Vout}/${S.Vin}| = ${sig(p.magnitude)}.`, `Gain = 20 log₁₀(${sig(p.magnitude)}) = ${sig(gainDb)} dB.`, `${S.Vout} = ${S.Vin}(${S.Vout}/${S.Vin}) = ${engineering(polar(output).magnitude, "V")} ∠ ${sig(polar(output).angle)}°`],
    result: output, gainCheck: { ratioMagnitude: p.magnitude, db: gainDb }
  });
}

function filterGainFrequency() {
  const useRC = Math.random() < .5, lowpass = Math.random() < .5, targetDb = pick([-1, -3, -6, -10, -12]);
  const targetRatio = 10 ** (targetDb / 20);
  const selected = validCandidate(() => {
    const R = pick(values.resistance), component = pick(useRC ? values.capacitance : values.inductance);
    const fc = useRC ? 1 / (TWO_PI * R * component) : R / (TWO_PI * component);
    const normalizedFrequency = lowpass
      ? Math.sqrt(1 / (targetRatio * targetRatio) - 1)
      : targetRatio / Math.sqrt(1 - targetRatio * targetRatio);
    const f = fc * normalizedFrequency;
    return fc >= 100 && fc <= 100000 && f >= 10 && f <= 1000000 ? { R, component, fc, f } : null;
  }, "Could not generate an inverse filter-gain problem.");
  const { R, component, fc, f } = selected;
  const family = useRC ? "RC" : "LR", unit = useRC ? "F" : "H";
  const image = useRC ? (lowpass ? "rc-lowpass" : "rc-highpass") : (lowpass ? "lr-output-r" : "lr-output-l");
  const imageAlt = `${family} filter with output across the ${useRC ? (lowpass ? "capacitor" : "resistor") : (lowpass ? "resistor" : "inductor")}`;
  const ratio = useRC ? rcFilterRatio(R, component, f, lowpass) : lrFilterRatio(R, component, f, lowpass);
  const actualDb = decibels(polar(ratio).magnitude), filterType = lowpass ? "low-pass" : "high-pass";
  const frequencyEquation = lowpass
    ? `f = ${S.fc}√(1/M² − 1)`
    : `f = ${S.fc}M/√(1 − M²)`;
  return problem({
    type: "filterGainFrequency", group: "filters", tag: `${family} filter`, image, imageAlt,
    prompt: "What type of filter is this? Find the frequency that gives the specified voltage gain.",
    detail: "Convert the dB value to a voltage ratio, then solve the impedance-divider magnitude for frequency.",
    given: [["R", engineering(R, "Ω")], [useRC ? "C" : "L", engineering(component, unit)], ["Gain", `${targetDb} dB`]],
    answer: `<div>Filter type: ${filterType}</div><div>f = ${engineering(f, "Hz")}</div><div>|${S.Vout}/${S.Vin}| = ${sig(targetRatio)}</div>`,
    steps: [`The output location makes this a ${filterType} filter.`, `M = |${S.Vout}/${S.Vin}| = 10^(Gain/20) = ${sig(targetRatio)}`, `${S.fc} = ${useRC ? "1/(2πRC)" : "R/(2πL)"} = ${engineering(fc, "Hz")}`, `${frequencyEquation} = ${engineering(f, "Hz")}`, `Check: 20 log₁₀|${S.Vout}/${S.Vin}| = ${sig(actualDb)} dB.`],
    result: ratio, gainCheck: { ratioMagnitude: polar(ratio).magnitude, db: actualDb }, designCheck: { actual: actualDb, target: targetDb }, circuitFamily: family
  });
}

function resonanceCurrentVoltages() {
  const selected = validCandidate(() => {
    const candidate = balancedResonantRLC(), quality = candidate.X0 / candidate.R;
    return candidate.f0 >= 100 && candidate.f0 <= 100000 && quality >= .5 ? candidate : null;
  }, "Could not generate a resonance voltage problem.");
  const { R, L, C, X0, f0 } = selected, Vs = pick(values.voltage);
  const currentMagnitude = Vs / R, quality = X0 / R;
  const current = { re: currentMagnitude, im: 0 };
  const vl = { re: 0, im: currentMagnitude * X0 }, vc = { re: 0, im: -currentMagnitude * X0 };
  return problem({
    type: "resonanceCurrentVoltages", group: "resonance", tag: "RLC resonance",
    image: "series-rlc-voltages", imageAlt: "Series RLC circuit with component-voltage polarities marked",
    prompt: `Find ${S.f0}, I, ${S.VL}, and ${S.VC} at resonance.`,
    detail: "At series resonance, the inductive and capacitive reactances cancel and the total impedance is R.",
    given: [[S.Vs, `${engineering(Vs, "V")} ∠ 0°`], ["R", engineering(R, "Ω")], ["L", engineering(L, "H")], ["C", engineering(C, "F")]],
    answer: `<div>${S.f0} = ${engineering(f0, "Hz")}</div>${polarLine("I", current, "A")}${polarLine(S.VL, vl, "V")}${polarLine(S.VC, vc, "V")}<div>Q = ${sig(quality)}</div>`,
    steps: [`${S.f0} = 1/(2π√(LC)) = ${engineering(f0, "Hz")}`, `At resonance, ${S.ZL} + ${S.ZC} = 0 and Z = R.`, `I = ${S.Vs}/R = ${engineering(currentMagnitude, "A")} ∠ 0°`, `X<sub>0</sub> = 2π${S.f0}L = √(L/C) = ${engineering(X0, "Ω")}`, `${S.VL} = I(jX<sub>0</sub>) = ${engineering(polar(vl).magnitude, "V")} ∠ 90°`, `${S.VC} = I(−jX<sub>0</sub>) = ${engineering(polar(vc).magnitude, "V")} ∠ −90°`, `${S.VL} + ${S.VC} = 0, so ${S.Vs} = ${S.VR}.`],
    result: current, angleGuard: false,
    resonanceCheck: { reactiveSum: add(vl, vc), sourceMagnitude: Vs, resistorVoltageMagnitude: currentMagnitude * R }
  });
}

const generators = { seriesRCImpedance, seriesRLImpedance, seriesRLCImpedance, parallelRCImpedance, parallelRLImpedance, seriesThreeImpedance, parallelThreeImpedance, seriesParallelImpedance, parallelSeriesImpedance, seriesCurrent, capacitorVoltage, seriesComponentVoltages, parallelSourceCurrent, loadedVoltageDivider, requiredSourceVoltage, unknownComponent, unknownFrequency, phasorAddition, phasorMultiplication, phasorDivision, waveformToPhasor, phasorToWaveform, seriesResistorPower, mixedResistorPower, rcFilterResponse, lrFilterResponse, cutoffFrequency, rlcFilterMetrics, filterComponentDesign, resonantComponentDesign, rlcMetricDesign, resonanceCurrentVoltages, filterFrequencyComparison, filterDecibelGain, filterGainFrequency };
const sets = {
  mixed: Object.keys(generators),
  impedance: ["seriesRCImpedance", "seriesRLImpedance", "seriesRLCImpedance", "parallelRCImpedance", "parallelRLImpedance"],
  advanced: ["seriesThreeImpedance", "parallelThreeImpedance", "seriesParallelImpedance", "parallelSeriesImpedance"],
  phasors: ["seriesCurrent", "capacitorVoltage", "seriesComponentVoltages", "parallelSourceCurrent", "loadedVoltageDivider", "requiredSourceVoltage"],
  unknown: ["unknownComponent", "unknownFrequency"],
  power: ["seriesResistorPower", "mixedResistorPower"],
  filters: ["rcFilterResponse", "lrFilterResponse", "cutoffFrequency", "rlcFilterMetrics", "filterComponentDesign", "filterFrequencyComparison", "filterDecibelGain", "filterGainFrequency"],
  resonance: ["resonantComponentDesign", "rlcMetricDesign", "resonanceCurrentVoltages"],
  waveforms: ["phasorAddition", "phasorMultiplication", "phasorDivision", "waveformToPhasor", "phasorToWaveform"]
};

const analyticsQueue = [];

function analyticsEnabled() {
  return typeof window !== "undefined"
    && window.location.hostname === ANALYTICS.hostname
    && window.location.pathname.startsWith(ANALYTICS.pathPrefix);
}

function flushAnalyticsQueue() {
  if (!window.goatcounter || typeof window.goatcounter.count !== "function") return;
  while (analyticsQueue.length) window.goatcounter.count(analyticsQueue.shift());
}

function trackUsage(action, category, template = "") {
  if (!analyticsEnabled()) return;
  const path = [action, category, template].filter(Boolean).join(":");
  const payload = { path, title: path, event: true, no_session: true };
  if (window.goatcounter && typeof window.goatcounter.count === "function") window.goatcounter.count(payload);
  else analyticsQueue.push(payload);
}

function startAnalytics() {
  if (!analyticsEnabled()) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.v5.js";
  script.dataset.goatcounter = ANALYTICS.endpoint;
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  script.addEventListener("load", flushAnalyticsQueue);
  document.head.appendChild(script);
}

function givenMarkup(items) {
  return items.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join("");
}

function newProblem() {
  const type = pickDifferent(sets[state.set], state.lastType);
  state.lastType = type;
  state.problem = generators[type]();
  state.count += 1;
  $("#problem-number").textContent = `Problem ${String(state.count).padStart(2, "0")}`;
  $("#problem-tag").textContent = state.problem.tag;
  $("#problem-prompt").innerHTML = state.problem.prompt;
  $("#problem-detail").innerHTML = state.problem.detail;
  const circuit = $("#circuit");
  const hasCircuit = Boolean(state.problem.image);
  circuit.hidden = !hasCircuit;
  circuit.innerHTML = hasCircuit ? circuitImage(state.problem.image, state.problem.imageAlt) : "";
  $(".problem-body").className = `problem-body${hasCircuit ? "" : " no-circuit"}`;
  $("#given-values").innerHTML = givenMarkup(state.problem.given);
  $("#final-answer").innerHTML = state.problem.answer;
  $("#solution-steps").innerHTML = state.problem.steps.map((step) => `<p>${step}</p>`).join("");
  $("#answer-panel").hidden = true;
  $("#reveal-button").hidden = false;
  $("#answer-panel details").open = false;
  trackUsage("problem-generated", state.set, type);
}

function revealAnswer() {
  if (!$("#answer-panel").hidden) return;
  $("#answer-panel").hidden = false;
  $("#reveal-button").hidden = true;
  trackUsage("answer-revealed", state.set, state.problem.type);
}

$("#problem-set").addEventListener("change", (event) => {
  state.set = event.target.value;
  state.lastType = null;
  trackUsage("category-selected", state.set);
  newProblem();
});
$("#reveal-button").addEventListener("click", revealAnswer);
$("#new-button").addEventListener("click", newProblem);
document.addEventListener("keydown", (event) => {
  if (event.target.matches("select, button, input, summary")) return;
  if (event.key.toLowerCase() === "r") revealAnswer();
  if (event.key.toLowerCase() === "n") newProblem();
});

startAnalytics();
newProblem();
