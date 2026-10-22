import { test } from "node:test";
import assert from "node:assert/strict";
import { triangleProperties, cubeProperties, cuboidProperties, cylinderProperties } from "../src/math/formulas.js";
import { distance, polygonArea, angleDegrees } from "../src/math/vector.js";

test("distance between (0,0) and (3,4) is 5",()=>assert.equal(distance({x:0,y:0},{x:3,y:4}),5));
test("right triangle area is 6",()=>assert.equal(polygonArea([{x:0,y:0},{x:4,y:0},{x:0,y:3}]),6));
test("right angle is 90 degrees",()=>assert.equal(Math.round(angleDegrees({x:4,y:0},{x:0,y:0},{x:0,y:3})),90));
test("cube formula returns surface area and volume",()=>{const p=cubeProperties(3);assert.equal(p.surfaceArea,54);assert.equal(p.volume,27);});
test("cuboid volume",()=>assert.equal(cuboidProperties(2,3,4).volume,24));
test("cylinder volume",()=>assert.equal(Math.round(cylinderProperties(2,5).volume),63));
test("triangle interior angles sum to 180",()=>{const p=triangleProperties([{x:0,y:0},{x:4,y:0},{x:0,y:3}]);assert.equal(Math.round(p.angleSum),180);});
import { pyramidProperties, sphereProperties, coneProperties } from "../src/math/formulas.js";
import { SOLIDS, SOLID_ORDER, defaultDims, clampDims, scaleDims, solidProperties, parseSolidCommand } from "../src/math/solids.js";

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !≈ ${b}`);

test("square pyramid: V = b²h/3 and slant height", () => {
  const p = pyramidProperties(6, 4);
  near(p.volume, 48);
  near(p.slantHeight, 5);          // √(4² + 3²)
  near(p.lateralArea, 60);         // 2·6·5
  near(p.surfaceArea, 96);
});
test("cone: V = πr²h/3, slant 5 for r=3,h=4", () => {
  const p = coneProperties(3, 4);
  near(p.volume, 12 * Math.PI);
  near(p.slantHeight, 5);
  near(p.curvedArea, 15 * Math.PI);
});
test("cylinder via solidProperties", () => {
  const p = solidProperties("cylinder", { r: 2, h: 5 });
  near(p.volume, 20 * Math.PI);
  near(p.lateral, 20 * Math.PI);
  near(p.surface, 28 * Math.PI);
});
test("sphere", () => {
  const p = sphereProperties(3);
  near(p.volume, 36 * Math.PI);
  near(p.surfaceArea, 36 * Math.PI);
});
test("every solid has defaults inside its own limits and positive properties", () => {
  for (const id of SOLID_ORDER) {
    const d = defaultDims(id);
    assert.deepEqual(clampDims(id, d), d);
    const p = solidProperties(id, d);
    assert.ok(p.volume > 0 && p.surface > 0, id);
  }
});
test("clampDims keeps values within range and repairs junk", () => {
  assert.equal(clampDims("cube", { a: 99 }).a, 4.5);
  assert.equal(clampDims("cube", { a: -3 }).a, 0.5);
  assert.equal(clampDims("cone", { r: "x" }).r, SOLIDS.cone.dims[0].def);
});
test("pinch scaling preserves proportions, even at a limit", () => {
  const s = scaleDims("cone", { r: 1, h: 2 }, 2);
  near(s.r, 2); near(s.h, 4);
  const big = scaleDims("cone", { r: 1, h: 2 }, 100);   // r hits its max (3) first
  near(big.r, 3); near(big.h, 6);
  const small = scaleDims("cone", { r: 1, h: 2 }, 0.001); // h hits 0.5 → r = 0.25 would be < 0.3 so r limits
  near(small.h / small.r, 2);
});
test("commands: 'cone radius 3 height 5' and 'cylinder' parse", () => {
  const c = parseSolidCommand("draw a cone radius 3 height 5");
  assert.equal(c.type, "cone"); assert.equal(c.dims.r, 3); assert.equal(c.dims.h, 5);
  assert.equal(parseSolidCommand("show a cylinder").type, "cylinder");
  assert.equal(parseSolidCommand("square pyramid base 4 height 2").dims.b, 4);
  assert.equal(parseSolidCommand("draw a triangle"), null);
});
