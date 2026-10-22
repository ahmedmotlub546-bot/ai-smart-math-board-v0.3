export const add = (a,b) => ({x:a.x+b.x,y:a.y+b.y});
export const subtract = (a,b) => ({x:a.x-b.x,y:a.y-b.y});
export const scale = (a,k) => ({x:a.x*k,y:a.y*k});
export const length = a => Math.hypot(a.x,a.y);
export const distance = (a,b) => length(subtract(a,b));
export const midpoint = (a,b) => scale(add(a,b),.5);
export const dot = (a,b) => a.x*b.x+a.y*b.y;
export const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
export const round = (n,places=2) => Number(n.toFixed(places));
export function angleDegrees(a,b,c) {
  const ba=subtract(a,b),bc=subtract(c,b),den=length(ba)*length(bc);
  if(!den)return 0;
  return Math.acos(clamp(dot(ba,bc)/den,-1,1))*180/Math.PI;
}
export function polygonArea(points) {
  let sum=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=a.x*b.y-b.x*a.y;}
  return Math.abs(sum)/2;
}
export function centroid(points) {
  if(!points.length)return{x:0,y:0};
  return points.reduce((s,p)=>({x:s.x+p.x/points.length,y:s.y+p.y/points.length}),{x:0,y:0});
}
