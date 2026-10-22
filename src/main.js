import "./styles/base.css";
import "./styles/layout.css";
import "./styles/canvas.css";
import "./styles/responsive.css";
import "./styles/solid.css";
import "./styles/touch.css";
import { createStore } from "./core/store.js";
import { HistoryManager } from "./core/history.js";
import { bindUI } from "./ui/bindings.js";
import { BoardController } from "./board/board-controller.js";
import { GeometryController } from "./geometry/geometry-controller.js";
import { CoordinateController } from "./coordinates/coordinate-controller.js";
import { FunctionGraphController } from "./graph/function-controller.js";
import { SolidScene } from "./three/solid-scene.js";
import { ConstructionPlayer } from "./animation/construction-player.js";
import { CommandRouter } from "./commands/command-router.js";
import { renderInspector } from "./ui/inspector.js";
import { bindSolidControls } from "./ui/solid-controls.js";
import { ProjectStore } from "./persistence/project-store.js";
import { exportActiveSVG } from "./persistence/export.js";
import { AIClient } from "./ai/ai-client.js";

const store = createStore();
const history = new HistoryManager(store);
const board = new BoardController(store, history);
const geometry = new GeometryController(store, history);
const coordinates = new CoordinateController(store, history);
const graph = new FunctionGraphController();
const solid = new SolidScene();
const construction = new ConstructionPlayer();
const projects = new ProjectStore(store);
const ai = new AIClient();
const router = new CommandRouter({ store, board, geometry, coordinates, graph, solid, construction, ai });
const ui = bindUI({ store, history, board, geometry, coordinates, graph, solid, construction, projects, router });

// Redraw only what is visible, and at most once per animation frame, so dragging stays smooth on phones.
let refreshQueued = false;
function refresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    const state = store.getState();
    const view = state.activeView;
    if (view === "board") board.render();
    else if (view === "geometry") geometry.render();
    else if (view === "coordinates") coordinates.render();
    if (view === "solid" && state.solid && JSON.stringify(state.solid) !== JSON.stringify(solid.snapshot())) solid.restore(state.solid);
    renderInspector(state, $("inspectorBody"), $("inspectorTitle"));
  });
}
function $(id) { return document.getElementById(id); }

bindSolidControls(solid);
solid.onChange(snapshot => { store.getState().solid = snapshot; refresh(); });
solid.restore(store.getState().solid);

window.addEventListener("mathboard:changed", refresh);
window.addEventListener("resize", () => solid.resize());
window.addEventListener("orientationchange", () => setTimeout(() => solid.resize(), 250));

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    ui.switchView(view);
  });
});

$("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("themeToggle").addEventListener("click", () => { document.body.classList.toggle("light-theme"); solid.applyTheme(document.body.classList.contains("light-theme") ? "light" : "dark"); });
$("undoBtn").addEventListener("click", () => history.undo());
$("redoBtn").addEventListener("click", () => history.redo());
$("clearBtn").addEventListener("click", () => ui.clearActive());
$("fullscreenBtn").addEventListener("click", () => ui.fullscreen());
$("saveBtn").addEventListener("click", () => projects.save());
$("loadBtn").addEventListener("click", () => projects.load());
$("exportBtn").addEventListener("click", () => exportActiveSVG(store.getState().activeView));
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", event => projects.importFile(event.target.files?.[0]));
$("runCommand").addEventListener("click", () => router.runFromInput());
$("commandInput").addEventListener("keydown", event => { if (event.key === "Enter") router.runFromInput(); });
document.querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => router.run(button.dataset.command)));
document.querySelectorAll("[data-tool]").forEach(button => button.addEventListener("click", () => board.setTool(button.dataset.tool)));

$("boardTriangle").addEventListener("click", () => board.addTriangle());
$("boardCircle").addEventListener("click", () => board.addCircle());
$("boardText").addEventListener("click", () => board.addNote());
$("geomTriangle").addEventListener("click", () => geometry.addTriangle());
$("geomEquilateral").addEventListener("click", () => geometry.addEquilateralTriangle());
$("geomSquare").addEventListener("click", () => geometry.addSquare());
$("geomCircle").addEventListener("click", () => geometry.addCircle());
