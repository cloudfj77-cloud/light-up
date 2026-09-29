// public/court/orbits.js
// 左下角的原光色环：光学三原色三圆叠加，红+绿+蓝 依次给出 黄 / 品红 / 青，三色齐亮时中心为白。
// 每一位对应当前正在供能的一束原光（1=红、2=绿、4=蓝），圆在点亮时用 CSS 的 screen 混合自然交叠出混色。
function setColorOrbits(mask) {
  const orbits = document.getElementById("orbits");
  if (!orbits) return;
  const value = String(mask | 0);
  if (orbits.dataset.mask === value) return;
  orbits.dataset.mask = value;
  orbits.classList.toggle("lit", (mask | 0) !== 0);
  for (const circle of orbits.querySelectorAll("circle")) circle.classList.toggle("on", (mask & Number(circle.dataset.bit)) !== 0);
}
