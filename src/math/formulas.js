import { distance, angleDegrees, polygonArea, round } from "./vector.js";
export function triangleProperties(points) {
  if(!points || points.length!==3)return null;
  const [A,B,C]=points;
  const sides={AB:distance(A,B),BC:distance(B,C),CA:distance(C,A)};
  const angles={A:angleDegrees(B,A,C),B:angleDegrees(A,B,C),C:angleDegrees(A,C,B)};
  return {sides,angles,perimeter:sides.AB+sides.BC+sides.CA,area:polygonArea(points),angleSum:angles.A+angles.B+angles.C};
}
export function cubeProperties(side) { return {side,faces:6,edges:12,vertices:8,surfaceArea:6*side*side,volume:side**3}; }
export function cuboidProperties(length,breadth,height) { return {length,breadth,height,lateralArea:2*height*(length+breadth),surfaceArea:2*(length*breadth+breadth*height+height*length),volume:length*breadth*height}; }
export function cylinderProperties(radius,height) { return {radius,height,slantHeight:null,curvedArea:2*Math.PI*radius*height,totalArea:2*Math.PI*radius*(radius+height),volume:Math.PI*radius*radius*height}; }
export function coneProperties(radius,height) { const slant=Math.hypot(radius,height);return {radius,height,slantHeight:slant,curvedArea:Math.PI*radius*slant,totalArea:Math.PI*radius*(radius+slant),volume:Math.PI*radius*radius*height/3}; }
export function pyramidProperties(base,height) { const slant=Math.hypot(height,base/2);const lateral=2*base*slant;return {base,height,slantHeight:slant,lateralArea:lateral,surfaceArea:base*base+lateral,volume:base*base*height/3,faces:5,edges:8,vertices:5}; }
export function sphereProperties(radius) { return {radius,surfaceArea:4*Math.PI*radius*radius,volume:4*Math.PI*radius**3/3}; }
export function distance3D(a,b) { return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z); }
export function midpoint2D(a,b) { return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}; }
export function slope(a,b) { return b.x===a.x?null:(b.y-a.y)/(b.x-a.x); }
export function lineEquation(a,b) {
  const m=slope(a,b);
  if(m===null)return `x = ${round(a.x)}`;
  return `y = ${round(m)}x + ${round(a.y-m*a.x)}`;
}
