const KEY="ai-smart-math-board-project-v2";
export class ProjectStore{
 constructor(store){this.store=store;}
 save(){try{const data={schemaVersion:2,exportedAt:new Date().toISOString(),state:this.store.getState()};localStorage.setItem(KEY,JSON.stringify(data));this.toast("Project saved in this browser.");}catch(e){this.toast("Could not save: browser storage may be disabled or full.");}}
 load(){try{const raw=localStorage.getItem(KEY);if(!raw)return this.toast("No saved project found in this browser.");const parsed=JSON.parse(raw);if(!parsed.state)throw new Error("Invalid project file");this.store.replace(parsed.state);window.dispatchEvent(new CustomEvent("mathboard:toast",{detail:"Project loaded."}));window.dispatchEvent(new CustomEvent("mathboard:view",{detail:parsed.state.activeView||"board"}));}catch(e){this.toast("The saved project could not be read.");}}
 importFile(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);const state=data.state||data;if(!state.geometry||!Array.isArray(state.points))throw new Error("Unrecognized project format");this.store.replace(state);this.toast("Project imported.");window.dispatchEvent(new CustomEvent("mathboard:view",{detail:state.activeView||"board"}));}catch(e){this.toast("That JSON file is not a compatible project.");}};reader.readAsText(file);}
 toast(message){window.dispatchEvent(new CustomEvent("mathboard:toast",{detail:message}));}
}
