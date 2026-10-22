const initialState = {
  activeView: "board",
  tool: "select",
  geometry: { triangle: null, shapes: [], strokes: [], notes: [], showAngles: true },
  points: [],
  graph: { equation: "y = 2x + 1", xMin: -10, xMax: 10 },
  solid: { shape: "cube", dims: { a: 2.5 }, unit: "units", vertices: true, edges: true, marks: true, pinch: "size" },
  selected: null
};

export function createStore(seed = initialState) {
  let state = structuredClone(seed);
  const listeners = new Set();
  return {
    getState: () => state,
    setState(next, eventName = "changed") {
      state = typeof next === "function" ? next(state) : { ...state, ...next };
      listeners.forEach(fn => fn(state));
      window.dispatchEvent(new CustomEvent(`mathboard:${eventName}`, { detail: state }));
    },
    patch(path, value) {
      const next = structuredClone(state);
      const keys = path.split(".");
      let cursor = next;
      for (const key of keys.slice(0, -1)) cursor = cursor[key];
      cursor[keys.at(-1)] = value;
      this.setState(next);
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    replace(data) { state = { ...structuredClone(initialState), ...data }; this.setState(state); }
  };
}
