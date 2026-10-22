export class CommandRouter{
 constructor(deps){Object.assign(this,deps);}
 message(text){window.dispatchEvent(new CustomEvent("mathboard:command-message",{detail:text}));}
 toast(text){window.dispatchEvent(new CustomEvent("mathboard:toast",{detail:text}));}
 runFromInput(){const input=document.getElementById("commandInput");this.run(input.value);}
 async run(raw){const command=String(raw||"").trim();if(!command)return;const s=command.toLowerCase();try{
  if(/\b(cube|pyramid|sphere|cylinder|cuboid|3d solid|cone)\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"solid"}));this.solid.setShape(s.match(/cube|pyramid|sphere|cylinder|cone|cuboid/)?.[0]||"cube");this.message("3D lab opened.");return;}
  if(/\b(plot|coordinate|cartesian|point\s*\()/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"coordinates"}));const m=s.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?/);if(m)this.coordinates.plot(Number(m[1]),Number(m[2]));else this.message("Enter x and y values and press Plot point.");return;}
  if(/\b(graph|plot function|y\s*=)/.test(s)){const equation=command.includes("=")?command:document.getElementById("functionInput").value;document.getElementById("functionInput").value=equation;window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"algebra"}));this.graph.plotFromControls();return;}
  if(/\b(triangle|bisector|angle|geometry)\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"geometry"}));if(s.includes("equilateral"))this.geometry.addEquilateralTriangle();else this.geometry.addTriangle();this.message("Triangle created. Drag its vertices and inspect the live measurements.");return;}
  if(/\bcircle\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"geometry"}));this.geometry.addCircle();return;}
  if(/\bsquare\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"geometry"}));this.geometry.addSquare();return;}
  if(/\b(construction|construct)\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:view",{detail:"constructions"}));this.construction.reset();this.construction.play();return;}
  if(/\bclear\b/.test(s)){window.dispatchEvent(new CustomEvent("mathboard:toast",{detail:"Use the clear-canvas button to confirm clearing."}));return;}
  if(/\bhelp\b/.test(s)){this.message("Supported: draw a triangle/circle/square/cube/cone, plot point (3,4), graph y = 2x + 1, or start a construction.");return;}
  const aiResult=await this.ai.ask(command);if(aiResult){this.message(aiResult);return;}
  this.message("I don't recognize that command yet. Try a triangle, circle, square, cube, cone, coordinate point, graph, or construction.");
 }catch(error){this.toast(error.message||"The command could not be completed.");}}
}