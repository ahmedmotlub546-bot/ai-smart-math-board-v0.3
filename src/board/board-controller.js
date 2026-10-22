import { GeometryController } from "../geometry/geometry-controller.js";
const NS="http://www.w3.org/2000/svg";const $=id=>document.getElementById(id);
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
export class BoardController {
  constructor(store,history){this.store=store;this.history=history;this.tool="select";this.drag=null;this.drawing=false;this.bindCanvas();}
  setTool(tool){this.tool=tool;this.render();document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("active",b.dataset.tool===tool));$("boardHint").textContent=({select:"Drag a vertex to reshape the triangle",pen:"Draw with your mouse or finger",eraser:"Tap a stroke or note to remove it",point:"Click the canvas to add a point"})[tool]||"Select a tool";}
  addTriangle(){this.history.checkpoint();const s=this.store.getState();s.geometry.triangle=[{x:310,y:370,label:"A"},{x:590,y:370,label:"B"},{x:450,y:145,label:"C"}];this.store.setState(s);this.render();}
  addCircle(){this.history.checkpoint();const s=this.store.getState();s.geometry.shapes.push({type:"circle",x:450,y:265,r:95});this.store.setState(s);this.render();}
  addNote(){const value=prompt("Enter a short board note","Angles in a triangle add to 180°");if(!value)return;this.history.checkpoint();const s=this.store.getState();s.geometry.notes.push({x:75,y:70,text:value,color:"#ffbd8b"});this.store.setState(s);this.render();}
  bindCanvas(){
    const svg=$("boardSvg");
    svg.addEventListener("pointerdown",e=>{
      const vertex=e.target.getAttribute("data-vertex");
      if(this.tool==="select"&&vertex!==null&&this.store.getState().geometry.triangle){this.history.checkpoint();this.drag={index:Number(vertex)};svg.setPointerCapture?.(e.pointerId);return;}
      const p=this.toSvg(svg,e);
      if(this.tool==="pen"){
        this.history.checkpoint();
        const s=this.store.getState();
        this.stroke={points:[p],color:"#a9f3d0",width:3};
        s.geometry.strokes.push(this.stroke);
        this.liveEl=el("polyline",{points:`${p.x},${p.y}`,fill:"none",stroke:this.stroke.color,"stroke-width":this.stroke.width,"stroke-linecap":"round","stroke-linejoin":"round"});
        $("boardLayer").append(this.liveEl);
        this.drawing=true;svg.setPointerCapture?.(e.pointerId);
      }else if(this.tool==="point"){
        this.history.checkpoint();const s=this.store.getState();s.geometry.notes.push({x:p.x,y:p.y,text:"•",color:"#a9f3d0"});this.store.setState(s);
      }else if(this.tool==="eraser"){
        const target=e.target.closest("[data-erase]");
        if(!target)return;
        this.history.checkpoint();
        const s=this.store.getState(),i=Number(target.dataset.index);
        if(target.dataset.erase==="stroke")s.geometry.strokes.splice(i,1);else s.geometry.notes.splice(i,1);
        this.store.setState(s);
      }
    });
    svg.addEventListener("pointermove",e=>{
      if(!this.drag&&!this.drawing)return;
      const p=this.toSvg(svg,e);
      if(this.drag){
        const s=this.store.getState(),v=s.geometry.triangle[this.drag.index];
        v.x=Math.max(10,Math.min(890,p.x));v.y=Math.max(10,Math.min(530,p.y));
        this.store.setState(s);
      }else if(this.stroke){
        const last=this.stroke.points.at(-1);
        if(Math.hypot(p.x-last.x,p.y-last.y)<1.5)return;
        this.stroke.points.push(p);
        // Extend the live line directly instead of re-rendering the whole board on every move.
        this.liveEl.setAttribute("points",this.liveEl.getAttribute("points")+` ${p.x},${p.y}`);
      }
    });
    const end=()=>{if(this.drawing)this.store.setState(this.store.getState());this.drag=null;this.drawing=false;this.stroke=null;this.liveEl=null;};
    svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
  }
  toSvg(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const m=svg.getScreenCTM();if(!m)return{x:0,y:0};const q=p.matrixTransform(m.inverse());return{x:q.x,y:q.y};}
  render(){const layer=$("boardLayer");layer.replaceChildren();const s=this.store.getState();s.geometry.strokes.forEach((stroke,i)=>{if(stroke.points.length>1){const line=el("polyline",{points:stroke.points.map(p=>`${p.x},${p.y}`).join(" "),fill:"none",stroke:stroke.color||"#a9f3d0","stroke-width":stroke.width||3,"stroke-linecap":"round","stroke-linejoin":"round","data-erase":"stroke","data-index":i});if(this.tool==="eraser")line.setAttribute("pointer-events","stroke"),line.setAttribute("stroke-width",(stroke.width||3)+14),line.setAttribute("stroke-opacity",".01");layer.append(line);if(this.tool==="eraser")layer.append(el("polyline",{points:line.getAttribute("points"),fill:"none",stroke:stroke.color||"#a9f3d0","stroke-width":stroke.width||3,"stroke-linecap":"round","stroke-linejoin":"round","pointer-events":"none"}));}});s.geometry.notes.forEach((note,i)=>{const t=el("text",{x:note.x,y:note.y,fill:note.color||"var(--text)","font-size":"18","font-family":"inherit","data-erase":"note","data-index":i});t.textContent=note.text;layer.append(t);});const geometry=new GeometryController(this.store,this.history,false);geometry.drawShapes(layer,s.geometry.shapes);if(s.geometry.triangle)geometry.drawTriangle(layer,s.geometry.triangle,s.geometry.showAngles,true);}
}