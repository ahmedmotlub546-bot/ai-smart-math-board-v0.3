const $=id=>document.getElementById(id);
const viewMeta={
 board:["INTERACTIVE CLASSROOM","Make mathematics visible.","Draw, manipulate, animate, and understand.","Smartboard"],
 geometry:["EUCLIDEAN GEOMETRY","Build shapes. Test ideas.","Construct figures and inspect their measurements.","2D Geometry"],
 coordinates:["COORDINATE GEOMETRY","Give every point a place.","Plot points and explore their positions on the Cartesian plane.","Coordinate Geometry"],
 solid:["3D MATHEMATICS LAB","Think in three dimensions.","Rotate a solid, pinch to resize it, and read its volume and surface area.","3D Laboratory"],
 algebra:["FUNCTION EXPLORER","See equations take shape.","Plot supported functions and investigate their curves.","Function Graphs"],
 constructions:["STEP-BY-STEP LEARNING","Watch a construction unfold.","Play, pause, step through, and restart a triangle construction.","Constructions"]
};
export function bindUI({store,history,board,geometry,coordinates,graph,solid,construction,projects,router}){
 function switchView(view){if(!viewMeta[view])return;const s=store.getState();s.activeView=view;store.setState(s);document.querySelectorAll(".nav-link[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));document.querySelectorAll(".view-panel").forEach(p=>p.classList.toggle("active",p.id===`view-${view}`));const [eyebrow,title,subtitle,workspace]=viewMeta[view];$("eyebrow").textContent=eyebrow;$("pageTitle").textContent=title;$("pageSubtitle").textContent=subtitle;$("workspaceTitle").textContent=workspace;if(view==="solid")solid.mount();else solid.pause();if(window.innerWidth<880)$("sidebar").classList.remove("open");window.dispatchEvent(new CustomEvent("mathboard:changed"));}
 function toast(message){const el=$("toast");el.textContent=message;el.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("visible"),2400);}
 function clearActive(){if(!confirm("Clear the objects in the current workspace?"))return;history.checkpoint();const s=store.getState();if(s.activeView==="coordinates")s.points=[];else if(s.activeView==="geometry"||s.activeView==="board")s.geometry={triangle:null,shapes:[],strokes:[],notes:[],showAngles:true};else if(s.activeView==="algebra")$("functionLayer").replaceChildren();store.setState(s);board.render();geometry.render();coordinates.render();toast("Workspace cleared.");}
 async function fullscreen(){const target=$("view-"+store.getState().activeView);try{if(!document.fullscreenElement)await target.requestFullscreen();else await document.exitFullscreen();}catch{toast("Fullscreen is not available in this browser.");}}
 return{switchView,toast,clearActive,fullscreen};
}
