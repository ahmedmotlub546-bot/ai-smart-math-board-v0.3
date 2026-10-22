// Single source of truth for every 3D solid: dimensions, ranges, formulas, and live properties.
import { cubeProperties, pyramidProperties, coneProperties, cylinderProperties, sphereProperties } from "./formulas.js";

const PI = "π";
export const UNITS = [
  { id: "units", label: "units" },
  { id: "mm", label: "mm" },
  { id: "cm", label: "cm" },
  { id: "m", label: "m" },
  { id: "in", label: "in" }
];

export const SOLIDS = {
  cube: {
    name: "Cube",
    dims: [{ key: "a", label: "Side", symbol: "a", min: 0.5, max: 4.5, step: 0.05, def: 2.5 }],
    props: d => { const p = cubeProperties(d.a); return { volume: p.volume, surface: p.surfaceArea, lateral: 4 * d.a * d.a, slant: null }; },
    formulas: ["Volume V = a³", "Surface area = 6a²", "Lateral area = 4a²"],
    working: (d, f) => [`V = ${f(d.a)}³`, `Surface = 6 × ${f(d.a)}²`],
    structure: "8 vertices · 12 edges · 6 square faces",
    blurb: "A cube has six congruent square faces. Every edge has the same length a."
  },
  pyramid: {
    name: "Square pyramid",
    dims: [
      { key: "b", label: "Base", symbol: "b", min: 0.5, max: 5, step: 0.05, def: 3 },
      { key: "h", label: "Height", symbol: "h", min: 0.5, max: 6, step: 0.05, def: 3.5 }
    ],
    props: d => { const p = pyramidProperties(d.b, d.h); return { volume: p.volume, surface: p.surfaceArea, lateral: p.lateralArea, slant: p.slantHeight }; },
    formulas: ["Volume V = ⅓ · b² · h", "Slant height l = √(h² + (b/2)²)", "Lateral area = 2 · b · l", "Surface area = b² + 2bl"],
    working: (d, f) => [`V = ⅓ × ${f(d.b)}² × ${f(d.h)}`, `l = √(${f(d.h)}² + ${f(d.b / 2)}²)`],
    structure: "5 vertices · 8 edges · 5 faces (1 square, 4 triangles)",
    blurb: "A square pyramid rises from a square base to a single apex. Its volume is exactly one third of the prism with the same base and height."
  },
  cone: {
    name: "Cone",
    dims: [
      { key: "r", label: "Radius", symbol: "r", min: 0.3, max: 3, step: 0.05, def: 1.6 },
      { key: "h", label: "Height", symbol: "h", min: 0.5, max: 6, step: 0.05, def: 3.5 }
    ],
    props: d => { const p = coneProperties(d.r, d.h); return { volume: p.volume, surface: p.totalArea, lateral: p.curvedArea, slant: p.slantHeight }; },
    formulas: [`Volume V = ⅓ · ${PI} · r² · h`, "Slant height l = √(r² + h²)", `Curved area = ${PI} · r · l`, `Total area = ${PI}r(r + l)`],
    working: (d, f) => [`V = ⅓ × ${PI} × ${f(d.r)}² × ${f(d.h)}`, `l = √(${f(d.r)}² + ${f(d.h)}²)`],
    structure: "1 apex · 1 circular base · 1 curved surface",
    blurb: "A cone tapers from a circular base to an apex. Its slant height l is the hypotenuse of the right triangle formed by r and h."
  },
  cylinder: {
    name: "Cylinder",
    dims: [
      { key: "r", label: "Radius", symbol: "r", min: 0.3, max: 3, step: 0.05, def: 1.5 },
      { key: "h", label: "Height", symbol: "h", min: 0.5, max: 6, step: 0.05, def: 3.2 }
    ],
    props: d => { const p = cylinderProperties(d.r, d.h); return { volume: p.volume, surface: p.totalArea, lateral: p.curvedArea, slant: null }; },
    formulas: [`Volume V = ${PI} · r² · h`, `Curved area = 2${PI}rh`, `Total area = 2${PI}r(r + h)`],
    working: (d, f) => [`V = ${PI} × ${f(d.r)}² × ${f(d.h)}`, `Curved = 2${PI} × ${f(d.r)} × ${f(d.h)}`],
    structure: "2 circular faces · 1 curved surface",
    blurb: "A cylinder is a circle swept along a straight axis. Unrolled, its curved surface is a rectangle 2πr wide and h tall."
  },
  sphere: {
    name: "Sphere",
    dims: [{ key: "r", label: "Radius", symbol: "r", min: 0.3, max: 3, step: 0.05, def: 2 }],
    props: d => { const p = sphereProperties(d.r); return { volume: p.volume, surface: p.surfaceArea, lateral: null, slant: null }; },
    formulas: [`Volume V = ⁴⁄₃ · ${PI} · r³`, `Surface area = 4${PI}r²`],
    working: (d, f) => [`V = ⁴⁄₃ × ${PI} × ${f(d.r)}³`, `Surface = 4 × ${PI} × ${f(d.r)}²`],
    structure: "1 curved surface · no edges or vertices",
    blurb: "Every point on a sphere is the same distance r from its centre."
  }
};

export const SOLID_ORDER = ["cube", "pyramid", "cone", "cylinder", "sphere"];

export function defaultDims(type) {
  return Object.fromEntries(SOLIDS[type].dims.map(d => [d.key, d.def]));
}

export function clampDims(type, dims) {
  const out = {};
  for (const d of SOLIDS[type].dims) {
    const v = Number(dims?.[d.key]);
    out[d.key] = Number.isFinite(v) ? Math.min(d.max, Math.max(d.min, v)) : d.def;
  }
  return out;
}

/** Scale all dimensions together by `factor`, preserving proportions even when a limit is reached. */
export function scaleDims(type, dims, factor) {
  let lo = 0, hi = Infinity;
  for (const d of SOLIDS[type].dims) {
    lo = Math.max(lo, d.min / dims[d.key]);
    hi = Math.min(hi, d.max / dims[d.key]);
  }
  const f = Math.min(hi, Math.max(lo, factor));
  return Object.fromEntries(SOLIDS[type].dims.map(d => [d.key, dims[d.key] * f]));
}

export function solidProperties(type, dims) {
  return SOLIDS[type].props(dims);
}

/** Pull dimension numbers out of a natural-language command such as "cone radius 3 height 5". */
export function parseSolidCommand(text) {
  const s = String(text).toLowerCase();
  const type = /pyramid/.test(s) ? "pyramid" : /cone/.test(s) ? "cone" : /cylinder/.test(s) ? "cylinder" : /sphere|ball/.test(s) ? "sphere" : /cube|cuboid|box/.test(s) ? "cube" : null;
  if (!type) return null;
  const num = re => { const m = s.match(re); return m ? Number(m[1]) : null; };
  const raw = {
    r: num(/\b(?:radius|r)\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/),
    h: num(/\b(?:height|h)\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/),
    a: num(/\b(?:side|edge|length|a)\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/),
    b: num(/\b(?:base|b)\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/)
  };
  const dims = defaultDims(type);
  for (const d of SOLIDS[type].dims) if (raw[d.key] !== null) dims[d.key] = raw[d.key];
  if (type === "pyramid" && raw.b === null && raw.a !== null) dims.b = raw.a;
  return { type, dims: clampDims(type, dims) };
    }
