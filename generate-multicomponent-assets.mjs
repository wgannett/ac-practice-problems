import fs from "node:fs";

const outputDirectory = new URL("./assets/", import.meta.url);

const pairs = {
  lc: [{ kind: "L", label: "L" }, { kind: "C", label: "C" }],
  ll: [{ kind: "L", label: "L_1" }, { kind: "L", label: "L_2" }],
  cc: [{ kind: "C", label: "C_1" }, { kind: "C", label: "C_2" }]
};

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const label = (x, y, value, anchor = "middle") => {
  const [base, subscript] = value.split("_");
  const content = subscript
    ? `${esc(base)}<tspan baseline-shift="sub" font-size="15">${esc(subscript)}</tspan>`
    : esc(base);
  return `<text x="${x}" y="${y}" text-anchor="${anchor}">${content}</text>`;
};

function horizontalComponent(kind, x, y, name) {
  let drawing;
  if (kind === "R") {
    drawing = `<path d="M ${x - 50} ${y} h 10 l 8 -14 l 16 28 l 16 -28 l 16 28 l 16 -28 l 8 14 h 10"/>`;
  } else if (kind === "L") {
    drawing = `<path d="M ${x - 50} ${y} h 10 c 0 -18 20 -18 20 0 c 0 -18 20 -18 20 0 c 0 -18 20 -18 20 0 c 0 -18 20 -18 20 0 h 10"/>`;
  } else {
    drawing = `<path d="M ${x - 50} ${y} h 35 M ${x - 15} ${y - 32} v 64 M ${x + 15} ${y - 32} v 64 M ${x + 15} ${y} h 35"/>`;
  }
  return `${drawing}${label(x, y - 30, name)}`;
}

function verticalComponent(kind, x, y, name, length = 120, labelSide = "right") {
  const half = length / 2;
  let drawing;
  if (kind === "R") {
    const lead = (length - 96) / 2;
    const top = y - half;
    drawing = `<path d="M ${x} ${top} v ${lead} l -14 8 l 28 16 l -28 16 l 28 16 l -28 16 l 28 16 l -14 8 v ${lead}"/>`;
  } else if (kind === "L") {
    const humps = length >= 100 ? 4 : 3;
    const lead = 10;
    const span = (length - 2 * lead) / humps;
    const top = y - half;
    drawing = `<path d="M ${x} ${top} v ${lead} ${Array.from({ length: humps }, () => `c 18 0 18 ${span} 0 ${span}`).join(" ")} v ${lead}"/>`;
  } else {
    const plateGap = 26;
    const lead = (length - plateGap) / 2;
    const top = y - half;
    drawing = `<path d="M ${x} ${top} v ${lead} M ${x - 32} ${y - plateGap / 2} h 64 M ${x - 32} ${y + plateGap / 2} h 64 M ${x} ${y + plateGap / 2} v ${lead}"/>`;
  }
  const labelX = labelSide === "right" ? x + 42 : x - 42;
  const anchor = labelSide === "right" ? "start" : "end";
  return `${drawing}${label(labelX, y + 6, name, anchor)}`;
}

function source() {
  return `<circle cx="80" cy="150" r="35"/><path d="M 55 150 c 9 -18 17 -18 25 0 s 16 18 25 0"/>${label(8, 157, "V_s", "start")}`;
}

function wrap(title, description, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(description)}</desc>
  <style>
    path, circle { fill: none; stroke: #111; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    text { fill: #111; font: 22px Arial, sans-serif; }
    .node { fill: #111; stroke: none; }
  </style>
  ${content}
</svg>
`;
}

function series(pair, suffix) {
  const [first, second] = pair;
  const content = `${source()}
    <path d="M 80 115 V 75 H 140 M 240 75 H 260 M 360 75 H 380 M 480 75 H 560 V 225 H 80 V 185"/>
    ${horizontalComponent("R", 190, 75, "R")}
    ${horizontalComponent(first.kind, 310, 75, first.label)}
    ${horizontalComponent(second.kind, 430, 75, second.label)}`;
  return [
    `series-r-${suffix}`,
    wrap(`Series R ${suffix.toUpperCase()} circuit`, `One resistor and two reactive components connected in series to an AC voltage source.`, content)
  ];
}

function parallel(pair, suffix) {
  const [first, second] = pair;
  const content = `${source()}
    <path d="M 80 115 V 55 H 560 M 80 185 V 245 H 560 M 260 55 V 90 M 260 210 V 245 M 400 55 V 90 M 400 210 V 245 M 520 55 V 90 M 520 210 V 245"/>
    ${verticalComponent("R", 260, 150, "R")}
    ${verticalComponent(first.kind, 400, 150, first.label)}
    ${verticalComponent(second.kind, 520, 150, second.label)}`;
  return [
    `parallel-r-${suffix}`,
    wrap(`Parallel R ${suffix.toUpperCase()} circuit`, `One resistor and two reactive components connected in parallel across an AC voltage source.`, content)
  ];
}

function resistorSeriesPairParallel(pair, suffix) {
  const [first, second] = pair;
  const content = `${source()}
    <path d="M 80 115 V 65 H 160 M 260 65 H 590 V 235 H 80 V 185 M 385 65 V 90 M 385 210 V 235 M 495 65 V 90 M 495 210 V 235"/>
    <circle class="node" cx="300" cy="65" r="6"/><circle class="node" cx="300" cy="235" r="6"/>
    ${horizontalComponent("R", 210, 65, "R")}
    ${verticalComponent(first.kind, 385, 150, first.label)}
    ${verticalComponent(second.kind, 495, 150, second.label)}`;
  return [
    `series-r-parallel-${suffix}`,
    wrap(`R in series with parallel ${suffix.toUpperCase()}`, `A resistor in series with a parallel pair of reactive components, connected to an AC voltage source.`, content)
  ];
}

function resistorParallelPairSeries(pair, suffix) {
  const [first, second] = pair;
  const content = `${source()}
    <path d="M 80 115 V 55 H 560 M 80 185 V 245 H 560 M 280 55 V 100 M 280 200 V 245 M 480 55 V 60 M 480 140 V 160 M 480 240 V 245"/>
    ${verticalComponent("R", 280, 150, "R", 100)}
    ${verticalComponent(first.kind, 480, 100, first.label, 80)}
    ${verticalComponent(second.kind, 480, 200, second.label, 80)}`;
  return [
    `parallel-r-series-${suffix}`,
    wrap(`R in parallel with series ${suffix.toUpperCase()}`, `A resistor in parallel with a series pair of reactive components, connected across an AC voltage source.`, content)
  ];
}

const files = [];
for (const [suffix, pair] of Object.entries(pairs)) {
  files.push(series(pair, suffix), parallel(pair, suffix), resistorSeriesPairParallel(pair, suffix), resistorParallelPairSeries(pair, suffix));
}

for (const [name, svg] of files) {
  fs.writeFileSync(new URL(`${name}.svg`, outputDirectory), svg);
}

console.log(`Generated ${files.length} multi-component circuit assets.`);
