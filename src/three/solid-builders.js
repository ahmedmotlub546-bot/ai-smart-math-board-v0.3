// Pure geometry + measurement-mark builders for each solid. Coordinates are centred on the origin.
import * as THREE from "three";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SEG = 64;

/** Each builder returns { geometry, edges:[x,y,z,...] | null, vertices:[{p,label}], marks:[{a,b,kind,symbol,value,labelled}], bottom } */
export const builders = {
  cube(d) {
    const a = d.a, h = a / 2;
    const geometry = new THREE.BoxGeometry(a, a, a);
    const corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    return {
      geometry, edgeThreshold: 20, bottom: -h,
      vertices: corners.map((c, i) => ({ p: V(c[0] * h, c[1] * h, c[2] * h), label: String.fromCharCode(65 + i) })),
      marks: [
        { a: V(-h, -h, h), b: V(h, -h, h), kind: "a", symbol: "a", value: a },
        { a: V(-h, -h, h), b: V(-h, h, h), kind: "a", symbol: "a", value: a, labelled: false },
        { a: V(-h, -h, h), b: V(-h, -h, -h), kind: "a", symbol: "a", value: a, labelled: false },
        { a: V(-h, -h, -h), b: V(h, h, h), kind: "d", symbol: "d", value: a * Math.sqrt(3) }
      ]
    };
  },

  pyramid(d) {
    const b = d.b, H = d.h, hb = b / 2, y0 = -H / 2, y1 = H / 2;
    const apex = V(0, y1, 0);
    const base = [V(-hb, y0, hb), V(hb, y0, hb), V(hb, y0, -hb), V(-hb, y0, -hb)];
    const pos = [], idx = [];
    const tri = (p, q, r) => { pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z); };
    for (let i = 0; i < 4; i++) tri(base[i], base[(i + 1) % 4], apex);
    tri(base[0], base[3], base[1]); tri(base[3], base[2], base[1]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.computeVertexNormals();
    const slant = Math.hypot(H, hb);
    return {
      geometry, edgeThreshold: 5, bottom: y0,
      vertices: [...base.map((p, i) => ({ p, label: "ABCD"[i] })), { p: apex, label: "V" }],
      marks: [
        { a: V(0, y0, 0), b: apex, kind: "h", symbol: "h", value: H, t: 0.8 },
        { a: apex, b: V(0, y0, hb), kind: "l", symbol: "l", value: slant, t: 0.62 },
        { a: V(0, y0, 0), b: V(0, y0, hb), kind: "a", symbol: "", value: hb, labelled: false },
        { a: base[0], b: base[1], kind: "a", symbol: "b", value: b }
      ]
    };
  },

  cone(d) {
    const r = d.r, H = d.h, y0 = -H / 2, y1 = H / 2;
    const geometry = new THREE.ConeGeometry(r, H, SEG, 1);
    return {
      geometry, edgeThreshold: 30, bottom: y0,
      vertices: [{ p: V(0, y1, 0), label: "V" }, { p: V(0, y0, 0), label: "O" }],
      marks: [
        { a: V(0, y0, 0), b: V(0, y1, 0), kind: "h", symbol: "h", value: H, t: 0.8 },
        { a: V(0, y0, 0), b: V(r, y0, 0), kind: "r", symbol: "r", value: r },
        { a: V(0, y1, 0), b: V(r, y0, 0), kind: "l", symbol: "l", value: Math.hypot(r, H), t: 0.62 }
      ]
    };
  },

  cylinder(d) {
    const r = d.r, H = d.h, y0 = -H / 2, y1 = H / 2;
    const geometry = new THREE.CylinderGeometry(r, r, H, SEG, 1);
    return {
      geometry, edgeThreshold: 30, bottom: y0,
      vertices: [{ p: V(0, y1, 0), label: "O₂" }, { p: V(0, y0, 0), label: "O₁" }],
      marks: [
        { a: V(0, y0, 0), b: V(0, y1, 0), kind: "h", symbol: "h", value: H },
        { a: V(0, y1, 0), b: V(r, y1, 0), kind: "r", symbol: "r", value: r },
        { a: V(0, y0, 0), b: V(-r, y0, 0), kind: "r", symbol: "r", value: r, labelled: false }
      ]
    };
  },

  sphere(d) {
    const r = d.r;
    const geometry = new THREE.SphereGeometry(r, 48, 32);
    const edges = [];
    const ring = fn => { for (let i = 0; i < SEG; i++) { const t0 = (i / SEG) * Math.PI * 2, t1 = ((i + 1) / SEG) * Math.PI * 2; edges.push(...fn(t0), ...fn(t1)); } };
    ring(t => [r * Math.cos(t), r * Math.sin(t), 0]);
    ring(t => [r * Math.cos(t), 0, r * Math.sin(t)]);
    ring(t => [0, r * Math.cos(t), r * Math.sin(t)]);
    return {
      geometry, edges, bottom: -r,
      vertices: [{ p: V(0, 0, 0), label: "O" }],
      marks: [
        { a: V(0, 0, 0), b: V(r, 0, 0), kind: "r", symbol: "r", value: r },
        { a: V(-r, 0, 0), b: V(r, 0, 0), kind: "d", symbol: "d", value: 2 * r, labelled: false }
      ]
    };
  }
};
