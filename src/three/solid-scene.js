import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { SOLIDS, UNITS, defaultDims, clampDims, scaleDims, solidProperties } from "../math/solids.js";
import { builders } from "./solid-builders.js";

const $ = id => document.getElementById(id);
const f2 = n => Number(n).toFixed(2);

const PALETTES = {
  dark: { fill: 0x80b8ff, opacity: 0.2, edge: 0xa9f3d0, vertex: 0xa9f3d0, grid: [0x52617a, 0x2c374b], h: 0xa9f3d0, r: 0xffbd8b, l: 0xb8a4ff, a: 0x8ab7ff, d: 0xff8fb1 },
  light: { fill: 0x3d7be0, opacity: 0.16, edge: 0x0f8a62, vertex: 0x0f8a62, grid: [0x9aa8bf, 0xd2dae8], h: 0x0f8a62, r: 0xd2691e, l: 0x6f55d6, a: 0x2f6fd6, d: 0xd6306b }
};
const DASH = 0.14, GAP = 0.09;
const MAX_DPR = 3, MIN_DPR = 1.25;

export class SolidScene {
  constructor() {
    this.type = "cube";
    this.dims = defaultDims("cube");
    this.unit = "units";
    this.showVertices = true;
    this.showEdges = true;
    this.showMarks = true;
    this.pinchMode = "size";
    this.auto = false;
    this.rot = { x: -0.35, y: 0.55 };
    this.vel = { x: 0, y: 0 };
    this.zoom = 1;
    this.listeners = new Set();
    this.pointers = new Map();
    this.pinch = null;
    this.mounted = false;
    this.active = false;
    this.dirtyShape = true;
    this.raf = 0;
    this.labels = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.targetDpr = this.dpr;
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.lastT = 0;
    this.theme = "dark";
  }

  mount() {
    this.active = true;
    if (this.mounted) { this.resize(); this.requestRender(); return; }
    this.host = $("threeMount");
    this.labelLayer = $("threeLabels");
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (error) {
      this.host.insertAdjacentHTML("beforeend", '<p class="gl-fallback">3D needs WebGL, which this device or browser has turned off.</p>');
      return;
    }
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.dpr);
    this.host.prepend(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 7, 5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xbcd4ff, 0.8);
    rim.position.set(-5, -2, -4);
    this.scene.add(rim);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.bindPointer();
    this.bindLifecycle();
    this.mounted = true;
    this.resize();
    this.requestRender();
  }

  pause() { this.active = false; if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }

  bindLifecycle() {
    if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.host); }
    document.addEventListener("visibilitychange", () => { if (document.hidden) { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } } else this.requestRender(); });
    const c = this.renderer.domElement;
    c.addEventListener("webglcontextlost", e => e.preventDefault());
    c.addEventListener("webglcontextrestored", () => { this.dirtyShape = true; this.requestRender(); });
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { const snap = this.snapshot(); this.listeners.forEach(fn => fn(snap)); }
  snapshot() { return { shape: this.type, dims: { ...this.dims }, unit: this.unit, vertices: this.showVertices, edges: this.showEdges, marks: this.showMarks, pinch: this.pinchMode }; }

  restore(snap) {
    if (!snap || !SOLIDS[snap.shape]) return;
    this.type = snap.shape;
    this.dims = clampDims(snap.shape, snap.dims);
    this.unit = UNITS.some(u => u.id === snap.unit) ? snap.unit : "units";
    this.showVertices = snap.vertices !== false;
    this.showEdges = snap.edges !== false;
    this.showMarks = snap.marks !== false;
    this.pinchMode = snap.pinch === "zoom" ? "zoom" : "size";
    this.dirtyShape = true;
    this.emit();
    this.requestRender();
  }

  setShape(input) {
    const type = typeof input === "string" ? input : input?.type;
    if (!SOLIDS[type]) return;
    this.type = type;
    this.dims = clampDims(type, input?.dims || defaultDims(type));
    this.dirtyShape = true;
    this.emit();
    this.requestRender();
  }
  setDim(key, value) {
    if (!(key in this.dims)) return;
    this.dims = clampDims(this.type, { ...this.dims, [key]: value });
    this.dirtyShape = true;
    this.emit();
    this.requestRender();
  }
  setUnit(unit) { this.unit = unit; this.dirtyShape = true; this.emit(); this.requestRender(); }
  setVertices(v) { this.showVertices = v; this.dirtyShape = true; this.emit(); this.requestRender(); }
  setEdges(v) { this.showEdges = v; this.dirtyShape = true; this.emit(); this.requestRender(); }
  setMarks(v) { this.showMarks = v; this.dirtyShape = true; this.emit(); this.requestRender(); }
  setPinchMode(mode) { this.pinchMode = mode; this.emit(); }
  resetSize() { this.dims = defaultDims(this.type); this.dirtyShape = true; this.emit(); this.requestRender(); }
  toggleAutoRotate() { this.auto = !this.auto; this.requestRender(); return this.auto; }
  resetCamera() { this.rot = { x: -0.35, y: 0.55 }; this.vel = { x: 0, y: 0 }; this.zoom = 1; this.requestRender(); }
  applyTheme(theme) { this.theme = theme; this.dirtyShape = true; this.requestRender(); }

  resize() {
    if (!this.renderer || !this.host) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.edgeMat?.resolution.set(w, h);
    this.markMat?.resolution.set(w, h);
    this.requestRender();
  }

  bindPointer() {
    const c = this.renderer.domElement;
    const surface = this.host;
    surface.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      surface.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.vel = { x: 0, y: 0 };
      if (this.pointers.size === 2) this.beginPinch();
      this.interacting = true;
      this.requestRender();
    });
    surface.addEventListener("pointermove", e => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 1) {
        const k = 0.008;
        this.rot.y += dx * k;
        this.rot.x = Math.max(-1.45, Math.min(1.45, this.rot.x + dy * k));
        this.vel = { x: dy * k, y: dx * k };
      } else if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        this.applyPinch(dist / this.pinch.start);
      }
      this.requestRender();
    });
    const end = e => {
      if (!this.pointers.delete(e.pointerId)) return;
      this.pinch = null;
      if (this.pointers.size === 1) this.vel = { x: 0, y: 0 };
      if (this.pointers.size === 0) this.interacting = false;
      this.requestRender();
    };
    surface.addEventListener("pointerup", end);
    surface.addEventListener("pointercancel", end);
    surface.addEventListener("wheel", e => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      if (e.ctrlKey && this.pinchMode === "size") this.resizeBy(factor);
      else { this.zoom = Math.max(0.45, Math.min(2.2, this.zoom / factor)); }
      this.requestRender();
    }, { passive: false });
    c.style.touchAction = "none";
    surface.style.touchAction = "none";
  }

  beginPinch() {
    const [a, b] = [...this.pointers.values()];
    this.pinch = { start: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)), dims: { ...this.dims }, zoom: this.zoom };
    this.vel = { x: 0, y: 0 };
  }
  applyPinch(ratio) {
    if (this.pinchMode === "size") {
      this.dims = scaleDims(this.type, this.pinch.dims, ratio);
      this.dirtyShape = true;
      this.emit();
    } else {
      this.zoom = Math.max(0.45, Math.min(2.2, this.pinch.zoom / ratio));
    }
  }
  resizeBy(factor) {
    this.dims = scaleDims(this.type, this.dims, factor);
    this.dirtyShape = true;
    this.emit();
  }

  rebuild() {
    this.dirtyShape = false;
    const pal = PALETTES[this.theme] || PALETTES.dark;
    this.disposeGroup();
    const b = builders[this.type](this.dims);
    const group = new THREE.Group();

    group.add(new THREE.Mesh(b.geometry, new THREE.MeshStandardMaterial({ color: pal.fill, transparent: true, opacity: pal.opacity, roughness: 0.35, side: THREE.DoubleSide, depthWrite: false })));

    if (this.showEdges) {
      const geo = new LineSegmentsGeometry();
      if (b.edges) geo.setPositions(b.edges);
      else geo.fromEdgesGeometry(new THREE.EdgesGeometry(b.geometry, b.edgeThreshold));
      this.edgeMat = new LineMaterial({ color: pal.edge, linewidth: 2.2, transparent: true, opacity: 0.95 });
      this.edgeMat.resolution.set(this.w || 1, this.h || 1);
      group.add(new LineSegments2(geo, this.edgeMat));
    }

    if (this.showVertices) {
      const dotGeo = new THREE.SphereGeometry(0.055, 14, 10), dotMat = new THREE.MeshBasicMaterial({ color: pal.vertex, depthTest: false });
      b.vertices.forEach(v => { const dot = new THREE.Mesh(dotGeo, dotMat); dot.position.copy(v.p); dot.renderOrder = 3; group.add(dot); });
    }

    if (this.showMarks) {
      const pos = [], col = [];
      b.marks.forEach(m => { pos.push(m.a.x, m.a.y, m.a.z, m.b.x, m.b.y, m.b.z); const c = new THREE.Color(pal[m.kind]); col.push(c.r, c.g, c.b, c.r, c.g, c.b); });
      const geo = new LineSegmentsGeometry();
      geo.setPositions(pos); geo.setColors(col);
      this.markMat = new LineMaterial({ vertexColors: true, linewidth: 2.4, dashed: true, dashSize: DASH, gapSize: GAP, depthTest: false, transparent: true });
      this.markMat.resolution.set(this.w || 1, this.h || 1);
      const lines = new LineSegments2(geo, this.markMat);
      lines.computeLineDistances();
      lines.renderOrder = 2;
      group.add(lines);
    }

    this.root.add(group);
    this.group = group;
    this.built = b;

    if (this.grid) { this.scene.remove(this.grid); this.grid.geometry.dispose(); this.grid.material.dispose(); }
    this.grid = new THREE.GridHelper(14, 28, pal.grid[0], pal.grid[1]);
    this.grid.position.y = b.bottom - 0.02;
    this.scene.add(this.grid);

    this.buildLabels(b);
    this.updateMetrics();
  }

  disposeGroup() {
    if (!this.group) return;
    this.root.remove(this.group);
    this.group.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    this.group = null;
  }

  buildLabels(b) {
    const u = this.unit === "units" ? "" : ` ${this.unit}`;
    const list = [];
    if (this.showMarks) b.marks.forEach(m => { if (m.labelled === false || !m.symbol) return; list.push({ kind: m.kind, text: `${m.symbol} = ${f2(m.value)}${u}`, p: m.a.clone().lerp(m.b, m.t ?? 0.5) }); });
    if (this.showVertices) b.vertices.forEach(v => list.push({ kind: "v", text: v.label, p: v.p.clone(), vertex: true }));
    while (this.labels.length > list.length) this.labels.pop().el.remove();
    while (this.labels.length < list.length) { const el = document.createElement("span"); this.labelLayer.append(el); this.labels.push({ el, text: "", kind: "" }); }
    list.forEach((item, i) => {
      const l = this.labels[i];
      Object.assign(l, { p: item.p, vertex: !!item.vertex });
      if (l.text !== item.text) { l.el.textContent = item.text; l.text = item.text; }
      if (l.kind !== item.kind) { l.el.className = `solid-label k-${item.kind}`; l.kind = item.kind; }
    });
  }

  updateMetrics() {
    const props = solidProperties(this.type, this.dims);
    const unit = this.unit === "units" ? "units" : this.unit;
    const def = SOLIDS[this.type];
    $("solidVolume").textContent = `${f2(props.volume)} ${unit}³`;
    $("solidSurface").textContent = `${f2(props.surface)} ${unit}²`;
    $("solidLateral").textContent = props.lateral === null ? "—" : `${f2(props.lateral)} ${unit}²`;
    $("solidDimsMetric").textContent = def.dims.map(d => `${d.symbol} ${f2(this.dims[d.key])}`).join(" · ");
  }

  requestRender() {
    if (!this.active || !this.mounted || this.raf || document.hidden) return;
    this.raf = requestAnimationFrame(t => this.frame(t));
  }

  frame(t) {
    this.raf = 0;
    if (!this.active) return;
    const dt = this.lastT ? t - this.lastT : 16;
    this.lastT = t;
    if (this.dirtyShape) this.rebuild();

    let moving = this.interacting || this.auto;
    if (this.auto && !this.interacting) this.rot.y += 0.006;
    if (!this.interacting && (Math.abs(this.vel.x) > 0.0004 || Math.abs(this.vel.y) > 0.0004)) {
      this.rot.x = Math.max(-1.45, Math.min(1.45, this.rot.x + this.vel.x));
      this.rot.y += this.vel.y;
      this.vel.x *= 0.92; this.vel.y *= 0.92;
      moving = true;
    }

    this.root.rotation.set(this.rot.x, this.rot.y, 0);
    const aspect = this.camera.aspect;
    const base = 11.5 / (aspect < 1 ? 0.55 + 0.45 * aspect : 1);
    const dist = base * this.zoom;
    this.camera.position.set(0.42 * dist, 0.34 * dist, 0.84 * dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
    this.placeLabels();

    this.governResolution(dt, moving);
    if (moving) this.requestRender();
  }

  placeLabels() {
    if (!this.labels.length) return;
    const v = new THREE.Vector3(), c = new THREE.Vector3(0, 0, 0).applyMatrix4(this.root.matrixWorld).project(this.camera);
    const hw = this.w / 2, hh = this.h / 2;
    this.root.updateMatrixWorld();
    for (const l of this.labels) {
      v.copy(l.p).applyMatrix4(this.root.matrixWorld).project(this.camera);
      let x = v.x * hw + hw, y = -v.y * hh + hh;
      if (l.vertex) { const ox = v.x - c.x, oy = v.y - c.y, len = Math.hypot(ox, oy) || 1; x += (ox / len) * 14; y -= (oy / len) * 14; }
      l.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%)`;
      l.el.style.visibility = v.z < 1 ? "visible" : "hidden";
    }
  }

  governResolution(dt, moving) {
    if (!moving || dt > 250) { this.slowFrames = this.fastFrames = 0; return; }
    if (dt > 26) { this.slowFrames++; this.fastFrames = 0; } else if (dt < 19) { this.fastFrames++; this.slowFrames = 0; }
    if (this.slowFrames > 12 && this.dpr > MIN_DPR) { this.dpr = Math.max(MIN_DPR, this.dpr * 0.8); this.slowFrames = 0; this.resize(); }
    else if (this.fastFrames > 150 && this.dpr < this.targetDpr) { this.dpr = Math.min(this.targetDpr, this.dpr * 1.15); this.fastFrames = 0; this.resize(); }
  }
}
