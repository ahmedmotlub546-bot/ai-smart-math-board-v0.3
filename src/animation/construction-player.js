const NS="http://www.w3.org/2000/svg";const $=id=>document.getElementById(id);const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};const txt=(g,x,y,v,attrs={})=>{const n=el("text",{x,y,fill:"var(--text)","font-size":"14","font-family":"inherit",...attrs});n.textContent=v;g.append(n);};
const steps=[
 {caption:"Step 1 — Mark the base endpoints A and B.",draw:g=>{g.append(el("circle",{cx:290,cy:370,r:6,fill:"#a9f3d0"}),el("circle",{cx:610,cy:370,r:6,fill:"#a9f3d0"}));txt(g,275,390,"A");txt(g,620,390,"B");}},
 {caption:"Step 2 — Draw a ray from A toward the chosen apex.",draw:g=>g.append(el("line",{x1:290,y1:370,x2:450,y2:140,stroke:"#8ab7ff","stroke-width":"2.5","stroke-dasharray":"7 5"}))},
 {caption:"Step 3 — Draw the second side from B to C.",draw:g=>g.append(el("line",{x1:610,y1:370,x2:450,y2:140,stroke:"#8ab7ff","stroke-width":"2.5","stroke-dasharray":"7 5"}))},
 {caption:"Step 4 — Join A to B. The triangle is complete.",draw:g=>{g.append(el("polygon",{points:"290,370 610,370 450,140",fill:"#8ab7ff","fill-opacity":".13",stroke:"#a9f3d0","stroke-width":"3"}));txt(g,450,125,"C");txt(g,450,400,"△ABC",{"text-anchor":"middle",fill:"#a9f3d0","font-size":"17"});}}
];
export class ConstructionPlayer{
 constructor(){this.step=0;this.timer=null;this.speed=1;}
 play(){if(this.timer)return;this.render(this.step);this.timer=setInterval(()=>{if(this.step>=steps.length-1){this.pause();return;}this.next();},1200/this.speed);}
 pause(){if(this.timer)clearInterval(this.timer);this.timer=null;}
 next(){this.step=Math.min(steps.length-1,this.step+1);this.render(this.step);if(this.step===steps.length-1)this.pause();}
 reset(){this.pause();this.step=0;this.render(this.step);}
 setSpeed(speed){this.speed=speed;if(this.timer){this.pause();this.play();}}
 render(step){this.step=Math.max(0,Math.min(steps.length-1,step));const layer=$("constructionLayer");layer.replaceChildren();steps.slice(0,this.step+1).forEach(s=>s.draw(layer));$("constructionCaption").textContent=steps[this.step].caption;}
}