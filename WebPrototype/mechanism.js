// public/court/mechanism.js
// 五关共用的机关构件：一只低低的烛台，托着一颗目标颜色的晶石。
// 后几关先用了这套形制，前三关现在也改为同一构件，五个关卡的机关读法因此一致。
// 用法：buildMechanism({box,proxy,position,color,stone,trim,parent,baseY,gemRadius,gem})
//   box(size,pos,material) 由调用方提供，决定烛台砌进哪一层的静态几何；
//   proxy(min,max) 由调用方提供，决定碰撞体挂在哪个房间；
//   gem=false 时只造烛台（灯座 / 灯台），不造晶石与灯光。
// 关卡里所有机关晶石的高度：低桌上的晶石，手持灯（约 0.45 米）平照即可命中。
var MECHANISM_Y = 0.52;
// 手持与自由放置时灯具的光束高度，与机关高度保持一致量级。
var CARRY_Y = 0.45;
// 灯具直接放在地上的静止高度（与落灯物理一致）。
var GROUND_Y = 0.3;
// 放下光源时朝向最近可见的机关：不再需要固定灯座，也不必手动微调角度。
// targets 为机关坐标数组，world() 把房间局部坐标换成世界坐标后再做遮挡检查。
function nearestVisibleTarget(position, targets, raycaster, opticalTree, world, range = 24) {
  let best = null, bestDistance = Infinity;
  for (const target of targets) {
    const delta = target.clone().sub(position), distance = delta.length();
    if (distance < 0.05 || distance > range || distance >= bestDistance) continue;
    raycaster.set(world(position), delta.normalize());
    raycaster.far = distance;
    const hit = opticalTree.rayIntersect(raycaster.ray);
    if (hit && hit.distance < distance - 0.08) continue;
    best = target;
    bestDistance = distance;
  }
  return best;
}
function buildMechanism(ctx) {
  const T = three_module_exports;
  const { box, proxy, position, color, stone, trim, parent, baseY = 0, gemRadius = 0.35, gem = true } = ctx;
  // 台面只到晶石下方 0.3 米：放在地上的灯（约 0.3 米）光束要从台面上方掠过，不能被自己的台子挡住
  const topY = position.y - 0.3;
  const shaftHeight = Math.max(0.12, topY - (baseY + 0.16));
  box([0.8, 0.16, 0.8], [position.x, baseY + 0.08, position.z], stone);
  box([0.5, shaftHeight, 0.5], [position.x, baseY + 0.16 + shaftHeight / 2, position.z], trim);
  const ring = new T.Mesh(new T.TorusGeometry(0.34, 0.025, 6, 32), new T.MeshBasicMaterial({ color }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(position.x, topY, position.z);
  parent.add(ring);
  proxy([position.x - 0.38, baseY, position.z - 0.38], [position.x + 0.38, topY + 0.04, position.z + 0.38]);
  if (!gem) return { ring };
  const crystal = new T.Mesh(new T.OctahedronGeometry(gemRadius), new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.12, roughness: 0.3 }));
  crystal.position.copy(position);
  parent.add(crystal);
  const light = new T.PointLight(color, 0.4, 6);
  light.position.copy(position);
  parent.add(light);
  return { ring, crystal, light };
}
