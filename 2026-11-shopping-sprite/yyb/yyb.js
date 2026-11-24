/*
  圓圓寶 3D 基準模型（Three.js）
  - 角色本體、道具、姿勢、動作、特效都在這一支。所有頁面引用同一份，角色長相只有這一個來源。
  - 座標：腳底在 y=0，正面朝 +z。身體中心約 y=1.22，斗笠頂約 y=2.7。
  - 動作規格對應〈圓圓寶動作規劃〉第 7 節。
  - 手掌方向用 pL／pR 指定（front 朝前、up 朝上、down 朝下、in 朝身體中線），手腕角度由程式依手臂方向算出，
    大拇指固定在手掌靠身體的那一側。不要再用手腕旋轉去湊手掌方向。
*/
import * as THREE from 'three';

export const C = {
  body: '#3f9c38', outline: '#2c862d', cream: '#f6f1e2', sun: '#f6b52c',
  hillA: '#a6ca2f', hillB: '#bdd73f', river: '#3b98d7', path: '#f4efe0',
  glove: '#f6f2e7', hat: '#f8c53a', rib: '#2f8f31',
  wood: '#c99a5b', woodDark: '#9e7240', cooler: '#f3f5f4', lid: '#9fd0e8', card: '#c9a26a',
};
const PI = Math.PI;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ---------- 貼圖 ---------- */
function mkCanvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function mkTex(cv) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// 肚子的 logo：畫在「正面投影」座標，x、y 都是 -1..1
function logoCanvas() {
  const S = 1024, cv = mkCanvas(S), g = cv.getContext('2d');
  const X = x => (x * 0.5 + 0.5) * S, Y = y => (0.5 - y * 0.5) * S, L = w => w * 0.5 * S;
  g.save(); g.beginPath(); g.arc(X(0), Y(0), L(0.965), 0, PI * 2); g.clip();
  g.fillStyle = C.cream; g.fillRect(0, 0, S, S);
  g.fillStyle = C.sun; g.beginPath(); g.arc(X(0), Y(0.24), L(0.31), 0, PI * 2); g.fill();
  g.lineJoin = 'round'; g.lineCap = 'round';
  const stroke = (w = 0.05) => { g.strokeStyle = C.outline; g.lineWidth = L(w); g.stroke(); };
  const band = () => { g.moveTo(X(-1.3), Y(-0.36)); g.bezierCurveTo(X(-0.4), Y(-0.32), X(0.4), Y(-0.28), X(1.3), Y(-0.25)); };
  // 左丘
  g.beginPath(); g.moveTo(X(-1.2), Y(0.0));
  g.bezierCurveTo(X(-0.78), Y(0.3), X(-0.3), Y(0.2), X(-0.04), Y(-0.24));
  g.lineTo(X(0.5), Y(-0.85)); g.lineTo(X(0.5), Y(-1.3)); g.lineTo(X(-1.3), Y(-1.3)); g.closePath();
  g.fillStyle = C.hillA; g.fill(); stroke();
  // 右丘（疊在左丘前面，它的左坡線就是 V 下面那條斜線）
  g.beginPath(); g.moveTo(X(1.2), Y(0.0));
  g.bezierCurveTo(X(0.78), Y(0.3), X(0.3), Y(0.2), X(-0.04), Y(-0.24));
  g.lineTo(X(-0.4), Y(-0.75)); g.lineTo(X(-0.4), Y(-1.3)); g.lineTo(X(1.3), Y(-1.3)); g.closePath();
  g.fillStyle = C.hillB; g.fill(); stroke();
  // 河面
  g.beginPath(); band(); g.lineTo(X(1.3), Y(-1.3)); g.lineTo(X(-1.3), Y(-1.3)); g.closePath();
  g.fillStyle = C.river; g.fill(); stroke();
  // S 形小路：先往右彎、再往左彎，越往下越寬
  g.fillStyle = C.path;
  // 整段 S 收在肚子看得到的範圍內（y -0.3 到 -0.82），往下延伸到肚底
  const P = [[-0.16, -0.31], [0.62, -0.42], [-0.62, -0.6], [0.06, -0.82]];
  const bez = t => { const m = 1 - t; return [0, 1].map(j => m * m * m * P[0][j] + 3 * m * m * t * P[1][j] + 3 * m * t * t * P[2][j] + t * t * t * P[3][j]); };
  for (let i = 0; i <= 200; i++) {
    const t = i / 200, [x, y] = bez(t);
    g.beginPath(); g.arc(X(x), Y(y), L(0.012 + t * 0.06), 0, PI * 2); g.fill();
  }
  for (let i = 0; i <= 40; i++) { const t = i / 40; g.beginPath(); g.arc(X(0.06 + t * 0.02), Y(-0.82 - t * 0.3), L(0.072 + t * 0.02), 0, PI * 2); g.fill(); }
  g.beginPath(); band(); stroke();
  g.restore();
  return cv;
}
function weaveCanvas() {
  const W = 256, H = 128, cv = mkCanvas(W, H), g = cv.getContext('2d');
  g.fillStyle = C.wood; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 16) { g.fillStyle = C.woodDark; g.fillRect(0, y, W, 3); }
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x + ((y / 16) % 2 ? 8 : 0), y + 4, 6, 9);
  }
  return cv;
}
function couponCanvas() {
  const W = 256, H = 128, cv = mkCanvas(W, H), g = cv.getContext('2d');
  g.fillStyle = '#4ba83b'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2f7d27';
  g.beginPath(); g.arc(0, H / 2, 18, 0, PI * 2); g.fill();
  g.beginPath(); g.arc(W, H / 2, 18, 0, PI * 2); g.fill();
  g.setLineDash([8, 6]); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(80, 14); g.lineTo(80, H - 14); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(168, 64, 36, 20, -0.6, 0, PI * 2); g.fill();
  g.strokeStyle = '#4ba83b'; g.lineWidth = 4; g.beginPath(); g.moveTo(140, 88); g.lineTo(196, 40); g.stroke();
  return cv;
}
function listCanvas() {
  const W = 200, H = 260, cv = mkCanvas(W, H), g = cv.getContext('2d');
  g.fillStyle = '#fbf7ec'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#8a94a3'; g.lineWidth = 5; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const y = 44 + i * 44; g.beginPath(); g.moveTo(64, y); g.lineTo(170 - (i % 2) * 30, y); g.stroke(); }
  g.strokeStyle = '#4ba83b'; g.lineWidth = 7;
  [0, 1, 3].forEach(i => { const y = 44 + i * 44; g.beginPath(); g.moveTo(24, y); g.lineTo(34, y + 10); g.lineTo(50, y - 12); g.stroke(); });
  return cv;
}
function clothCanvas() {
  const S = 128, cv = mkCanvas(S), g = cv.getContext('2d');
  g.fillStyle = '#f3ead6'; g.fillRect(0, 0, S, S);
  g.fillStyle = 'rgba(190,160,110,.45)';
  for (let i = 0; i < S; i += 32) { g.fillRect(i, 0, 14, S); g.fillRect(0, i, S, 14); }
  return cv;
}
function stickerCanvas(kind) {
  const S = 128, cv = mkCanvas(S), g = cv.getContext('2d');
  g.fillStyle = '#fbf7ec'; g.beginPath(); g.roundRect(6, 6, S - 12, S - 12, 16); g.fill();
  if (kind === 'leaf') {
    g.fillStyle = '#4ba83b'; g.beginPath(); g.ellipse(64, 64, 40, 22, -0.7, 0, PI * 2); g.fill();
    g.strokeStyle = '#fbf7ec'; g.lineWidth = 5; g.beginPath(); g.moveTo(36, 92); g.lineTo(92, 36); g.stroke();
  } else {
    g.fillStyle = '#e67e22'; g.fillRect(22, 26, 84, 20);
    g.fillStyle = '#8a94a3';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.fillRect(28 + c * 20, 58 + r * 18, 10, 10);
  }
  return cv;
}
function blobCanvas() {
  const S = 128, cv = mkCanvas(S), g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(51,67,90,.32)'); gr.addColorStop(1, 'rgba(51,67,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S); return cv;
}
function puffCanvas() {
  const S = 64, cv = mkCanvas(S), g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S); return cv;
}
export function textSprite(txt, { fg = '#fff', bg = '#4ba83b', h = 0.26 } = {}) {
  const cv = mkCanvas(256, 128), g = cv.getContext('2d');
  if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(8, 16, 240, 96, 48); g.fill(); }
  g.fillStyle = fg; g.font = '700 72px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(txt, 128, 68);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mkTex(cv), transparent: true, depthWrite: false }));
  s.scale.set(h * 2, h, 1); return s;
}

/* ---------- 斗笠 ---------- */
// 剖面照需求 owner 給的參考圖逐點量出來（半徑與高度都以帽寬的一半為 1）：
// 上段是微微外鼓、近乎直線的尖錐 → 中間一個轉折，坡度變陡 → 兩側各一片近乎水平的帽緣（兩個「上尾」）→ 末端圓圓往下收
const HAT_R = 1.12;
const HAT_PTS = [[0, .77], [.08, .75], [.16, .705], [.24, .65], [.32, .585], [.38, .52], [.44, .44], [.5, .37], [.56, .315], [.62, .29],
  [.7, .277], [.78, .27], [.85, .255], [.9, .235], [.94, .205], [.97, .165], [1.0, .1]];
const HAT = { ringR: .56 * HAT_R, ringY: .315 * HAT_R, brimR: .99 * HAT_R, brimY: .11 * HAT_R, apex: .77 * HAT_R };
function hatProfile(n = 64) {
  const curve = new THREE.SplineCurve(HAT_PTS.map(([r, h]) => new THREE.Vector2(r * HAT_R, h * HAT_R)));
  const pts = curve.getPoints(n); pts[0].x = 0; return pts;
}
// 斗笠放在頭上的高度：讓整片斗笠內面都在身體上方 0.07（身體半徑 x 0.98、y 0.93）。
// 留 0.07 是為了吸收斗笠本身的傾斜與動作裡的壓低、歪斜，少於這個值，斗笠一歪頭頂就會穿出來
function hatSeat() {
  let y = 0;
  for (const p of hatProfile(64)) { if (p.x >= 0.98) continue; const body = 0.93 * Math.sqrt(1 - (p.x / 0.98) ** 2); y = Math.max(y, body + 0.07 - p.y); }
  return y;
}

/* ---------- 共用資源 ---------- */
let R = null;
function res() {
  if (R) return R;
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.62, metalness: 0 }, o || {}));
  const T = (cv, o) => new THREE.MeshStandardMaterial(Object.assign({ map: mkTex(cv), roughness: 0.8 }, o || {}));
  // 正面半球，用「正面投影」當貼圖座標，logo 才不會被球面拉歪
  const badge = new THREE.SphereGeometry(1.006, 96, 64, 0, PI);
  const p = badge.attributes.position, uv = badge.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.006 * 0.5 + 0.5, p.getY(i) / 1.006 * 0.5 + 0.5);
  uv.needsUpdate = true;
  // 斗笠的面與骨架都沿著同一條剖面線
  const prof = hatProfile(64);
  const hatShell = new THREE.LatheGeometry(prof, 96);
  // 骨架只比表面高一點點
  const ribPts = hatProfile(40).map(v => V3(v.x * 1.004 + 0.002, v.y + 0.006, 0));
  const hatRib = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribPts), 48, 0.016, 8);
  R = {
    mat: {
      body: M(C.body), glove: M(C.glove, { roughness: 0.78 }), hat: M(C.hat, { side: THREE.DoubleSide, roughness: 0.72 }),
      rib: M(C.rib), logo: new THREE.MeshStandardMaterial({ map: mkTex(logoCanvas()), transparent: true, alphaTest: 0.5, roughness: 0.6 }),
      weave: T(weaveCanvas(), { side: THREE.DoubleSide, roughness: 0.85 }), wood: M(C.wood, { roughness: 0.85 }), woodDark: M(C.woodDark, { roughness: 0.85 }),
      leaf: M('#4fa23a'), leaf2: M('#86c447'), carrot: M('#ef8a2a'), tomato: M('#df4f3e'), cabbage: M('#bfe07f'), orange: M('#f39a1e'),
      cooler: M(C.cooler, { roughness: 0.5 }), lid: M(C.lid, { roughness: 0.5 }), tape: M('#e9d8a6', { roughness: 0.8 }),
      card: M(C.card, { roughness: 0.88 }), paper: T(listCanvas()), coupon: T(couponCanvas(), { roughness: 0.7 }), couponEdge: M('#4ba83b'),
      cloth: T(clothCanvas(), { side: THREE.DoubleSide, roughness: 0.95 }), stLeaf: T(stickerCanvas('leaf')), stCal: T(stickerCanvas('cal')),
      dark: M('#2f7d32'),
      shadow: new THREE.MeshBasicMaterial({ map: mkTex(blobCanvas()), transparent: true, depthWrite: false }),
      puff: new THREE.SpriteMaterial({ map: mkTex(puffCanvas()), transparent: true, depthWrite: false }),
    },
    geo: {
      sphere: new THREE.SphereGeometry(1, 64, 48), badge, ball: new THREE.SphereGeometry(1, 20, 14),
      arm: new THREE.CapsuleGeometry(0.17, 0.18, 8, 16), palm: new THREE.SphereGeometry(0.16, 24, 18),
      finger: new THREE.CapsuleGeometry(0.044, 0.1, 6, 12), cuff: new THREE.TorusGeometry(0.125, 0.05, 10, 24),
      leg: new THREE.CapsuleGeometry(0.18, 0.12, 8, 16),
      hatShell, hatRib, rim: new THREE.TorusGeometry(HAT.brimR, 0.026, 10, 120), ring: new THREE.TorusGeometry(HAT.ringR * 1.01, 0.018, 8, 90),
      box: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1), cone8: new THREE.ConeGeometry(1, 1, 12),
      basket: new THREE.CylinderGeometry(0.24, 0.19, 0.22, 28, 1, true), disc: new THREE.CircleGeometry(0.19, 24),
      bRim: new THREE.TorusGeometry(0.24, 0.02, 8, 32), bHandle: new THREE.TorusGeometry(0.2, 0.018, 8, 24, PI),
      sieve: new THREE.CylinderGeometry(0.28, 0.24, 0.05, 28), sRim: new THREE.TorusGeometry(0.28, 0.022, 8, 32),
      cup: new THREE.CylinderGeometry(0.12, 0.12, 0.09, 20),
    },
  };
  return R;
}
const mesh = (g, m) => new THREE.Mesh(g, m);
function ball(r, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = mesh(res().geo.ball, mat); m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z); return m;
}

/* ---------- 手 ---------- */
// 手的本地座標：手指朝 -y、手心朝 +z、大拇指在 +x * side（靠身體那側，由 apply 算方向保證）
function buildHand(side) {
  const r = res(), h = new THREE.Group();
  const cuff = mesh(r.geo.cuff, r.mat.glove); cuff.rotation.x = PI / 2; cuff.position.y = 0.05; h.add(cuff);
  const palm = mesh(r.geo.palm, r.mat.glove); palm.position.y = -0.12; palm.scale.set(1.08, 1.0, 0.72); h.add(palm);
  const F = (x, y, z, rz = 0, len = 1) => { const f = mesh(r.geo.finger, r.mat.glove); f.position.set(x, y, z); f.rotation.z = rz; f.scale.y = len; return f; };
  // 大拇指在手掌前側（手心那面）偏外，跟三根手指錯開一層，不擠在同一排
  const thumbOpen = () => { const t = F(side * 0.14, -0.1, 0.05, side * 1.05, 0.95); t.rotation.x = 0.25; return t; };
  const shapes = {};
  // 張開：三根手指之間留一點縫，指根藏在手掌裡，往外微微張開
  const open = new THREE.Group();
  [-0.095, 0, 0.095].forEach((x, i) => open.add(F(x, -0.275 - (i === 1 ? 0.015 : 0), 0, -x * 1.6, i === 1 ? 1.08 : 1)));
  open.add(thumbOpen()); shapes.open = open;
  const knuckle = () => { const k = mesh(r.geo.finger, r.mat.glove); k.rotation.z = PI / 2; k.scale.set(1.35, 1.35, 1.2); k.position.set(0, -0.215, 0.02); return k; };
  const tuck = () => { const t = F(side * 0.05, -0.15, 0.1, side * 1.35, 0.8); return t; };
  // 握拳：大拇指收在拳頭前面
  const fist = new THREE.Group(); fist.add(knuckle()); fist.add(tuck()); shapes.fist = fist;
  // 比讚：大拇指往外伸，apply 讓手心朝身體時大拇指就朝上
  const thumb = new THREE.Group(); thumb.add(knuckle());
  const th = F(0, 0, 0); th.scale.y = 1.3;
  th.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(side, 0.25, 0.05).normalize());
  th.position.set(side * 0.18, -0.12, 0.03); thumb.add(th); shapes.thumb = thumb;
  // 指：食指伸直、其餘握起
  const point = new THREE.Group(); point.add(knuckle()); const idx = F(-side * 0.03, -0.34, 0.02); idx.scale.y = 1.3; point.add(idx);
  point.add(tuck()); shapes.point = point;
  // 捧：三根手指往手心彎
  const cup = new THREE.Group();
  [-0.095, 0, 0.095].forEach(x => { const f = F(x, -0.255, 0.05, -x * 1.3); f.rotation.x = -0.75; cup.add(f); });
  cup.add(thumbOpen()); shapes.cup = cup;
  Object.values(shapes).forEach(s => { s.visible = false; h.add(s); });
  return { group: h, shapes };
}

/* ---------- 道具 ---------- */
function veg(kind, x, y, z, s = 1) {
  const r = res(), g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  if (kind === 'cabbage') { g.add(ball(0.085, r.mat.cabbage, 0, 0, 0, 1, 0.9, 1)); g.add(ball(0.05, r.mat.leaf2, 0.04, 0.05, 0.02)); }
  if (kind === 'tomato') { g.add(ball(0.06, r.mat.tomato, 0, 0, 0)); g.add(ball(0.02, r.mat.leaf, 0, 0.06, 0, 1.4, 0.5, 1.4)); }
  if (kind === 'orange') { g.add(ball(0.062, r.mat.orange, 0, 0, 0)); }
  if (kind === 'carrot') {
    const c = mesh(r.geo.cone8, r.mat.carrot); c.scale.set(0.035, 0.17, 0.035); c.rotation.z = PI; c.position.y = -0.02; g.add(c);
    g.add(ball(0.03, r.mat.leaf, 0, 0.08, 0, 1, 1.6, 1)); g.rotation.z = 0.35;
  }
  if (kind === 'leaf') { g.add(ball(0.08, r.mat.leaf, 0, 0, 0, 1, 0.25, 0.6)); }
  return g;
}
function makeBasket() {
  const r = res(), g = new THREE.Group();
  const body = mesh(r.geo.basket, r.mat.weave); body.position.y = 0.11; g.add(body);
  const bottom = mesh(r.geo.disc, r.mat.woodDark); bottom.rotation.x = -PI / 2; bottom.position.y = 0.005; g.add(bottom);
  const rim = mesh(r.geo.bRim, r.mat.woodDark); rim.rotation.x = PI / 2; rim.position.y = 0.22; g.add(rim);
  const handle = mesh(r.geo.bHandle, r.mat.woodDark); handle.position.y = 0.22; g.add(handle);
  const fills = {
    some: [['cabbage', -0.07, 0.21, 0], ['carrot', 0.08, 0.25, 0.04]],
    full: [['cabbage', -0.1, 0.22, 0], ['carrot', 0.1, 0.26, 0.05], ['tomato', 0.02, 0.24, 0.1], ['orange', 0.06, 0.22, -0.08]],
    over: [['cabbage', -0.1, 0.25, 0], ['carrot', 0.12, 0.31, 0.05], ['tomato', 0.02, 0.3, 0.1], ['orange', 0.07, 0.26, -0.09], ['cabbage', 0.0, 0.33, -0.02, 0.9], ['tomato', -0.13, 0.3, 0.1]],
    two: [['cabbage', -0.08, 0.22, 0.02], ['tomato', 0.09, 0.22, 0.04]],
  };
  const fg = {};
  for (const k in fills) { const grp = new THREE.Group(); fills[k].forEach(a => grp.add(veg(...a))); grp.visible = false; g.add(grp); fg[k] = grp; }
  const cloth = mesh(r.geo.box, r.mat.cloth); cloth.scale.set(0.52, 0.015, 0.46); cloth.position.set(0, 0.25, 0); cloth.rotation.set(0.08, 0.3, -0.12); cloth.visible = false; g.add(cloth);
  g.userData.setState = st => { for (const k in fg) fg[k].visible = (st.fill === k); cloth.visible = !!st.cloth; };
  return g;
}
function makeCooler() {
  const r = res(), g = new THREE.Group();
  const b = mesh(r.geo.box, r.mat.cooler); b.scale.set(0.62, 0.36, 0.42); b.position.y = 0.18; g.add(b);
  const stripe = mesh(r.geo.box, r.mat.lid); stripe.scale.set(0.625, 0.04, 0.425); stripe.position.y = 0.3; g.add(stripe);
  const lidG = new THREE.Group(); lidG.position.set(0, 0.36, -0.21); g.add(lidG);
  const lid = mesh(r.geo.box, r.mat.lid); lid.scale.set(0.66, 0.07, 0.46); lid.position.set(0, 0.035, 0.21); lidG.add(lid);
  const hd = mesh(r.geo.bHandle, r.mat.dark); hd.scale.setScalar(0.6); hd.position.set(0, 0.07, 0.21); lidG.add(hd);
  const tape = mesh(r.geo.box, r.mat.tape); tape.scale.set(0.11, 0.075, 0.48); tape.position.set(0, 0.04, 0.21); lidG.add(tape);
  g.userData.setState = st => { lidG.rotation.x = -(st.lid || 0) * 1.9; tape.visible = (st.tape || 0) > 0.5; };
  return g;
}
function makeCrate() {
  const r = res(), g = new THREE.Group(), W = 0.66, D = 0.42, H = 0.2, t = 0.03;
  const add = (sx, sy, sz, x, y, z) => { const m = mesh(r.geo.box, r.mat.wood); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); };
  add(W, t, D, 0, t / 2, 0); add(W, H, t, 0, H / 2, D / 2); add(W, H, t, 0, H / 2, -D / 2); add(t, H, D, W / 2, H / 2, 0); add(t, H, D, -W / 2, H / 2, 0);
  g.add(veg('leaf', -0.1, 0.05, 0.02)); g.add(veg('leaf', 0.12, 0.05, -0.05));
  return g;
}
function makeSieve() {
  const r = res(), g = new THREE.Group();
  g.add(mesh(r.geo.sieve, r.mat.weave));
  const rim = mesh(r.geo.sRim, r.mat.woodDark); rim.rotation.x = PI / 2; rim.position.y = 0.025; g.add(rim);
  g.add(veg('tomato', -0.08, 0.08, 0.02)); g.add(veg('tomato', 0.06, 0.08, -0.04)); g.add(veg('tomato', 0.07, 0.08, 0.09));
  return g;
}
function makeCoupon() {
  const r = res(), e = r.mat.couponEdge;
  const m = new THREE.Mesh(r.geo.box, [e, e, e, e, r.mat.coupon, e]); m.scale.set(0.42, 0.22, 0.014);
  const g = new THREE.Group(); g.add(m); return g;
}
function makeList() {
  const r = res(), e = r.mat.cooler;
  const m = new THREE.Mesh(r.geo.box, [e, e, e, e, r.mat.paper, e]); m.scale.set(0.24, 0.31, 0.01);
  const g = new THREE.Group(); g.add(m); return g;
}
function makeBox(kind) {
  const r = res(), g = new THREE.Group();
  const b = mesh(r.geo.box, r.mat.card); b.scale.set(0.42, 0.36, 0.38); b.position.y = 0.18; g.add(b);
  const flap = mesh(r.geo.box, r.mat.woodDark); flap.scale.set(0.422, 0.02, 0.06); flap.position.y = 0.36; g.add(flap);
  const st = mesh(r.geo.plane, kind === 'leaf' ? r.mat.stLeaf : r.mat.stCal); st.scale.set(0.17, 0.17, 1); st.position.set(0, 0.19, 0.192); g.add(st);
  return g;
}
function makeHeadset() {
  const r = res(), g = new THREE.Group();
  // 戴在身上的道具不能整組放大，改成把耳罩與麥克風本身做大
  [-1, 1].forEach(s => {
    const cup = mesh(r.geo.cup, r.mat.dark); cup.scale.set(1.7, 1.5, 1.7); cup.rotation.z = PI / 2; cup.position.set(s * 0.98, 0.36, 0.05); g.add(cup);
    const pad = mesh(r.geo.cup, r.mat.glove); pad.scale.set(1.35, 0.8, 1.35); pad.rotation.z = PI / 2; pad.position.set(s * 1.07, 0.36, 0.05); g.add(pad);
  });
  const curve = new THREE.CatmullRomCurve3([V3(1.02, 0.3, 0.14), V3(0.96, 0.1, 0.5), V3(0.62, -0.02, 0.8)]);
  g.add(mesh(new THREE.TubeGeometry(curve, 16, 0.035, 8), r.mat.dark));
  g.add(ball(0.1, r.mat.dark, 0.6, -0.03, 0.82, 1.4, 1, 1));
  return g;
}

// 道具刻意比真實比例大 2 到 2.5 倍：正式站上角色只有 64 到 96px 高，道具照真實比例會小到看不見
export const PROP_DEFS = {
  basket: { make: makeBasket, parent: 'root', def: { x: 1.25, y: 0, z: 0.25, rx: 0, ry: 0.3, rz: 0, s: 2.1 } },
  gift: { make: makeBasket, parent: 'root', def: { x: 0, y: 0.05, z: 1.0, rx: 0.1, ry: 0, rz: 0, s: 2.3 } },
  cooler: { make: makeCooler, parent: 'root', def: { x: -1.25, y: 0, z: 0.95, rx: 0, ry: 0.3, rz: 0, s: 1.9 } },
  crate: { make: makeCrate, parent: 'root', def: { x: 1.35, y: 0, z: 0.75, rx: 0, ry: -0.3, rz: 0, s: 2.0 } },
  sieve: { make: makeSieve, parent: 'root', def: { x: 0.5, y: 0.78, z: 0.95, rx: 0.3, ry: 0, rz: 0, s: 2.0 } },
  coupon: { make: makeCoupon, parent: 'root', def: { x: 1.28, y: 1.82, z: 0.52, rx: 0, ry: -0.2, rz: 0.15, s: 2.2 } },
  list: { make: makeList, parent: 'root', def: { x: -0.6, y: 0.72, z: 1.05, rx: -0.15, ry: 0.15, rz: -0.08, s: 2.2 } },
  boxA: { make: () => makeBox('leaf'), parent: 'root', def: { x: -1.2, y: 0, z: 0.4, rx: 0, ry: 0.2, rz: 0, s: 2.0 } },
  boxB: { make: () => makeBox('cal'), parent: 'root', def: { x: 1.2, y: 0, z: 0.4, rx: 0, ry: -0.2, rz: 0, s: 2.0 } },
  headset: { make: makeHeadset, parent: 'torso', def: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 } },
  qmark: { make: () => { const g = new THREE.Group(); g.add(textSprite('?', { fg: '#4ba83b', bg: null, h: 1.4 })); return g; }, parent: 'root', def: { x: -1.4, y: 2.45, z: 0.2, rx: 0, ry: 0, rz: 0, s: 1 } },
};

/* ---------- 姿勢 ---------- */
// 數字可內插、字串直接切換。手臂：fwd 往前舉、out 往外舉、tw 扭轉（弧度）。
// 手掌方向：pL／pR = front 朝前、back 朝後、up 朝上、down 朝下、in 朝身體中線。wL／wR 只做小幅微調。
export const BASE = {
  y: 0, sx: 1, sy: 1, scale: 1, rotY: -0.26, lean: 0, tilt: 0, sit: 0, hatX: 0, hatZ: 0, hatY: 0,
  'aL.fwd': 0.1, 'aL.out': 0.32, 'aL.tw': 0, 'aR.fwd': 0.1, 'aR.out': 0.32, 'aR.tw': 0,
  'wL.x': 0, 'wL.y': 0, 'wL.z': 0, 'wR.x': 0, 'wR.y': 0, 'wR.z': 0, lL: 0, lR: 0,
  hL: 'fist', hR: 'fist', pL: 'in', pR: 'in', vis: '', fill: 'empty', cloth: 0, lid: 0, tape: 0,
};
const PALM = { front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0], down: [0, -1, 0] };
const _f = V3(), _n = V3(), _x = V3(), _y = V3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _e = new THREE.Euler();

export class YYB {
  constructor() {
    const r = res();
    this.group = new THREE.Group();
    const sh = mesh(r.geo.plane, r.mat.shadow); sh.rotation.x = -PI / 2; sh.position.y = 0.003; sh.scale.set(2.3, 1.5, 1); sh.renderOrder = -1;
    this.shadow = sh; this.group.add(sh);
    this.root = new THREE.Group(); this.group.add(this.root);
    this.torso = new THREE.Group(); this.torso.position.y = 1.22; this.root.add(this.torso);
    const bodyG = new THREE.Group(); bodyG.scale.set(0.98, 0.93, 0.84); this.torso.add(bodyG);
    bodyG.add(mesh(r.geo.sphere, r.mat.body)); bodyG.add(mesh(r.geo.badge, r.mat.logo));
    // 斗笠：兩段弧面＋沿弧面的骨架＋中間綠環＋帽緣綠環
    this.hat = new THREE.Group(); this.hat.position.set(0, hatSeat(), 0); this.torso.add(this.hat);
    this.hatInner = new THREE.Group(); this.hat.add(this.hatInner);
    this.hatInner.add(mesh(r.geo.hatShell, r.mat.hat));
    for (let i = 0; i < 10; i++) { const rib = mesh(r.geo.hatRib, r.mat.rib); rib.rotation.y = i / 10 * PI * 2 + 0.2; this.hatInner.add(rib); }
    const ring = mesh(r.geo.ring, r.mat.rib); ring.rotation.x = PI / 2; ring.position.y = HAT.ringY + 0.012; this.hatInner.add(ring);
    const rim = mesh(r.geo.rim, r.mat.rib); rim.rotation.x = PI / 2; rim.position.y = HAT.brimY; this.hatInner.add(rim);
    this.hatInner.add(ball(0.03, r.mat.rib, 0, HAT.apex, 0));
    // 手臂
    this.arms = {};
    [['L', -1], ['R', 1]].forEach(([k, side]) => {
      const s = new THREE.Group(); s.position.set(side * 0.84, -0.12, 0.04); this.torso.add(s);
      const a = mesh(r.geo.arm, r.mat.body); a.position.y = -0.16; s.add(a);
      const hand = buildHand(side); hand.group.position.y = -0.36; hand.group.scale.setScalar(1.3); s.add(hand.group);
      this.arms[k] = { side, sh: s, hand };
    });
    // 腳
    this.legs = {};
    [['L', -1], ['R', 1]].forEach(([k, side]) => {
      const hip = new THREE.Group(); hip.position.set(side * 0.3, 0.47, 0); this.root.add(hip);
      const l = mesh(r.geo.leg, r.mat.body); l.position.y = -0.12; hip.add(l);
      const f = mesh(r.geo.sphere, r.mat.body); f.scale.set(0.26, 0.16, 0.33); f.position.set(side * 0.02, -0.31, 0.08); hip.add(f);
      this.legs[k] = hip;
    });
    this.props = {};
    this.state = Object.assign({}, BASE);
    this.apply(this.state);
  }
  prop(name) {
    if (!this.props[name]) {
      const d = PROP_DEFS[name]; const o = d.make(); o.visible = false;
      (d.parent === 'torso' ? this.torso : this.root).add(o); this.props[name] = o;
    }
    return this.props[name];
  }
  // 依手臂方向算手腕：手指順著手臂、手心朝指定方向、大拇指自然落在靠身體那側
  orientHand(A, palm, k, s) {
    _f.set(0, -1, 0).applyQuaternion(A.sh.quaternion);
    if (palm === 'in') _n.set(-A.side, 0, 0); else if (palm === 'out') _n.set(A.side, 0, 0); else _n.set(...(PALM[palm] || PALM.front));
    _n.addScaledVector(_f, -_n.dot(_f));
    if (_n.lengthSq() < 1e-4) { _n.set(0, 0, 1).addScaledVector(_f, -_f.z); if (_n.lengthSq() < 1e-4) _n.set(0, 1, 0).addScaledVector(_f, -_f.y); }
    _n.normalize(); _y.copy(_f).negate(); _x.crossVectors(_y, _n);
    _m.makeBasis(_x, _y, _n); _q.setFromRotationMatrix(_m);
    _qi.copy(A.sh.quaternion).invert().multiply(_q);
    A.hand.group.quaternion.copy(_qi);
    _e.set(s['w' + k + '.x'], s['w' + k + '.y'], s['w' + k + '.z']); _q.setFromEuler(_e);
    A.hand.group.quaternion.multiply(_q);
  }
  apply(s) {
    this.state = s;
    const sc = s.scale;
    this.root.position.y = s.y; this.root.scale.set(s.sx * sc, s.sy * sc, s.sx * sc); this.root.rotation.y = s.rotY;
    // 坐下：身體只降到肚底剛好離地，腳往前伸出來，避免身體陷進地面、腳埋進身體
    this.torso.position.y = 1.22 - s.sit * 0.18; this.torso.rotation.set(s.lean, 0, s.tilt);
    this.hatInner.position.y = s.hatY; this.hat.rotation.set(0.02 + s.hatX, 0, -0.07 + s.hatZ);
    for (const k of ['L', 'R']) {
      const A = this.arms[k], side = A.side;
      A.sh.rotation.set(-s['a' + k + '.fwd'], side * s['a' + k + '.tw'], side * s['a' + k + '.out']);
      this.orientHand(A, s['p' + k], k, s);
      const hs = s['h' + k];
      for (const n in A.hand.shapes) A.hand.shapes[n].visible = (n === hs);
    }
    this.legs.L.rotation.x = -(s.lL + s.sit * 1.45); this.legs.R.rotation.x = -(s.lR + s.sit * 1.45);
    this.legs.L.position.y = this.legs.R.position.y = 0.47 - s.sit * 0.18;
    this.legs.L.position.z = this.legs.R.position.z = s.sit * 0.28;
    const vis = (s.vis || '').split(',').filter(Boolean);
    for (const n of vis) this.prop(n);
    for (const n in this.props) {
      const o = this.props[n], on = vis.includes(n); o.visible = on; if (!on) continue;
      const d = PROP_DEFS[n].def, g = k => (s[n + '.' + k] ?? d[k]);
      o.position.set(g('x'), g('y'), g('z')); o.rotation.set(g('rx'), g('ry'), g('rz')); o.scale.setScalar(g('s'));
      if (o.userData.setState) o.userData.setState(n === 'gift' ? { fill: 'two' } : s);
    }
    const lift = Math.max(0, s.y), k = 1 - Math.min(0.45, lift * 0.6);
    this.shadow.scale.set(2.3 * k * sc, 1.5 * k * sc, 1);
  }
}

/* ---------- 特效 ---------- */
export class FX {
  constructor(parent) { this.parent = parent; this.items = []; }
  add(obj, step) { this.parent.add(obj); this.items.push({ obj, step, t: 0 }); }
  clear() { this.items.forEach(i => this.parent.remove(i.obj)); this.items = []; }
  update(dt) {
    this.items = this.items.filter(it => { it.t += dt; const alive = it.step(it.t, dt, it.obj); if (!alive) this.parent.remove(it.obj); return alive; });
  }
  spawn(type, o = {}) {
    const r = res(); const V = a => V3(...a);
    if (type === 'fly') { // 商品飛入：p0 到 p1（手）再到 p2（菜籃）
      const m = veg(o.kind || 'tomato', 0, 0, 0, 3.5); const p0 = V(o.p0), c0 = V(o.c0), p1 = V(o.p1), p2 = V(o.p2);
      const T1 = o.t1 || 0.4, T2 = o.t2 || 0.35;
      this.add(m, (t, dt, obj) => {
        if (t < T1) { const u = t / T1, m1 = 1 - u; obj.position.set(0, 0, 0).addScaledVector(p0, m1 * m1).addScaledVector(c0, 2 * m1 * u).addScaledVector(p1, u * u); }
        else if (t < T1 + 0.12) obj.position.copy(p1);
        else if (t < T1 + 0.12 + T2) { const u = (t - T1 - 0.12) / T2; obj.position.lerpVectors(p1, p2, u); obj.scale.setScalar(3.5 * (1 - u * 0.4)); }
        else return false;
        return true;
      });
    }
    if (type === 'confetti') {
      const cols = ['#4ba83b', '#f8c53a', '#e67e22', '#22ac38', '#caa940'], n = o.n || 16;
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(r.geo.plane, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, transparent: true }));
        m.scale.set(0.16, 0.26, 1); m.position.set(...(o.at || [0, 2.4, 0]));
        const a = Math.random() * PI * 2, up = 2.2 + Math.random() * 1.6;
        const vel = V3(Math.cos(a) * (0.8 + Math.random()), up, Math.sin(a) * 0.6 * (0.5 + Math.random()));
        const spin = V3(Math.random() * 8, Math.random() * 8, Math.random() * 8), life = 1.2 + Math.random() * 0.4;
        this.add(m, (t, dt, obj) => {
          vel.y -= 5.2 * dt; obj.position.addScaledVector(vel, dt); obj.rotation.x += spin.x * dt; obj.rotation.y += spin.y * dt;
          obj.material.opacity = Math.min(1, (life - t) / 0.3); return t < life;
        });
      }
    }
    if (type === 'tag') { // 數字標籤：彈出、停 0.6 秒、淡出
      const s = textSprite(o.text || '×2', { h: 0.9 }); const W = s.scale.x, H = s.scale.y; s.position.set(...o.at);
      this.add(s, (t, dt, obj) => {
        const k = t < 0.18 ? (t / 0.18) * 1.12 : (t < 0.28 ? 1.12 - (t - 0.18) / 0.1 * 0.12 : 1);
        obj.scale.set(W * k, H * k, 1); obj.position.y = o.at[1] + Math.min(t, 0.3) * 0.5;
        obj.material.opacity = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.25) : 1; return t < 1.15;
      });
    }
    if (type === 'mist') {
      for (let i = 0; i < (o.n || 6); i++) {
        const s = new THREE.Sprite(r.mat.puff.clone()); const base = V(o.at); base.x += (Math.random() - 0.5) * 0.7;
        s.position.copy(base); const delay = i * 0.08, life = 0.9;
        this.add(s, (t, dt, obj) => {
          const u = Math.max(0, t - delay) / life; obj.position.y = base.y + u * 1.4; obj.position.x = base.x + Math.sin(u * 6 + i) * 0.12;
          const sz = 0.4 + u * 0.7; obj.scale.set(sz, sz, 1); obj.material.opacity = t < delay ? 0 : Math.sin(Math.min(1, u) * PI) * 0.9; return u < 1;
        });
      }
    }
    if (type === 'drop') { // 菜從籃子落進箱子
      ['cabbage', 'tomato', 'carrot'].forEach((k, i) => {
        const m = veg(k, 0, 0, 0, 2.6); const p0 = V(o.from), p1 = V(o.to); const delay = i * 0.08;
        this.add(m, (t, dt, obj) => {
          const u = Math.min(1, Math.max(0, t - delay) / 0.35); obj.visible = t >= delay;
          obj.position.lerpVectors(p0, p1, u); obj.position.y += Math.sin(u * PI) * 0.25 - u * u * 0.05; return u < 1;
        });
      });
    }
  }
}

/* ---------- 動作 ---------- */
// 每段動作：dur 長度、base 這段動作共用的姿勢、keys 關鍵影格（t 秒＋姿勢）、fx 特效（t 秒觸發）、osc 疊加的擺動
const IDLE = { vis: 'basket', fill: 'empty', 'aR.out': 0.45 };
const IDLE_B = { vis: 'basket', fill: 'some', 'aR.out': 0.45 };
const ADD_SETTLE = { vis: 'basket', fill: 'some', 'aL.fwd': 1.1, 'aL.out': -0.22, 'aR.fwd': 1.1, 'aR.out': -0.22, 'basket.x': 0, 'basket.y': 0.05, 'basket.z': 0.98, 'basket.ry': 0 };
const DONE_SETTLE = { vis: 'basket', fill: 'over', 'basket.x': 1.3, 'basket.y': 0, 'basket.z': 0.55, 'aR.out': 1.05, 'aR.fwd': 0.95, hR: 'thumb', pR: 'in', 'aL.out': 0.5, 'aL.fwd': -0.35 };
const NEAR = { vis: 'basket', fill: 'full', rotY: -0.38, lean: 0.12, hatZ: -0.12, 'aL.fwd': 1.05, 'aL.out': -0.15, 'aR.fwd': 1.0, 'aR.out': -0.05, hL: 'open', hR: 'open', pL: 'up', pR: 'up', 'basket.x': 0.3, 'basket.y': 0.28, 'basket.z': 1.02, 'basket.rx': 0.25, 'basket.ry': 0 };
const SIT = { sit: 1, scale: 0.85, 'aL.fwd': 0.95, 'aL.out': -0.2, 'aR.fwd': 0.95, 'aR.out': -0.2, hatY: 0, hatX: 0.1, rotY: -0.1, vis: '' };
const WAVE_R = { 'aR.out': 2.55, 'aR.fwd': 0.15, hR: 'open', pR: 'front' };
const OPEN_DOWN_L = { hL: 'open', pL: 'down' };

export const ACTIONS = {
  idle: { dur: 0.01, base: IDLE, keys: [{ t: 0 }] },
  idleB: { dur: 0.01, base: IDLE_B, keys: [{ t: 0 }] },
  addcart: {
    dur: 1.2, base: { vis: 'basket' }, keys: [
      { t: 0, fill: 'empty' },
      { t: 0.25, fill: 'empty', lean: -0.16, hatX: -0.1, rotY: -0.1, 'aL.fwd': 1.0, 'aL.out': 0.9, 'aR.fwd': 1.0, 'aR.out': 0.9, hL: 'open', hR: 'open', pL: 'front', pR: 'front', 'basket.x': 1.3, 'basket.y': 0.12, 'basket.z': -0.35 },
      { t: 0.5, fill: 'empty', lean: 0.02, y: -0.04, sy: 0.95, sx: 1.03, rotY: -0.1, 'aL.fwd': 1.4, 'aL.out': -0.3, 'aR.fwd': 1.4, 'aR.out': -0.3, hL: 'cup', hR: 'cup', pL: 'up', pR: 'up', 'basket.x': 1.25, 'basket.y': 0.05, 'basket.z': -0.25 },
      { t: 0.85, ...ADD_SETTLE },
      { t: 1.2, ...ADD_SETTLE },
    ],
    fx: [{ t: 0.05, type: 'fly', p0: [-2.6, 2.8, 0.9], c0: [-1.2, 3.4, 1.1], p1: [0, 1.5, 1.1], p2: [0, 0.6, 1.0], t1: 0.42, t2: 0.3 }],
  },
  addcartLite: { dur: 0.4, base: ADD_SETTLE, keys: [{ t: 0 }, { t: 0.18, lean: 0.14 }, { t: 0.4 }] },
  qty: { dur: 0.5, base: ADD_SETTLE, keys: [{ t: 0 }, { t: 0.16, y: 0.14 }, { t: 0.34, y: 0 }, { t: 0.5 }], fx: [{ t: 0.1, type: 'tag', text: '×2', at: [0.85, 1.25, 1.2] }] },
  near: { dur: 0.7, base: NEAR, keys: [{ t: 0 }, { t: 0.12, y: 0.08 }, { t: 0.26, y: 0 }, { t: 0.4, y: 0.08 }, { t: 0.55, y: 0 }, { t: 0.7 }] },
  done: {
    dur: 1.6, base: { vis: 'basket', fill: 'over', 'basket.x': 1.3, 'basket.y': 0, 'basket.z': 0.55 }, keys: [
      { t: 0 },
      { t: 0.3, sy: 0.8, sx: 1.12, hatY: -0.03, 'aL.fwd': 0.35, 'aL.out': 0.12, 'aR.fwd': 0.35, 'aR.out': 0.12 },
      { t: 0.55, y: 0.55, sy: 1.08, sx: 0.95, hatY: 0.12, 'aL.out': 2.75, 'aL.fwd': 0.2, 'aR.out': 2.75, 'aR.fwd': 0.2, pL: 'front', pR: 'front', ease: 'out' },
      { t: 0.8, y: 0, sy: 0.9, sx: 1.06, 'aL.out': 2.3, 'aR.out': 2.3, pL: 'front', pR: 'front', ease: 'in' },
      { t: 1.05, ...DONE_SETTLE },
      { t: 1.6, ...DONE_SETTLE },
    ], fx: [{ t: 0.45, type: 'confetti', n: 10, at: [0, 2.6, 0] }],
  },
  doneLite: { dur: 0.6, base: DONE_SETTLE, keys: [{ t: 0 }, { t: 0.2, y: 0.14 }, { t: 0.4, y: 0 }, { t: 0.6 }], fx: [{ t: 0.1, type: 'confetti', n: 4, at: [0, 2.5, 0] }] },
  order: {
    dur: 1.8, base: {}, keys: [
      { t: 0, vis: 'basket,cooler', fill: 'full', lid: 1 },
      { t: 0.45, vis: 'basket,cooler', fill: 'full', lid: 1, rotY: -0.5, lean: 0.36, 'aL.fwd': 1.2, 'aL.out': 0, 'aR.fwd': 1.2, 'aR.out': -0.1, 'basket.x': -0.55, 'basket.y': 0.75, 'basket.z': 1.05, 'basket.rz': 1.0 },
      { t: 0.9, vis: 'cooler', lid: 0, tape: 1, rotY: -0.45, lean: 0.3, 'aL.fwd': 1.3, 'aL.out': -0.2, 'aR.fwd': 1.3, 'aR.out': -0.25, hL: 'open', hR: 'open', pL: 'down', pR: 'down' },
      { t: 1.3, vis: 'cooler', tape: 1, rotY: -0.3, 'aL.fwd': 0.95, 'aL.out': 0.15, ...OPEN_DOWN_L, ...WAVE_R },
      { t: 1.8, vis: 'cooler', tape: 1, rotY: -0.3, 'aL.fwd': 0.95, 'aL.out': 0.15, ...OPEN_DOWN_L, ...WAVE_R },
    ], fx: [{ t: 0.35, type: 'drop', from: [-0.6, 1.1, 1.05], to: [-1.15, 0.6, 1.0] }],
    osc: [{ key: 'wR.z', amp: 0.35, freq: 2.4, t0: 1.25, t1: 1.8 }],
  },
  low: { dur: 0.01, base: SIT, keys: [{ t: 0 }] },
  soldout: {
    dur: 0.9, base: { vis: 'crate' }, keys: [
      { t: 0, rotY: 0.35, lean: 0.3, hatX: 0.1, 'aR.fwd': 1.0, 'aR.out': 0.35, hR: 'open', pR: 'up' },
      { t: 0.4, rotY: 0.35, lean: 0.3, hatX: 0.1, 'aR.fwd': 1.0, 'aR.out': 0.35, hR: 'open', pR: 'up' },
      { t: 0.65, rotY: -0.5, 'aL.out': 2.0, 'aL.fwd': 0.55, hL: 'open', pL: 'front' },
      { t: 0.9, rotY: -0.5, 'aL.out': 2.0, 'aL.fwd': 0.55, hL: 'open', pL: 'front' },
    ],
  },
  mixed: {
    dur: 0.6, base: { vis: 'boxA,boxB', rotY: 0 }, keys: [
      { t: 0, 'boxA.x': -1.2, 'boxB.x': 1.2 },
      { t: 0.25, y: 0.06, 'aL.out': 1.45, 'aR.out': 1.45, 'aL.fwd': 0.1, 'aR.fwd': 0.1, hL: 'open', hR: 'open', pL: 'front', pR: 'front', 'boxA.x': -1.55, 'boxB.x': 1.55 },
      { t: 0.45, 'aL.out': 1.45, 'aR.out': 1.45, 'aL.fwd': 0.1, 'aR.fwd': 0.1, hL: 'open', hR: 'open', pL: 'front', pR: 'front', 'boxA.x': -1.55, 'boxB.x': 1.55 },
      { t: 0.6, 'aL.out': 1.45, 'aR.out': 1.45, 'aL.fwd': 0.1, 'aR.fwd': 0.1, hL: 'open', hR: 'open', pL: 'front', pR: 'front', 'boxA.x': -1.55, 'boxB.x': 1.55 },
    ],
  },
  cold: {
    dur: 0.8, base: { vis: 'cooler', 'cooler.x': 0, 'cooler.y': 0.05, 'cooler.z': 1.0, 'cooler.s': 1.9, 'cooler.ry': 0, 'aL.fwd': 1.0, 'aL.out': -0.1, 'aR.fwd': 1.0, 'aR.out': -0.1, hL: 'open', hR: 'open', pL: 'in', pR: 'in' },
    keys: [{ t: 0 }, { t: 0.8 }], fx: [{ t: 0.02, type: 'mist', at: [0, 0.85, 1.05], n: 7 }],
    osc: [{ key: 'rotY', amp: 0.07, freq: 9, t0: 0.15, t1: 0.55 }],
  },
  lowstock: {
    dur: 0.8, base: { vis: 'sieve', hatX: 0.16, 'aR.fwd': 1.35, 'aR.out': -0.15, hR: 'open', pR: 'up', 'aL.fwd': 1.3, 'aL.out': -0.45, hL: 'point', pL: 'down' },
    keys: [{ t: 0, lean: 0.04 }, { t: 0.15, lean: 0.12 }, { t: 0.3, lean: 0.04 }, { t: 0.5, lean: 0.12 }, { t: 0.65, lean: 0.04 }, { t: 0.8, lean: 0.04 }],
  },
  cartback: {
    dur: 0.8, base: { vis: 'basket', fill: 'some', cloth: 1 }, keys: [
      { t: 0, rotY: 0.5, 'aR.fwd': -0.9, 'aR.out': 0.2, 'basket.x': 0.8, 'basket.y': 0.2, 'basket.z': -0.9 },
      { t: 0.3, rotY: 0.5, 'aR.fwd': -0.9, 'aR.out': 0.2, 'basket.x': 0.8, 'basket.y': 0.2, 'basket.z': -0.9 },
      { t: 0.55, 'aR.fwd': 1.1, 'aR.out': -0.05, 'aL.fwd': 1.15, 'aL.out': -0.25, ...OPEN_DOWN_L, 'basket.x': 0.25, 'basket.y': 0.05, 'basket.z': 1.0, 'basket.ry': 0 },
      { t: 0.8, 'aR.fwd': 1.1, 'aR.out': -0.05, 'aL.fwd': 1.15, 'aL.out': -0.25, ...OPEN_DOWN_L, 'basket.x': 0.25, 'basket.y': 0.05, 'basket.z': 1.0, 'basket.ry': 0 },
    ],
  },
  repurchase: { dur: 0.01, base: { vis: 'list', 'aL.fwd': 1.2, 'aL.out': -0.3, hL: 'open', pL: 'front', 'aR.fwd': 1.25, 'aR.out': -0.42, hR: 'point', pR: 'down', lean: 0.05 }, keys: [{ t: 0 }] },
  coupon: {
    dur: 0.6, base: { vis: 'coupon', 'aR.out': 2.2, 'aR.fwd': 0.45, hR: 'fist', pR: 'front', 'aL.out': 0.5, 'aL.fwd': -0.4 },
    keys: [{ t: 0 }, { t: 0.2, y: 0.1 }, { t: 0.4, y: 0 }, { t: 0.6 }],
  },
  firstbuy: { dur: 0.01, base: { vis: 'gift', lean: 0.12, 'aL.fwd': 1.1, 'aL.out': -0.25, 'aR.fwd': 1.1, 'aR.out': -0.25, hL: 'open', hR: 'open', pL: 'up', pR: 'up' }, keys: [{ t: 0 }] },
  idleQ: { dur: 0.01, base: { vis: 'qmark', tilt: 0.18, rotY: 0.15 }, keys: [{ t: 0 }] },
  // 打招呼是 P2：靜態加呼吸，只換姿勢不擺動；兩手都在動作，不提菜籃
  greet: { dur: 0.01, base: { 'aL.out': 2.35, 'aL.fwd': 0.45, hL: 'fist', pL: 'front', hatY: 0.08, hatX: -0.2, hatZ: 0.12, ...WAVE_R }, keys: [{ t: 0 }] },
  checkout: {
    dur: 0.6, base: { vis: 'headset', ...WAVE_R },
    keys: [{ t: 0 }, { t: 0.6 }], osc: [{ key: 'tilt', amp: 0.07, freq: 1.67, t0: 0, t1: 0.6 }],
  },
  // 共用動作
  enter: { dur: 0.6, base: IDLE, keys: [{ t: 0, y: -1.6 }, { t: 0.36, y: 0.12, ease: 'out' }, { t: 0.46, y: 0, sy: 0.86, sx: 1.1 }, { t: 0.6 }] },
  tap: { dur: 0.4, base: IDLE, keys: [{ t: 0 }, { t: 0.15, y: 0.2, rotY: 0 }, { t: 0.3, y: 0, rotY: 0 }, { t: 0.4, rotY: 0 }] },
  yieldTo: { dur: 1.3, base: IDLE, keys: [{ t: 0 }, { t: 0.25, y: -1.8 }, { t: 0.95, y: -1.8 }, { t: 1.3, y: 0 }] },
  toLow: { dur: 0.8, base: {}, keys: [{ t: 0, ...IDLE }, { t: 0.8, ...SIT }] },
  restore: { dur: 0.6, base: {}, keys: [{ t: 0, ...SIT }, { t: 0.35, ...IDLE, y: 0.1 }, { t: 0.5, ...IDLE, y: 0 }, { t: 0.6, ...IDLE }] },
};

/* ---------- 播放器 ---------- */
const ease = { io: t => t * t * (3 - 2 * t), out: t => 1 - (1 - t) * (1 - t), in: t => t * t, lin: t => t };
function fullKey(action, k) { return Object.assign({}, BASE, action.base || {}, k); }

export class Player {
  constructor(yyb) {
    this.yyb = yyb; this.fx = new FX(yyb.group); this.t = 0; this.action = null; this.fired = new Set(); this.breath = 0;
    this.play('idle');
  }
  play(name) {
    this.name = name; this.action = ACTIONS[name]; this.t = 0; this.fired = new Set(); this.fx.clear();
    this.keys = this.action.keys.map(k => fullKey(this.action, k));
    this.noBreath = name === 'low' || name === 'toLow';
  }
  sample(t) {
    const K = this.keys;
    if (t <= K[0].t || K.length === 1) return Object.assign({}, K[0]);
    let i = 0; while (i < K.length - 1 && t > K[i + 1].t) i++;
    if (i >= K.length - 1) return Object.assign({}, K[K.length - 1]);
    const a = K[i], b = K[i + 1], u = (t - a.t) / Math.max(1e-6, b.t - a.t), e = (ease[b.ease] || ease.io)(Math.min(1, Math.max(0, u)));
    const out = {};
    for (const k in a) {
      if (k === 't' || k === 'ease') continue;
      const va = a[k], vb = b[k];
      out[k] = (typeof va === 'number' && typeof vb === 'number') ? va + (vb - va) * e : va;
    }
    for (const k in b) if (!(k in out) && k !== 't' && k !== 'ease') out[k] = b[k];
    return out;
  }
  update(dt) {
    this.t += dt; this.breath += dt;
    const A = this.action, s = this.sample(this.t);
    for (const o of (A.osc || [])) if (this.t >= o.t0 && this.t <= o.t1) {
      const u = (this.t - o.t0) / (o.t1 - o.t0); s[o.key] += Math.sin((this.t - o.t0) * o.freq * PI * 2) * o.amp * Math.sin(u * PI);
    }
    if (!this.noBreath && this.t >= A.dur) { const b = Math.sin(this.breath / 3.4 * PI * 2); s.sy *= 1 + b * 0.012; s.sx *= 1 - b * 0.006; s.y += (b + 1) * 0.012; }
    for (const f of (A.fx || [])) if (!this.fired.has(f) && this.t >= f.t) { this.fired.add(f); this.fx.spawn(f.type, f); }
    this.yyb.apply(s); this.fx.update(dt);
  }
}

/* ---------- 場景 ---------- */
export function makeScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfb4, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(-3, 5, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff4e0, 0.55); fill.position.set(4, 1.5, 3); scene.add(fill);
  const back = new THREE.DirectionalLight(0xffffff, 0.5); back.position.set(0, 4, -5); scene.add(back);
  return scene;
}
export function makeCamera(aspect = 1.25) {
  const cam = new THREE.PerspectiveCamera(26, aspect, 0.1, 100); cam.position.set(0, 2.6, 9.8); cam.lookAt(0, 1.62, 0); return cam;
}
export { THREE };
