export class HistoryManager {
  constructor(store, limit = 60) { this.store = store; this.limit = limit; this.undoStack = []; this.redoStack = []; }
  checkpoint() {
    this.undoStack.push(structuredClone(this.store.getState()));
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0;
    this.updateButtons();
  }
  undo() {
    if (!this.undoStack.length) return this.toast("There is nothing to undo yet.");
    this.redoStack.push(structuredClone(this.store.getState()));
    this.store.replace(this.undoStack.pop()); this.updateButtons();
  }
  redo() {
    if (!this.redoStack.length) return this.toast("There is nothing to redo yet.");
    this.undoStack.push(structuredClone(this.store.getState()));
    this.store.replace(this.redoStack.pop()); this.updateButtons();
  }
  updateButtons() {
    const undo = document.getElementById("undoBtn"), redo = document.getElementById("redoBtn");
    if (undo) undo.disabled = !this.undoStack.length;
    if (redo) redo.disabled = !this.redoStack.length;
  }
  toast(message) { window.dispatchEvent(new CustomEvent("mathboard:toast", { detail: message })); }
}
