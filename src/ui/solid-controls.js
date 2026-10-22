import { SOLIDS, SOLID_ORDER, UNITS } from "../math/solids.js";

const $ = id => document.getElementById(id);
const ICONS = {
  cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  pyramid: '<path d="M12 3 3.5 17.5 12 21l8.5-3.5L12 3Z"/><path d="M12 3v18M3.5 17.5 12 14l8.5 3.5"/>',
  cone: '<path d="M12 3 5 17.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5L12 3Z"/><ellipse cx="12" cy="17.5" rx="7" ry="3.2" opacity=".55"/>',
  cylinder: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>',
  sphere: '<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="8.5" ry="3.2" opacity=".6"/><ellipse cx="12" cy="12" rx="3.4" ry="8.5" opacity=".6"/>'
};

/** Builds the shape picker, size sliders and toggles, and keeps them in sync with the scene. */
export function bindSolidControls(scene) {
  const shapes = $("solidShapes");
  shapes.innerHTML = SOLID_ORDER.map(id => `<button class="shape-chip" data-solid="${id}" aria-label="${SOLIDS[id].name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${ICONS[id]}</svg><span>${SOLIDS[id].name.replace("Square ", "")}</span></button>`).join("");
  shapes.addEventListener("click", e => { const b = e.target.closest("[data-solid]"); if (b) scene.setShape(b.dataset.solid); });

  $("solidUnit").innerHTML = UNITS.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
  $("solidUnit").addEventListener("change", e => scene.setUnit(e.target.value));
  $("solidVertices").addEventListener("change", e => scene.setVertices(e.target.checked));
  $("solidEdges").addEventListener("change", e => scene.setEdges(e.target.checked));
  $("solidMarks").addEventListener("change", e => scene.setMarks(e.target.checked));
  $("solidPinch").addEventListener("change", e => scene.setPinchMode(e.target.value));
  $("autoRotate").addEventListener("click", () => scene.toggleAutoRotate());
  $("resetCamera").addEventListener("click", () => scene.resetCamera());

  scene.onChange(snap => {
    $("solidUnit").value = snap.unit;
    $("solidVertices").checked = snap.vertices;
    $("solidEdges").checked = snap.edges;
    $("solidMarks").checked = snap.marks;
    $("solidPinch").value = snap.pinch;
    $("autoRotate").textContent = snap.auto ? "Ⅱ Stop" : "⟳ Auto";
    document.querySelectorAll(".shape-chip").forEach(b => b.classList.toggle("active", b.dataset.solid === snap.shape));
    const dims = snap.dims || {};
    for (const d of SOLIDS[snap.shape].dims) {
      const input = document.getElementById(`dim-${d.key}`);
      if (input && document.activeElement !== input) input.value = dims[d.key];
    }
  });
}
