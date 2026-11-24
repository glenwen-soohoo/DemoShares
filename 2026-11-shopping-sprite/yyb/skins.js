/*
  圓圓寶材質試做：同一個 3D 模型，換表面材質與擺放環境，讓它看起來像實體公仔。
  - 材質：plastic 軟膠公仔、felt 羊毛氈、ceramic 陶瓷、clay 黏土、base 目前版本（對照用）
  - 實體感來自三件事：環境反光（RoomEnvironment）、落地的真實陰影、表面細微質地（程式產生的凹凸貼圖）
  - 只換角色本體（身體、手套、斗笠、骨架、logo），道具維持原本材質
*/
import { THREE, baseMaterials } from './yyb.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PI = Math.PI;

/* ---------- 程式產生的高度圖 → 凹凸（法線）貼圖，可無縫重複 ---------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// 在 3 倍大的畫布上，每個元素畫 9 次（上下左右錯開一個圖寬），模糊後裁中間，就能無縫重複
// 每一層先在不模糊的畫布上畫完，整層只模糊一次再疊上去（逐筆套模糊會慢到卡住頁面）
function heightCanvas(kind, S = 256, seed = 7) {
  const big = document.createElement('canvas'); big.width = big.height = S * 3;
  const g = big.getContext('2d'), R = rng(seed);
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S * 3, S * 3);
  const layer = (blur, draw) => {
    const L = document.createElement('canvas'); L.width = L.height = S * 3; const lg = L.getContext('2d');
    const wrap = fn => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) fn(i * S, j * S); };
    draw({
      dot: (x, y, r, v, a) => { lg.fillStyle = `rgba(${v},${v},${v},${a})`; wrap((ox, oy) => { lg.beginPath(); lg.arc(x + ox, y + oy, r, 0, PI * 2); lg.fill(); }); },
      line: (x, y, ang, len, v, a, w) => { lg.strokeStyle = `rgba(${v},${v},${v},${a})`; lg.lineWidth = w; wrap((ox, oy) => { lg.beginPath(); lg.moveTo(x + ox, y + oy); lg.lineTo(x + ox + Math.cos(ang) * len, y + oy + Math.sin(ang) * len); lg.stroke(); }); },
      arc: (cx, cy, r, a0, a1, v, a, w) => { lg.strokeStyle = `rgba(${v},${v},${v},${a})`; lg.lineWidth = w; wrap((ox, oy) => { lg.beginPath(); lg.arc(cx + ox, cy + oy, r, a0, a1); lg.stroke(); }); },
    });
    g.filter = `blur(${blur}px)`; g.drawImage(L, 0, 0); g.filter = 'none';
  };
  if (kind === 'clay') {
    layer(10, d => { for (let i = 0; i < 26; i++) d.dot(R() * S, R() * S, 12 + R() * 22, R() < 0.5 ? 100 : 160, 0.5); });            // 手捏的淺凹凸
    layer(1, d => { for (let i = 0; i < 2600; i++) d.dot(R() * S, R() * S, 0.6 + R() * 1.2, R() < 0.5 ? 70 : 190, 0.55); });         // 細顆粒
    layer(0.6, d => { for (let i = 0; i < 6; i++) { const cx = R() * S, cy = R() * S; for (let k = 0; k < 7; k++) d.arc(cx, cy, 6 + k * 3.2, 0.3, 2.6, 105, 0.35, 1.2); } }); // 淡淡的指紋
  }
  if (kind === 'felt') {
    layer(3, d => { for (let i = 0; i < 60; i++) d.dot(R() * S, R() * S, 6 + R() * 14, R() < 0.5 ? 90 : 170, 0.5); });
    layer(0.4, d => { for (let i = 0; i < 4000; i++) d.line(R() * S, R() * S, R() * PI * 2, 3 + R() * 9, R() < 0.5 ? 40 : 220, 0.45, 0.7 + R() * 0.6); }); // 纖維
  }
  if (kind === 'ceramic') layer(26, d => { for (let i = 0; i < 18; i++) d.dot(R() * S, R() * S, 30 + R() * 40, R() < 0.5 ? 110 : 150, 0.6); }); // 釉面微微起伏
  if (kind === 'plastic') layer(18, d => { for (let i = 0; i < 10; i++) d.dot(R() * S, R() * S, 30 + R() * 40, R() < 0.5 ? 120 : 136, 0.6); });  // 幾乎平滑
  const out = document.createElement('canvas'); out.width = out.height = S;
  out.getContext('2d').drawImage(big, S, S, S, S, 0, 0, S, S);
  return out;
}
function normalFromHeight(hcv, strength) {
  const S = hcv.width, src = hcv.getContext('2d').getImageData(0, 0, S, S).data;
  const out = document.createElement('canvas'); out.width = out.height = S;
  const og = out.getContext('2d'), img = og.createImageData(S, S), d = img.data;
  const h = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    let nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * S + x) * 4; d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  og.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// 羊毛氈的絨毛：透明度貼圖，畫成稀疏的纖維
function fuzzAlpha(S = 256, seed = 3) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), R = rng(seed);
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) { const x = R() * S, y = R() * S, a = R() * PI * 2, L = 2 + R() * 7; g.strokeStyle = `rgba(255,255,255,${0.35 + R() * 0.5})`; g.lineWidth = 0.6 + R() * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ---------- 材質定義 ---------- */
export const SKINS = {
  base: { name: '目前版本', note: '對照用：沒有環境反光、沒有表面質地的原始模型' },
  plastic: { name: '塑膠（軟膠公仔）', note: '表面平滑、有一層柔和的光澤，像公仔店的軟膠玩偶' },
  felt: { name: '羊毛氈', note: '完全不反光，表面有纖維與細絨毛，邊緣毛毛的' },
  ceramic: { name: '陶瓷', note: '上釉後的高光澤，能看到環境的反光，釉面微微起伏' },
  clay: { name: '黏土', note: '霧面、有細顆粒與淡淡的手捏痕跡，像手作黏土公仔' },
};
const cache = {};
function skinMaterials(kind) {
  if (cache[kind]) return cache[kind];
  const b = baseMaterials();
  const roles = { body: b.body, glove: b.glove, hat: b.hat, rib: b.rib, logo: b.logo };
  const out = {};
  const nm = { clay: [heightCanvas('clay'), 5], felt: [heightCanvas('felt'), 4.5], ceramic: [heightCanvas('ceramic'), 2.2], plastic: [heightCanvas('plastic'), 1.2] }[kind];
  const normalMap = nm ? normalFromHeight(nm[0], nm[1]) : null;
  if (normalMap) normalMap.repeat.set(kind === 'felt' ? 3 : 2, kind === 'felt' ? 3 : 2);
  for (const r in roles) {
    const src = roles[r];
    const p = {
      color: src.color.clone(), map: src.map || null, transparent: src.transparent, alphaTest: src.alphaTest, side: src.side,
      normalMap, normalScale: new THREE.Vector2(1, 1),
    };
    let m;
    if (kind === 'plastic') m = new THREE.MeshPhysicalMaterial({ ...p, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, normalScale: new THREE.Vector2(0.3, 0.3) });
    if (kind === 'ceramic') m = new THREE.MeshPhysicalMaterial({ ...p, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, normalScale: new THREE.Vector2(0.25, 0.25) });
    if (kind === 'clay') m = new THREE.MeshPhysicalMaterial({ ...p, roughness: 1, metalness: 0, specularIntensity: 0.25, normalScale: new THREE.Vector2(1.0, 1.0) });
    if (kind === 'felt') {
      const c = src.color.clone(); if (!src.map) c.offsetHSL(0, -0.08, 0.04);
      m = new THREE.MeshPhysicalMaterial({ ...p, color: c, roughness: 1, metalness: 0, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffffff).lerp(c, 0.4), normalScale: new THREE.Vector2(1.1, 1.1) });
    }
    // 環境反光的強度：陶瓷最亮、羊毛氈最弱；太強會把品牌色沖淡
    m.envMapIntensity = { plastic: 0.7, ceramic: 0.9, clay: 0.3, felt: 0.35 }[kind];
    // 拍成相片的亮度壓縮會讓顏色變淡，先把非貼圖的顏色稍微加飽和補回來
    if (!m.map) m.color.offsetHSL(0, 0.06, -0.02);
    out[r] = m;
  }
  out._src = roles;
  cache[kind] = out;
  return out;
}
const FUZZ = { alpha: null };
// 把材質套到一隻圓圓寶身上（只換角色本體）
export function applySkin(yyb, kind) {
  if (kind === 'base') return;
  const mats = skinMaterials(kind), src = mats._src;
  const shells = [];
  yyb.group.traverse(o => {
    if (!o.isMesh) return;
    for (const r in src) if (o.material === src[r]) {
      o.material = mats[r]; o.castShadow = true; o.receiveShadow = true;
      if (kind === 'felt' && (r === 'body' || r === 'hat' || r === 'glove' || r === 'logo')) shells.push([o, mats[r], r]);
    }
  });
  // 羊毛氈：在表面外加兩層半透明的絨毛殼，邊緣看起來毛毛的
  if (kind === 'felt') {
    FUZZ.alpha = FUZZ.alpha || fuzzAlpha();
    // 身體那顆球的正面是 logo：身體的絨毛只包背面半球，正面改由 logo 自己帶 logo 顏色的絨毛，才不會把 logo 蓋成灰色
    const backHalf = new THREE.SphereGeometry(1, 48, 32, PI, PI);
    const isBodyBall = o => o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === 1 && o.scale.x === 1 && o.parent && Math.abs(o.parent.scale.x - 0.98) < 1e-3;
    for (const [o, base, role] of shells) {
      const geo = role === 'body' && isBodyBall(o) ? backHalf : o.geometry;
      [1.018, 1.036].forEach((s, i) => {
        const fm = new THREE.MeshStandardMaterial({ color: role === 'logo' ? 0xffffff : base.color.clone().offsetHSL(0, -0.05, 0.08), map: base.map || null, alphaMap: FUZZ.alpha, transparent: true, depthWrite: false, roughness: 1, side: THREE.DoubleSide, opacity: i ? 0.45 : 0.7 });
        const sh = new THREE.Mesh(geo, fm); sh.scale.setScalar(s); sh.renderOrder = 2 + i; o.add(sh);
      });
    }
    FUZZ.alpha.repeat.set(4, 4);
  }
  yyb.group.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  yyb.shadow.visible = false; // 改用真實陰影
}

/* ---------- 擺放環境：背景、地面、燈光、陰影 ---------- */
function groundTexture(kind) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), R = rng(11);
  if (kind === 'felt') { // 藍色羊毛氈底
    g.fillStyle = '#4fa6d8'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + R() * 0.14})`; g.beginPath(); g.ellipse(R() * S, R() * S, 30 + R() * 90, 10 + R() * 30, R() * PI, 0, PI * 2); g.fill(); }
    for (let i = 0; i < 6000; i++) { g.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(30,90,150,.18)'; g.lineWidth = 1; const x = R() * S, y = R() * S, a = R() * PI * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
  }
  if (kind === 'ceramic') { // 木頭切片
    g.fillStyle = '#d9b98f'; g.fillRect(0, 0, S, S);
    for (let r = 8; r < S * 0.72; r += 5 + R() * 6) { g.strokeStyle = `rgba(150,105,60,${0.15 + R() * 0.25})`; g.lineWidth = 1 + R() * 1.5; g.beginPath(); g.ellipse(S / 2 + R() * 3, S / 2 + R() * 3, r, r * (0.96 + R() * 0.06), 0, 0, PI * 2); g.stroke(); }
  }
  if (kind === 'clay') { // 竹蓆
    g.fillStyle = '#d9a86c'; g.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += 22) { g.fillStyle = `rgba(${150 + R() * 40},${100 + R() * 30},50,.35)`; g.fillRect(x, 0, 2, S); g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(x + 4, 0, 8, S); }
    for (let y = 0; y < S; y += 128) { g.fillStyle = 'rgba(255,245,225,.5)'; g.fillRect(0, y, S, 2); g.fillRect(0, y + 5, S, 1); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
export function setupRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
export function makeStudio(renderer, kind) {
  const scene = new THREE.Scene();
  const bg = { base: '#ffffff', plastic: '#e9eaee', felt: '#5aaedd', ceramic: '#d9dadc', clay: '#cfa978' }[kind];
  scene.background = new THREE.Color(bg);
  // 地面往遠處淡進背景色，看不到地平線，像攝影棚的無縫背景
  if (kind !== 'base') scene.fog = new THREE.Fog(bg, 9, 17);
  if (kind === 'base') { // 目前版本：沿用原本的平光場景
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfb4, 1.25));
    const k = new THREE.DirectionalLight(0xffffff, 1.9); k.position.set(-3, 5, 6); scene.add(k);
    const f = new THREE.DirectionalLight(0xfff4e0, 0.55); f.position.set(4, 1.5, 3); scene.add(f);
    return scene;
  }
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  // 地面、背景這些非角色物件也會吃環境光，一起調弱，背景色才不會被洗白
  scene.userData.envDim = 0.5;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b4, 0.25));
  const warm = kind === 'clay' ? 0xffe2b8 : 0xffffff;
  const key = new THREE.DirectionalLight(warm, kind === 'felt' ? 1.5 : 1.8); key.position.set(-3.5, 6, 4.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -2, near: 0.5, far: 20 }); key.shadow.camera.updateProjectionMatrix();
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(3, 3, -4); scene.add(rim);
  // 地面
  if (kind === 'plastic') {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: bg, roughness: 0.95 }));
    g.rotation.x = -PI / 2; g.receiveShadow = true; scene.add(g);
  } else if (kind === 'ceramic') {
    const t = groundTexture('ceramic');
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.5, 64), [new THREE.MeshStandardMaterial({ color: '#a77b4f', roughness: 0.9 }), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: '#a77b4f' })]);
    disc.position.y = -0.25; disc.receiveShadow = true; scene.add(disc);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#c9c9cc', roughness: 1 }));
    floor.rotation.x = -PI / 2; floor.position.y = -0.5; floor.receiveShadow = true; scene.add(floor);
  } else {
    const t = groundTexture(kind); t.repeat.set(kind === 'felt' ? 3 : 4, kind === 'felt' ? 3 : 4);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }));
    g.rotation.x = -PI / 2; g.receiveShadow = true; scene.add(g);
  }
  scene.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { m.envMapIntensity = scene.userData.envDim; }); });
  return scene;
}
