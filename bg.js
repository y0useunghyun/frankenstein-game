// 배경 도트. 장면마다 far(멀리, 천천히 움직임) + near(바닥·건물·소품).
// 물건 위치(things.x)는 index.html 기준 그대로 — 여기서 좌표를 바꾸면 게임 위치도 확인할 것.
const BG_H = 144, BG_FLOOR = 118;
const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// 하늘: 색 띠 사이를 4×4 디더링으로 섞음
function sky(g, w, y0, y1, cols) {
  for (let y = y0; y < y1; y++) {
    const f = (y - y0) / (y1 - y0) * (cols.length - 1), i = Math.min(cols.length - 2, f | 0), k = f - i;
    for (let x = 0; x < w; x++) px(g, x, y, 1, 1, k * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? cols[i + 1] : cols[i]);
  }
}
function speck(g, x, y, w, h, c, n, seed) { const r = rnd(seed); for (let i = 0; i < n; i++) px(g, x + r() * w, y + r() * h, 1, 1, c); }
function stars(g, w, h, n, seed) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, b = r(); px(g, x, y, 1, 1, b > 0.85 ? '#e8ecff' : b > 0.5 ? '#9aa6c8' : '#5c6688');
    if (b > 0.96) { px(g, x - 1, y, 3, 1, '#5c6688'); px(g, x, y - 1, 1, 3, '#5c6688'); px(g, x, y, 1, 1, '#ffffff'); } }
}
function moon(g, x, y, r, c, halo) {
  for (let dy = -r - 6; dy <= r + 6; dy++) for (let dx = -r - 6; dx <= r + 6; dx++) {
    const d = Math.hypot(dx, dy);
    if (d <= r) px(g, x + dx, y + dy, 1, 1, (dx + dy > r * 0.6 && d > r * 0.55) ? halo[0] : c);
    else if (d <= r + 6 && BAYER[((y + dy) & 3) * 4 + ((x + dx) & 3)] < (r + 6 - d) * 1.6) px(g, x + dx, y + dy, 1, 1, halo[1]);
  }
  px(g, x - 2, y - 1, 2, 2, halo[0]); px(g, x + 1, y + 2, 1, 1, halo[0]);
}
// 산 능선: 열마다 높이, 왼쪽 빛·오른쪽 그늘, 위는 눈
function range(g, w, base, amp, seed, c, shade, snow, snowLine) {
  const big = x => 0.3 * Math.sin(x * 0.023 + seed) + 0.15 * Math.sin(x * 0.071 + seed * 3);
  const h = x => base - amp * (0.55 + big(x) + 0.06 * Math.sin(x * 0.19 + seed));
  for (let x = 0; x < w; x++) {
    const y = h(x) | 0, slope = big(x - 3) - big(x + 3);   // 큰 굴곡만 보고 빛·그늘 → 세로 줄무늬 없음
    px(g, x, y, 1, BG_H - y, slope > 0 ? shade : c);
    if (snow && y < snowLine) { const d = (snowLine - y) * 0.6 + ((x * 7) % 3); px(g, x, y, 1, d, slope > 0 ? snow[1] : snow[0]); }
  }
}
function pine(g, x, base, h, dark, mid, lite, snow) {
  px(g, x - 1, base - 6, 3, 6, '#2a1f18');
  for (let i = 0; i < h; i++) {
    const tier = (i % 9) / 9, wdt = Math.round((i / h) * h * 0.42 * (0.55 + tier * 0.45)) + 1;
    const y = base - h - 4 + i;
    px(g, x - wdt, y, wdt * 2 + 1, 1, dark);
    px(g, x - wdt, y, Math.max(1, wdt * 0.6), 1, mid);
    if (tier > 0.7 && lite) px(g, x - wdt, y, 2, 1, lite);
    if (snow && tier < 0.25 && i > 2) px(g, x - wdt + 1, y, wdt * 2 - 1, 1, snow);
  }
}
function leafTree(g, x, base, s, trunk, cols, seed) {
  px(g, x - 1, base - s * 1.1, 3, s * 1.1, trunk); px(g, x + 1, base - s * 1.1, 1, s * 1.1, '#00000033');
  const r = rnd(seed);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = r() * s * 0.7, bx = x + Math.cos(a) * d * 1.2, by = base - s * 1.5 + Math.sin(a) * d * 0.8, rr = 3 + r() * 4;
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) if (dx * dx + dy * dy <= rr * rr)
      px(g, bx + dx, by + dy, 1, 1, dy < -rr * 0.3 ? cols[2] : dx > rr * 0.3 ? cols[0] : cols[1]);
  }
}
function planks(g, x, y, w, h, base, dark, lite, vertical, seed) {
  px(g, x, y, w, h, base); const r = rnd(seed);
  if (vertical) for (let i = x; i < x + w; i += 6) { px(g, i, y, 1, h, dark); for (let j = 0; j < 3; j++) px(g, i + 2 + (r() * 3 | 0), y + r() * h, 1, 2 + r() * 4, lite); }
  else for (let j = y; j < y + h; j += 4) { px(g, x, j, w, 1, dark); for (let i = 0; i < w / 10; i++) px(g, x + r() * w, j + 2, 3 + r() * 6, 1, lite); for (let i = x + (r() * 20 | 0); i < x + w; i += 18 + (r() * 14 | 0)) px(g, i, j, 1, 4, dark); }
}
function stonewall(g, x, y, w, h, base, dark, lite, seed) {
  px(g, x, y, w, h, base); const r = rnd(seed);
  for (let j = y, row = 0; j < y + h; j += 7, row++) {
    px(g, x, j, w, 1, dark);
    for (let i = x - (row % 2) * 6; i < x + w; i += 10 + (r() * 6 | 0)) { px(g, i, j, 1, 7, dark); px(g, i + 1, j + 1, 4, 1, lite); }
  }
  speck(g, x, y, w, h, dark, w * h / 40, seed + 1);
}
function cobbles(g, x, y, w, h, base, dark, lite, seed) {
  px(g, x, y, w, h, base); const r = rnd(seed);
  for (let j = y + 1; j < y + h; j += 4) for (let i = x - (j % 8 ? 3 : 0); i < x + w; i += 7) {
    px(g, i, j, 6, 3, r() > 0.5 ? base : lite); px(g, i, j + 3, 6, 1, dark); px(g, i + 6, j, 1, 3, dark); px(g, i + 1, j, 2, 1, '#ffffff18');
  }
}
function grass(g, x, y, w, c, lite, seed) {
  const r = rnd(seed);
  for (let i = x; i < x + w; i += 2 + (r() * 4 | 0)) { const h = 1 + (r() * 4 | 0); px(g, i, y - h, 1, h, r() > 0.7 ? lite : c); }
}
function snowGround(g, x, y, w, h, base, shade, lite, seed) {
  px(g, x, y, w, h, base); const r = rnd(seed);
  for (let i = 0; i < w / 6; i++) { const sx = x + r() * w, sy = y + 2 + r() * (h - 4), sw = 4 + r() * 12; px(g, sx, sy, sw, 1, shade); px(g, sx + 1, sy - 1, sw - 2, 1, lite); }
}
function windowFrame(g, x, y, w, h, frame, glass, sill) {
  px(g, x - 2, y - 2, w + 4, h + 4, frame); px(g, x, y, w, h, glass);
  px(g, x + (w >> 1) - 1, y, 2, h, frame); px(g, x, y + (h >> 1) - 1, w, 2, frame);
  px(g, x - 3, y + h + 2, w + 6, 2, sill);
}
function smoke(g, x, y, seed) { const r = rnd(seed); for (let i = 0; i < 14; i++) px(g, x + Math.sin(i * 0.7) * 3 + r() * 2, y - i * 3, 2 + (i >> 2), 2, `rgba(200,200,215,${0.35 - i * 0.022})`); }
function aurora(g, w) {
  for (let x = 0; x < w; x++) {
    const top = 18 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.011 + 2) * 10, len = 18 + Math.sin(x * 0.05 + 1) * 8;
    for (let i = 0; i < len; i++) if (BAYER[((top + i | 0) & 3) * 4 + (x & 3)] < 16 * (1 - i / len) * 0.7)
      px(g, x, top + i, 1, 1, i < 3 ? '#a8f0c8' : i < len * 0.5 ? '#4fb488' : '#2d6e5e');
  }
}
function waves(g, x, y, w, h, base, lite, seed) {
  px(g, x, y, w, h, base); const r = rnd(seed);
  for (let i = 0; i < w * h / 30; i++) { const wx = x + r() * w, wy = y + r() * h; px(g, wx, wy, 2 + r() * 5, 1, lite); }
}

// ───────── 장면 그림 ─────────
const ART = {
  // 1. 잉골슈타트 꼭대기 층 작업실 (실내, far 없음)
  lab: {
    near(g, w) {
      stonewall(g, 0, 0, w, BG_FLOOR, '#221f2c', '#18161f', '#2c2838', 11);
      for (let x = 0; x < w; x++) px(g, x, 0, 1, 14 + Math.abs(((x + 40) % 120) - 60) * 0.25, '#14121a');           // 지붕 경사
      [40, 160, 280].forEach(x => { for (let i = 0; i < 30; i++) px(g, x - 30 + i, i * 0.5, 3, 2, '#3a2d22'); for (let i = 0; i < 30; i++) px(g, x + i, 15 - i * 0.5, 3, 2, '#3a2d22'); });
      [8, 152, 242, 312].forEach(x => { px(g, x, 14, 5, BG_FLOOR - 14, '#33271e'); px(g, x, 14, 1, BG_FLOOR - 14, '#4a3a2c'); });
      // 선반: 병·책
      px(g, 100, 46, 50, 3, '#4a3a2c'); px(g, 100, 66, 50, 3, '#4a3a2c');
      [[103, '#5f8f6a'], [111, '#8f5f6a'], [118, '#6a7a9f'], [128, '#9f8f5f'], [136, '#5f8f8a']].forEach(([x, c], i) => { px(g, x, 36 + (i % 2) * 2, 5, 10 - (i % 2) * 2, c); px(g, x + 1, 35 + (i % 2) * 2, 3, 1, '#b8c0c8'); px(g, x + 1, 39, 1, 4, '#ffffff33'); });
      ['#6b3a2e', '#3e4a6b', '#5b5030', '#6b3a2e', '#2e4a3a', '#4a3a5b'].forEach((c, i) => px(g, 102 + i * 6, 54 + (i % 3), 5, 12 - (i % 3), c));
      px(g, 140, 56, 8, 10, '#d8cfb8'); px(g, 141, 58, 6, 1, '#8a8070');                                                 // 두개골 같은 것
      // 해부도
      px(g, 210, 28, 22, 30, '#cbbf9e'); px(g, 211, 29, 20, 28, '#d9cfb0'); px(g, 219, 32, 4, 4, '#8a5a4a'); px(g, 220, 36, 2, 12, '#8a5a4a'); px(g, 216, 38, 10, 1, '#8a5a4a'); px(g, 218, 48, 1, 7, '#8a5a4a'); px(g, 223, 48, 1, 7, '#8a5a4a');
      // 창 + 달빛 기둥
      windowFrame(g, 162, 32, 36, 42, '#0f0e16', '#2b3550', '#3a2d22'); px(g, 186, 38, 6, 6, '#e8dca0'); px(g, 187, 39, 3, 1, '#fff6c8');
      for (let y = 74; y < BG_FLOOR + 10; y++) { const k = (y - 74) * 0.5; for (let x = 162 + k; x < 198 + k + 6; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < 5) px(g, x, y, 1, 1, '#3c4566'); }
      // 거미줄
      for (let i = 0; i < 10; i++) { px(g, 12 + i, 16 + i * 0.6, 1, 1, '#4a4858'); px(g, 12 + i * 0.7, 16 + i, 1, 1, '#4a4858'); }
      // 바닥 판자 + 깔개
      planks(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#2e2630', '#211b24', '#3a3040', false, 12);
      px(g, 120, BG_FLOOR + 6, 70, 14, '#4a2a2e'); px(g, 122, BG_FLOOR + 8, 66, 10, '#5b3338'); for (let i = 124; i < 186; i += 6) px(g, i, BG_FLOOR + 12, 3, 2, '#8a5a3a');
      // 작업대 (몸이 눕는 곳: 윗면 y 92)
      planks(g, 18, 92, 74, 6, '#4a3a2c', '#33271e', '#5e4a38', false, 13); px(g, 18, 97, 74, 1, '#22190f');
      px(g, 23, 98, 5, 20, '#3a2d22'); px(g, 82, 98, 5, 20, '#3a2d22'); px(g, 28, 108, 54, 2, '#33271e');
      px(g, 40, 104, 8, 4, '#6a6a72'); px(g, 56, 103, 6, 5, '#7a6a5a');                                                 // 아래 도구
      // 문: 판자 + 쇠 경첩
      planks(g, 280, 54, 26, 64, '#3a2d22', '#2a2019', '#4a3a2c', true, 14); px(g, 278, 52, 30, 2, '#2a2019');
      px(g, 280, 62, 10, 2, '#5c5c64'); px(g, 280, 100, 10, 2, '#5c5c64'); px(g, 300, 86, 2, 3, '#b8a070');
    },
  },
  // 2. 숲
  forest: {
    far(g, w) {
      sky(g, w, 0, 90, ['#0b1018', '#121c26', '#1b2a30', '#22383a']); stars(g, w, 60, 70, 21); moon(g, 60, 26, 7, '#e9e4c4', ['#c9c2a0', '#34465a']);
      range(g, w, 92, 28, 1.3, '#1a2a2c', '#152224');
      for (let x = 6; x < w; x += 9) pine(g, x, 100, 18 + (x * 13 % 10), '#14221f', '#182a25', null);
    },
    near(g, w) {
      for (let x = 4; x < w; x += 23) pine(g, x + (x * 7 % 9), BG_FLOOR, 34 + (x * 7 % 22), '#0f1c18', '#173029', '#24453a');
      px(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#1c2218'); speck(g, 0, BG_FLOOR, w, 26, '#272f20', w * 3, 22); speck(g, 0, BG_FLOOR, w, 26, '#141a12', w * 2, 23);
      grass(g, 0, BG_FLOOR + 1, w, '#26331f', '#3a4a2a', 24);
      [[60, 6], [150, 4], [300, 7], [370, 5]].forEach(([x, s]) => { px(g, x, BG_FLOOR - s + 2, s * 2, s, '#3a3f44'); px(g, x + 1, BG_FLOOR - s + 2, s, 1, '#56606a'); });
      px(g, 250, BG_FLOOR - 4, 34, 5, '#3a2a1e'); px(g, 250, BG_FLOOR - 4, 34, 1, '#4e3a28'); px(g, 282, BG_FLOOR - 5, 3, 7, '#5a4430');   // 쓰러진 통나무
      for (let i = 0; i < 8; i++) px(g, 110 + i * 2, BG_FLOOR - 2 - (i % 3), 1, 3 + (i % 3), '#2e4a2a');                // 고사리
    },
  },
  // 3. 드 라세 가족의 오두막
  cottage: {
    far(g, w) {
      sky(g, w, 0, 96, ['#0e0f1c', '#171a2c', '#232842', '#2c3350']); stars(g, w, 70, 80, 31);
      range(g, w, 98, 22, 2.1, '#1d2236', '#181c2e');
      for (let x = 12; x < w; x += 15) leafTree(g, x, 104, 10 + (x % 6), '#1a1a20', ['#141a24', '#18202c', '#1e2836'], x);
    },
    near(g, w) {
      px(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#22261c'); speck(g, 0, BG_FLOOR, w, 26, '#2c3224', w * 3, 32); grass(g, 0, BG_FLOOR + 1, w, '#2c3a24', '#3d4e2e', 33);
      // 오두막: 돌 기초 + 나무 벽 + 초가지붕 + 굴뚝
      stonewall(g, 108, 108, 114, 10, '#4a4652', '#34313c', '#5c5866', 34);
      planks(g, 110, 66, 110, 42, '#4a3a2c', '#33271e', '#5c4836', true, 35);
      for (let i = 0; i < 32; i++) { const y = 66 - i; px(g, 102 + i, y, 126 - i * 2, 1, i % 3 ? '#5e4a2c' : '#4a3a22'); }
      const r = rnd(36); for (let i = 0; i < 140; i++) { const y = 36 + r() * 30, half = 63 - (66 - y); px(g, 165 - half + r() * half * 2, y, 1, 3, '#7a6438'); }
      px(g, 102, 64, 126, 2, '#3a2d1c');
      px(g, 196, 26, 10, 18, '#4a4652'); px(g, 196, 26, 10, 2, '#5c5866'); smoke(g, 200, 24, 37);
      // 따뜻한 창 + 바닥에 번지는 빛
      windowFrame(g, 140, 80, 22, 18, '#3a2b1e', '#f2c26b', '#3a2b1e'); px(g, 141, 81, 9, 7, '#ffd98a');
      for (let y = BG_FLOOR; y < BG_FLOOR + 14; y++) for (let x = 130 + (y - BG_FLOOR); x < 172 - (y - BG_FLOOR) + 20; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < 4) px(g, x, y, 1, 1, '#4a4226');
      planks(g, 186, 86, 18, 32, '#2a2019', '#1c150f', '#3a2d22', true, 38); px(g, 200, 102, 2, 2, '#b8a070');
      // 장작더미 · 울타리
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) { px(g, 88 + i * 5 + j * 2, BG_FLOOR - 5 - j * 4, 5, 4, '#6a4a30'); px(g, 89 + i * 5 + j * 2, BG_FLOOR - 4 - j * 4, 2, 2, '#a07a50'); }
      for (let x = 0; x < 80; x += 8) { px(g, x, BG_FLOOR - 12, 2, 12, '#4a3a2c'); } px(g, 0, BG_FLOOR - 9, 80, 1, '#4a3a2c'); px(g, 0, BG_FLOOR - 5, 80, 1, '#4a3a2c');
      // 헛간 (괴물이 숨어 지낸 곳): 틈 사이로 어둠
      planks(g, 250, 92, 46, 26, '#3a2d22', '#20180f', '#4a3a2c', true, 39); for (let x = 254; x < 296; x += 6) px(g, x, 96, 1, 18, '#0e0b08');
      for (let i = 0; i < 14; i++) px(g, 247 + i, 92 - i, 52 - i * 2, 1, i % 2 ? '#4a3a22' : '#3a2d1c');
      // 밭고랑
      for (let x = 340; x < w; x += 6) { px(g, x, BG_FLOOR + 4, 4, 1, '#3a3020'); px(g, x + 1, BG_FLOOR + 3, 1, 1, '#4e6a34'); }
    },
  },
  // 4. 마을 (흐린 낮)
  village: {
    far(g, w) {
      sky(g, w, 0, 100, ['#5f6878', '#717b8a', '#87909c', '#9aa2aa']);
      const r = rnd(41); for (let i = 0; i < 9; i++) { const cx = r() * w, cy = 10 + r() * 30; for (let k = 0; k < 6; k++) px(g, cx + k * 6 - 10, cy + Math.sin(k) * 2, 14, 4, '#a7aeb6'); px(g, cx - 8, cy + 4, 40, 2, '#8a929c'); }
      range(g, w, 100, 20, 4.2, '#66705c', '#5a6450');
      for (let x = 0; x < w; x += 16) px(g, x, 96 + (x * 3 % 8), 16, 4, (x / 16) % 2 ? '#6e7a58' : '#7a8460');           // 밭 조각
      px(g, 180, 58, 10, 40, '#8a8478'); for (let i = 0; i < 12; i++) px(g, 185 - i / 2, 46 + i, i + 1, 1, '#5a4a44'); px(g, 184, 42, 2, 5, '#3a3a3a');  // 교회 첨탑
    },
    near(g, w) {
      cobbles(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#6a6658', '#4e4a40', '#7a7666', 42);
      [[60, 34], [190, 40], [320, 36]].forEach(([x, hh], n) => {
        const top = BG_FLOOR - hh;
        px(g, x, top, 56, hh, '#c8bca2'); speck(g, x, top, 56, hh, '#b4a88e', 60, 43 + n);
        px(g, x, top, 56, 2, '#5a3a2a'); px(g, x, top + hh * 0.5, 56, 2, '#5a3a2a'); px(g, x, top, 2, hh, '#5a3a2a'); px(g, x + 54, top, 2, hh, '#5a3a2a');
        for (let i = 0; i < 4; i++) { px(g, x + 6 + i * 14, top + 2, 1, hh * 0.5, '#5a3a2a'); }
        for (let i = 0; i < 20; i++) { px(g, x - 5 + i, top - i, 66 - i * 2, 1, i % 2 ? '#8a4a3a' : '#7a3e30'); if (i % 4 === 0) for (let k = x - 5 + i; k < x + 61 - i; k += 5) px(g, k, top - i, 1, 1, '#5e2e24'); }
        planks(g, x + 22, BG_FLOOR - 22, 12, 22, '#4a3a2c', '#33271e', '#5c4836', true, 44 + n); px(g, x + 31, BG_FLOOR - 12, 1, 2, '#b8a070');
        [[x + 6, top + 8], [x + 40, top + 8]].forEach(([wx, wy]) => { windowFrame(g, wx, wy, 10, 8, '#4a3a2c', '#3c4654', '#4a3a2c'); px(g, wx - 4, wy - 1, 3, 10, '#4e6a3a'); px(g, wx + 11, wy - 1, 3, 10, '#4e6a3a'); px(g, wx, wy + 10, 10, 2, '#b85a4a'); });
      });
      // 우물 · 수레
      stonewall(g, 140, BG_FLOOR - 10, 20, 10, '#7a7680', '#5a5662', '#8c8892', 47); px(g, 141, BG_FLOOR - 24, 2, 14, '#4a3a2c'); px(g, 157, BG_FLOOR - 24, 2, 14, '#4a3a2c'); px(g, 139, BG_FLOOR - 26, 22, 3, '#6a3a2e');
      px(g, 262, BG_FLOOR - 12, 26, 6, '#6a4a30'); px(g, 262, BG_FLOOR - 13, 26, 1, '#8a6a48'); [266, 282].forEach(x => { px(g, x - 3, BG_FLOOR - 7, 7, 7, '#3a2d22'); px(g, x - 1, BG_FLOOR - 5, 3, 3, '#6a4a30'); }); px(g, 288, BG_FLOOR - 9, 14, 1, '#5a4430');
    },
  },
  // 5. 몽탕베르 · 메르드글라스 빙하
  glacier: {
    far(g, w) {
      sky(g, w, 0, 80, ['#7d8ea2', '#93a3b4', '#aab8c6', '#c2ced8']);
      range(g, w, 64, 46, 3.1, '#8d97a6', '#6e7888', ['#f2f6fa', '#c8d4e0'], 44);
      range(g, w, 84, 30, 7.3, '#7c8696', '#5f6878', ['#e6eef4', '#b8c6d4'], 70);
    },
    near(g, w) {
      // 빙하: 크레바스 줄무늬
      for (let y = 96; y < BG_FLOOR; y++) for (let x = 0; x < w; x++) px(g, x, y, 1, 1, ((x + y * 3) % 23 < 2) ? '#7ea2c0' : ((x - y * 2) % 31 < 1) ? '#9bbad2' : y < 100 ? '#d6e4ee' : '#bfd2e2');
      for (let x = 0; x < w; x += 40) for (let i = 0; i < 12; i++) px(g, x + 10 + i * 1.5, 98 + i, 1, 2, '#5e82a2');
      snowGround(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#eef3f6', '#c8d4de', '#ffffff', 51);
      for (let x = 20; x < w; x += 70) pine(g, x, BG_FLOOR, 22 + (x % 9), '#2a3a34', '#34483f', '#4a6052', '#e8eef2');
      // 바위 (괴물과 마주하는 곳)
      px(g, 298, 96, 44, 22, '#5c5f6a'); px(g, 304, 90, 30, 8, '#6d707c'); px(g, 300, 96, 18, 2, '#7c808c'); px(g, 330, 98, 10, 20, '#4a4c56');
      px(g, 304, 88, 30, 3, '#f2f6fa'); px(g, 298, 94, 10, 2, '#f2f6fa'); speck(g, 298, 96, 44, 22, '#4a4c56', 40, 52);
      [[90, 4], [200, 6], [380, 5]].forEach(([x, s]) => { px(g, x, BG_FLOOR - s, s * 3, s, '#a8c4da'); px(g, x, BG_FLOOR - s, s * 3, 1, '#e2eef6'); });
    },
  },
  // 6. 북극 (괴물: 얼음은 300까지, 그 너머 바다)
  arctic: {
    far(g, w) {
      sky(g, w, 0, 100, ['#05070d', '#0a0e18', '#101828', '#16233a']); stars(g, w, 80, 120, 61); aurora(g, w);
      range(g, w, 102, 12, 5.5, '#1c2636', '#151d2a', ['#3a4a62', '#2a3850'], 98);
    },
    near(g, w, opt = {}) {
      const iceEnd = opt.iceEnd ?? 300;
      waves(g, 0, 100, w, BG_FLOOR - 100 + 26, '#0a1220', '#1e3048', 62);
      for (let x = 0; x < w; x += 37) { px(g, x + 8, 104 + (x % 6), 14, 3, '#9fb2c8'); px(g, x + 8, 104 + (x % 6), 14, 1, '#d8e4f0'); }       // 유빙
      snowGround(g, 0, BG_FLOOR, iceEnd, BG_H - BG_FLOOR, '#cdd8e4', '#a8b8ca', '#eef4fa', 63);
      for (let i = 0; i < 6; i++) { let x = 20 + i * 47, y = BG_FLOOR + 4; for (let k = 0; k < 10; k++) { px(g, x, y, 1, 1, '#8a9cb2'); x += 1 + (k % 2); y += (k % 3) ? 1 : 0; } }  // 얼음 균열
      px(g, iceEnd - 3, BG_FLOOR, 3, BG_H - BG_FLOOR, '#8fa0b2');
      for (let x = 0; x < iceEnd; x += 60) { px(g, x + 30, BG_FLOOR - 4, 12, 4, '#dfe8f2'); px(g, x + 32, BG_FLOOR - 6, 7, 2, '#eef4fa'); }  // 눈더미
    },
  },
  ship(g, x) {                                           // 월턴의 배 (x = 선체 왼쪽)
    planks(g, x, 86, 70, 14, '#3a2a1e', '#22180f', '#4e3a28', false, 71); for (let i = 0; i < 6; i++) px(g, x + i, 86 + i * 2, 1, 14 - i * 2, '#0a1220');
    px(g, x + 64, 84, 8, 4, '#3a2a1e'); px(g, x, 85, 72, 1, '#6a5038'); [10, 26, 42, 56].forEach(i => px(g, x + i, 90, 3, 3, '#f2c26b'));
    px(g, x + 30, 40, 2, 46, '#2a1f18'); px(g, x + 52, 52, 2, 34, '#2a1f18'); px(g, x + 18, 50, 26, 2, '#2a1f18'); px(g, x + 44, 60, 18, 2, '#2a1f18');
    px(g, x + 20, 52, 22, 14, '#b8bcc0'); px(g, x + 20, 52, 22, 1, '#d8dce0'); px(g, x + 46, 62, 14, 10, '#a8acb0');
    for (let i = 0; i < 30; i++) { px(g, x + 31 - i * 0.9, 42 + i * 1.4, 1, 1, '#2a1f18'); px(g, x + 31 + i * 1.2, 42 + i * 1.4, 1, 1, '#2a1f18'); }
    px(g, x + 34, 82, 3, 3, '#ffd98a');
  },
  // V1. 침실과 안뜰 (안뜰을 먼저 깔고 그 위에 침실)
  bedroom: {
    near(g, w) {
      sky(g, w, 0, 40, ['#0c0e12', '#121619']);
      stonewall(g, 200, 30, w - 200, BG_FLOOR - 30, '#262b2a', '#1a1e1d', '#30363a', 82);
      px(g, 246, 58, 40, 60, '#0e1012'); for (let a = 0; a <= 20; a++) { const xx = 266 + Math.cos(Math.PI * a / 20) * 20, yy = 58 - Math.sin(Math.PI * a / 20) * 14; px(g, xx - 1, yy - 1, 3, 3, '#3a3f3a'); }  // 아치문
      for (let x = 250; x < 284; x += 5) px(g, x, 62, 1, 56, '#2a2e2c');
      px(g, 318, 50, 3, 24, '#2a2e2c'); px(g, 314, 46, 11, 6, '#3a3f3a'); px(g, 316, 47, 7, 4, '#f2c26b');
      cobbles(g, 200, BG_FLOOR, w - 200, BG_H - BG_FLOOR, '#2c302c', '#1e2220', '#383c38', 83);
      [[220, 8], [300, 12]].forEach(([x, s]) => px(g, x, BG_FLOOR + 6, s, 2, '#3c4a5a'));                               // 물웅덩이
      // 침실
      px(g, 0, 0, 200, BG_FLOOR, '#2a2234'); for (let y = 4; y < BG_FLOOR; y += 10) for (let x = 4 + (y % 20 ? 5 : 0); x < 200; x += 10) { px(g, x, y, 1, 3, '#33293e'); px(g, x - 1, y + 1, 3, 1, '#33293e'); }  // 벽지
      px(g, 0, BG_FLOOR - 12, 200, 12, '#3a2d22'); px(g, 0, BG_FLOOR - 12, 200, 1, '#4e3e30');
      windowFrame(g, 62, 32, 32, 36, '#0f0e16', '#2b3550', '#3a2d22'); px(g, 84, 38, 6, 6, '#e8dca0');
      px(g, 56, 28, 6, 46, '#5b2f2f'); px(g, 94, 28, 6, 46, '#5b2f2f'); px(g, 54, 26, 48, 3, '#3a2d22');
      px(g, 98, 40, 3, 78, '#3a2d22'); px(g, 157, 40, 3, 78, '#3a2d22'); px(g, 96, 38, 66, 4, '#4a3a2c');               // 닫집 침대
      px(g, 101, 42, 16, 50, '#6b3434'); for (let y = 44; y < 92; y += 4) px(g, 101, y, 16, 1, '#5b2a2a');
      px(g, 100, 92, 60, 10, '#5a4030'); px(g, 102, 86, 14, 7, '#ece6d6'); px(g, 116, 88, 42, 5, '#7a6a8a'); px(g, 116, 88, 42, 1, '#9a8aaa');
      px(g, 170, 98, 14, 20, '#4a3a2c'); px(g, 175, 92, 3, 6, '#ece6d6'); px(g, 176, 89, 1, 3, '#f2a541');                 // 탁자·촛불
      planks(g, 0, BG_FLOOR, 200, BG_H - BG_FLOOR, '#2e2630', '#211b24', '#3a3040', false, 81);
      px(g, 200, 0, 5, BG_FLOOR, '#3a3f3a');
    },
  },
  // V2. 제네바 근교 폭풍우
  storm: {
    far(g, w) {
      sky(g, w, 0, 80, ['#0b0c14', '#14161f', '#1d2030', '#262a3c']);
      const r = rnd(91); for (let i = 0; i < 14; i++) { const cx = r() * w, cy = 6 + r() * 30; for (let k = 0; k < 8; k++) px(g, cx + k * 5 - 12, cy + Math.sin(k * 1.3) * 3, 12, 5, k % 2 ? '#20232f' : '#262a38'); }
      range(g, w, 82, 30, 2.4, '#181b28', '#13151f');
    },
    near(g, w) {
      waves(g, 0, 92, w, BG_FLOOR - 92, '#182030', '#2a3650', 92);
      for (let x = 0; x < w; x += 3) if ((x * 7) % 11 < 3) px(g, x, 92, 1, 1, '#3a4866');
      px(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#1c1f19'); speck(g, 0, BG_FLOOR, w, 26, '#262a20', w * 2, 93); grass(g, 0, BG_FLOOR + 1, w, '#26301f', '#34402a', 94);
      for (let x = 40; x < 200; x += 9) { px(g, x, BG_FLOOR - 8 - (x % 5), 1, 8 + (x % 5), '#3a4a2e'); px(g, x - 1, BG_FLOOR - 9 - (x % 5), 1, 2, '#4e5e36'); }  // 갈대
      [250, 300, 360].forEach((x, i) => { px(g, x, 70, 6, 48, '#2a2019'); px(g, x + 1, 70, 2, 48, '#3a2d22'); for (let k = 0; k < 6; k++) px(g, x + 6 + k, 78 - k * 2, 1, 1, '#2a2019');
        leafTree(g, x + 3, 108, 18, '#2a2019', ['#101a14', '#15221a', '#1c2c22'], 95 + i); });
    },
  },
  // V4. 오크니 외딴 작업장 (실내 + 창밖 바다)
  orkney: {
    near(g, w) {
      sky(g, w, 0, 50, ['#0a0d14', '#111722']); stars(g, w, 40, 24, 101);
      waves(g, 0, 50, w, 40, '#0e1824', '#22344a', 102);
      stonewall(g, 0, 40, w, BG_FLOOR - 40, '#3a3842', '#2a2830', '#4a4852', 103);
      for (let i = 0; i < 20; i++) px(g, 0, 40 - i, w, 1, i % 2 ? '#4a3e2a' : '#3a3020');                               // 초가 처마
      windowFrame(g, 222, 68, 26, 18, '#1a1820', '#1e3048', '#2a2830'); px(g, 222, 80, 26, 6, '#16263a'); px(g, 224, 81, 8, 1, '#3a5274');
      px(g, 60, 52, 4, 8, '#2a2830'); px(g, 59, 60, 6, 8, '#5a4a30'); px(g, 60, 61, 4, 6, '#f2c26b');                    // 등
      px(g, 260, 98, 22, 20, '#5a4430'); px(g, 260, 98, 22, 2, '#6e5640'); px(g, 266, 104, 10, 1, '#3a2d22');            // 상자
      px(g, 30, 96, 14, 22, '#4a4652'); px(g, 30, 96, 14, 2, '#5c5866'); px(g, 32, 90, 3, 6, '#6a7a8a');                  // 통
      planks(g, 100, 96, 70, 6, '#4a3a2c', '#33271e', '#5e4a38', false, 104); px(g, 104, 102, 4, 16, '#3a2d22'); px(g, 162, 102, 4, 16, '#3a2d22');
      planks(g, 0, BG_FLOOR, w, BG_H - BG_FLOOR, '#2e2a30', '#211e24', '#3a3640', false, 105);
    },
  },
};
