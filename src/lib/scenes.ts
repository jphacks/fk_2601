import type { Photo } from "./image";

// 見本の「写真」。会場やデモで、撮影できない・AI が使えないときにも、囲む操作から最後まで試せるようにする絵

export type SceneKey = "gacha" | "signal" | "ice";

export const SCENE_KEYS: SceneKey[] = ["gacha", "signal", "ice"];

export const SCENE_NAMES: Record<SceneKey, string> = {
  gacha: "ガチャガチャ",
  signal: "しんごう",
  ice: "こおりの コップ",
};

const WIDTH = 900;
const HEIGHT = 1200;
const FONT = '"Hiragino Maru Gothic ProN", "BIZ UDPGothic", "Yu Gothic UI", "Meiryo", sans-serif';

type Ctx = CanvasRenderingContext2D;

function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function verticalGradient(c: Ctx, y0: number, y1: number, from: string, to: string): CanvasGradient {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

function capsule(c: Ctx, x: number, y: number, r: number, color: string, rot: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fillStyle = "#FFFFFF";
  c.fill();
  c.beginPath();
  c.arc(0, 0, r, Math.PI, 0);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = "rgba(40,50,70,.55)";
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(-r, 0);
  c.lineTo(r, 0);
  c.stroke();
  c.beginPath();
  c.arc(-r * 0.38, -r * 0.45, r * 0.18, 0, Math.PI * 2);
  c.fillStyle = "rgba(255,255,255,.75)";
  c.fill();
  c.restore();
}

function gachaMachine(c: Ctx, x: number, y: number, body: string, dark: string, rnd: () => number, main: boolean) {
  c.fillStyle = "rgba(0,0,0,.16)";
  c.beginPath();
  c.ellipse(x + 200, y + 802, 235, 22, 0, 0, Math.PI * 2);
  c.fill();
  roundRect(c, x, y, 400, 56, 18);
  c.fillStyle = body;
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = dark;
  c.stroke();
  roundRect(c, x + 20, y + 50, 360, 390, 24);
  c.fillStyle = "rgba(232,244,252,.96)";
  c.fill();
  c.save();
  roundRect(c, x + 20, y + 50, 360, 390, 24);
  c.clip();
  const colors = ["#FF5A5F", "#3FA7F5", "#FFD23F", "#6CCB7F", "#A97BF2", "#FF9F43"];
  for (let row = 0; row < 6; row++) {
    const cy = y + 408 - row * 52;
    for (let i = 0; i < 8; i++) {
      const cx = x + 50 + i * 47 + (row % 2) * 22 + (rnd() - 0.5) * 10;
      capsule(c, cx, cy + (rnd() - 0.5) * 8, 28, colors[Math.floor(rnd() * colors.length)], rnd() * Math.PI);
    }
  }
  c.fillStyle = "rgba(255,255,255,.5)";
  roundRect(c, x + 46, y + 74, 30, 330, 15);
  c.fill();
  c.restore();
  roundRect(c, x + 20, y + 50, 360, 390, 24);
  c.lineWidth = 6;
  c.strokeStyle = "#8FA3B5";
  c.stroke();
  roundRect(c, x, y + 430, 400, 360, 22);
  c.fillStyle = body;
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = dark;
  c.stroke();
  if (main) {
    roundRect(c, x + 45, y + 455, 310, 112, 14);
    c.fillStyle = "#FFFFFF";
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = dark;
    c.stroke();
    c.fillStyle = "#1B2A4E";
    c.textAlign = "center";
    const write = (text: string, size: number, weight: number, at: number) => {
      let s = size;
      do {
        c.font = `${weight} ${s}px ${FONT}`;
        s -= 2;
      } while (c.measureText(text).width > 284 && s > 16);
      c.fillText(text, x + 200, y + at);
    };
    write("ぜんぶで 10しゅるい", 44, 900, 506);
    write("1かい 300えん", 32, 700, 551);
  }
  c.beginPath();
  c.arc(x + 200, y + 650, 62, 0, Math.PI * 2);
  c.fillStyle = "#F4F5F7";
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = "#4B5563";
  c.stroke();
  roundRect(c, x + 148, y + 635, 104, 30, 12);
  c.fillStyle = "#C9CFD8";
  c.fill();
  c.lineWidth = 5;
  c.stroke();
  roundRect(c, x + 135, y + 720, 130, 54, 16);
  c.fillStyle = "#2B2222";
  c.fill();
  roundRect(c, x + 330, y + 610, 22, 70, 7);
  c.fillStyle = "#333";
  c.fill();
  roundRect(c, x - 10, y + 785, 420, 26, 8);
  c.fillStyle = dark;
  c.fill();
}

function drawGacha(c: Ctx, W: number, H: number) {
  const rnd = rng(7);
  c.fillStyle = verticalGradient(c, 0, H, "#EEF2F7", "#D3DCE8");
  c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.4)";
  for (let x = 0; x < W; x += 90) c.fillRect(x, 0, 38, 1000);
  c.fillStyle = "#BFA88A";
  c.fillRect(0, 1000, W, H - 1000);
  c.fillStyle = "rgba(0,0,0,.08)";
  for (let x = -40; x < W; x += 120) c.fillRect(x, 1000, 4, H - 1000);
  gachaMachine(c, -262, 210, "#3D8BE0", "#1E4E85", rnd, false);
  gachaMachine(c, 762, 210, "#2FB27A", "#18664A", rnd, false);
  gachaMachine(c, 250, 210, "#E2453C", "#7A1E19", rnd, true);
}

function drawSignal(c: Ctx, W: number, H: number) {
  const rnd = rng(11);
  c.fillStyle = verticalGradient(c, 0, 900, "#79C5F2", "#D9F1FF");
  c.fillRect(0, 0, W, 900);
  const cloud = (x: number, y: number, s: number) => {
    c.fillStyle = "rgba(255,255,255,.92)";
    for (const [dx, dy, r] of [[0, 0, 1], [0.9, -0.35, 0.8], [1.7, 0, 0.9], [0.9, 0.2, 0.9]]) {
      c.beginPath();
      c.arc(x + dx * 60 * s, y + dy * 60 * s, 55 * s * r, 0, Math.PI * 2);
      c.fill();
    }
  };
  cloud(120, 140, 0.9);
  cloud(640, 110, 1.1);
  for (const [x, y, w, h] of [[0, 610, 170, 290], [150, 560, 120, 340], [610, 600, 150, 300], [760, 520, 140, 380]]) {
    c.fillStyle = "#B7C6D6";
    c.fillRect(x, y, w, h);
    c.fillStyle = "rgba(255,255,255,.55)";
    for (let wy = y + 24; wy < y + h - 30; wy += 46) for (let wx = x + 18; wx < x + w - 28; wx += 40) c.fillRect(wx, wy, 22, 26);
  }
  c.fillStyle = "#6B4A2B";
  c.fillRect(92, 760, 18, 130);
  c.fillRect(212, 790, 16, 100);
  c.fillStyle = "#5DB36A";
  for (const [x, y, r] of [[100, 730, 90], [40, 790, 60], [220, 770, 70], [170, 720, 55]]) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#C7CCD3";
  c.fillRect(0, 880, W, 42);
  c.fillStyle = "#9EA4AD";
  c.fillRect(0, 918, W, 6);
  c.fillStyle = "#4B5059";
  c.fillRect(0, 924, W, H - 924);
  c.fillStyle = "#F2F2F2";
  for (let x = 18; x < W; x += 112) c.fillRect(x, 962, 64, 190);
  c.fillStyle = "rgba(255,255,255,.08)";
  for (let i = 0; i < 300; i++) c.fillRect(rnd() * W, 924 + rnd() * (H - 924), 3, 3);
  roundRect(c, 660, 236, 36, 690, 10);
  c.fillStyle = "#8B929C";
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = "#5F6670";
  c.stroke();
  roundRect(c, 150, 286, 546, 26, 10);
  c.fill();
  c.stroke();
  roundRect(c, 116, 322, 478, 172, 36);
  c.fillStyle = "#A5ADB7";
  c.fill();
  c.lineWidth = 6;
  c.stroke();
  const lamps: [number, string, boolean][] = [[200, "#16D9B0", true], [355, "#6B5E2E", false], [510, "#5E2B2B", false]];
  for (const [lx, color, lit] of lamps) {
    c.beginPath();
    c.arc(lx, 408, 72, Math.PI * 1.02, Math.PI * 1.98);
    c.lineTo(lx + 70, 396);
    c.lineTo(lx - 70, 396);
    c.closePath();
    c.fillStyle = "#7E8590";
    c.fill();
    c.save();
    if (lit) {
      c.shadowColor = "rgba(60,255,214,.95)";
      c.shadowBlur = 60;
      const rg = c.createRadialGradient(lx - 14, 395, 6, lx, 408, 58);
      rg.addColorStop(0, "#C9FFF3");
      rg.addColorStop(1, color);
      c.fillStyle = rg;
    } else {
      c.fillStyle = color;
    }
    c.beginPath();
    c.arc(lx, 410, 56, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.lineWidth = 5;
    c.strokeStyle = "#4A5059";
    c.beginPath();
    c.arc(lx, 410, 56, 0, Math.PI * 2);
    c.stroke();
  }
  roundRect(c, 588, 560, 116, 186, 16);
  c.fillStyle = "#A5ADB7";
  c.fill();
  c.lineWidth = 5;
  c.strokeStyle = "#5F6670";
  c.stroke();
  roundRect(c, 606, 576, 80, 72, 10);
  c.fillStyle = "#4E2626";
  c.fill();
  c.save();
  c.shadowColor = "rgba(60,255,214,.9)";
  c.shadowBlur = 30;
  roundRect(c, 606, 658, 80, 72, 10);
  c.fillStyle = "#16D9B0";
  c.fill();
  c.restore();
  c.strokeStyle = "#FFFFFF";
  c.lineWidth = 6;
  c.lineCap = "round";
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.arc(646, 672, 7, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(646, 680);
  c.lineTo(642, 702);
  c.lineTo(632, 718);
  c.moveTo(642, 702);
  c.lineTo(656, 718);
  c.moveTo(644, 688);
  c.lineTo(632, 696);
  c.moveTo(644, 688);
  c.lineTo(658, 694);
  c.stroke();
}

function drawIce(c: Ctx, W: number, H: number) {
  const rnd = rng(23);
  c.fillStyle = verticalGradient(c, 0, 780, "#DCEFEA", "#C6DDD7");
  c.fillRect(0, 0, W, 780);
  c.fillStyle = "rgba(255,255,255,.35)";
  c.beginPath();
  c.moveTo(620, 0);
  c.lineTo(820, 0);
  c.lineTo(700, 780);
  c.lineTo(500, 780);
  c.closePath();
  c.fill();
  c.fillStyle = verticalGradient(c, 760, H, "#D8A367", "#BD8146");
  c.fillRect(0, 760, W, H - 760);
  c.fillStyle = "#E9BC83";
  c.fillRect(0, 760, W, 14);
  c.strokeStyle = "rgba(110,60,20,.18)";
  c.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const y = 800 + i * 46;
    c.beginPath();
    c.moveTo(0, y);
    c.bezierCurveTo(250, y - 18 + rnd() * 30, 600, y + 20 - rnd() * 30, W, y + (rnd() - 0.5) * 20);
    c.stroke();
  }
  c.fillStyle = "#F3EBDD";
  c.beginPath();
  c.ellipse(450, 1000, 232, 54, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#D2C2A8";
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(450, 1000, 200, 44, 0, 0, Math.PI * 2);
  c.stroke();
  const top = 330;
  const bot = 985;
  const xl = (y: number) => 300 + (45 * (y - top)) / (bot - top);
  const xr = (y: number) => 600 - (45 * (y - top)) / (bot - top);
  const glass = () => {
    c.beginPath();
    c.moveTo(xl(top), top);
    c.lineTo(xl(bot), bot);
    c.lineTo(xr(bot), bot);
    c.lineTo(xr(top), top);
    c.closePath();
  };
  glass();
  c.fillStyle = "rgba(232,246,255,.55)";
  c.fill();
  const wl = 545;
  const water = () => {
    c.beginPath();
    c.moveTo(xl(wl), wl);
    c.lineTo(xl(bot), bot);
    c.lineTo(xr(bot), bot);
    c.lineTo(xr(wl), wl);
    c.closePath();
  };
  water();
  c.fillStyle = "rgba(105,180,232,.55)";
  c.fill();
  const cube = (cx: number, cy: number, s: number, a: number) => {
    c.save();
    c.translate(cx, cy);
    c.rotate(a);
    roundRect(c, -s / 2, -s / 2, s, s, 14);
    c.fillStyle = "rgba(240,252,255,.93)";
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = "#8EC3E3";
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.95)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-s / 2 + 14, -s / 2 + 22);
    c.lineTo(-s / 2 + 14, s / 2 - 26);
    c.stroke();
    c.restore();
  };
  cube(452, 590, 76, 0.08);
  cube(394, 522, 92, -0.2);
  cube(503, 510, 86, 0.24);
  c.save();
  water();
  c.clip();
  c.fillStyle = "rgba(105,180,232,.3)";
  c.fillRect(0, wl + 4, W, bot);
  c.restore();
  c.fillStyle = "rgba(175,218,246,.7)";
  c.beginPath();
  c.ellipse(450, wl, (xr(wl) - xl(wl)) / 2, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  glass();
  c.clip();
  for (let i = 0; i < 80; i++) {
    const y = 575 + rnd() * 390;
    const left = rnd() < 0.5;
    const edge = left ? xl(y) + 8 + rnd() * 55 : xr(y) - 8 - rnd() * 55;
    const x = rnd() < 0.25 ? xl(y) + 60 + rnd() * (xr(y) - xl(y) - 120) : edge;
    const r = 4 + rnd() * 7;
    c.beginPath();
    c.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(255,255,255,.6)";
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = "rgba(110,150,180,.55)";
    c.stroke();
    c.beginPath();
    c.arc(x - r * 0.3, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    c.fillStyle = "rgba(255,255,255,.95)";
    c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.6)";
  c.lineWidth = 5;
  for (const [x, y, l] of [[340, 700, 90], [565, 760, 70], [370, 840, 60]]) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 2, y + l);
    c.stroke();
  }
  c.fillStyle = "rgba(255,255,255,.45)";
  c.beginPath();
  c.moveTo(xl(top) + 22, top + 20);
  c.lineTo(xl(bot) + 22, bot - 30);
  c.lineTo(xl(bot) + 44, bot - 30);
  c.lineTo(xl(top) + 50, top + 20);
  c.closePath();
  c.fill();
  c.restore();
  glass();
  c.lineWidth = 6;
  c.strokeStyle = "#90AFC3";
  c.stroke();
  c.beginPath();
  c.ellipse(450, top, 150, 18, 0, 0, Math.PI * 2);
  c.lineWidth = 5;
  c.stroke();
  c.fillStyle = "rgba(200,225,240,.75)";
  c.beginPath();
  c.ellipse(450, bot, 106, 16, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
}

const DRAW: Record<SceneKey, (c: Ctx, w: number, h: number) => void> = {
  gacha: drawGacha,
  signal: drawSignal,
  ice: drawIce,
};

/** 見本の絵を、写真と同じ形（Photo）で返す。ブラウザだけで動く */
export function scenePhoto(key: SceneKey): Photo {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("canvas を使えません");
  DRAW[key](c, WIDTH, HEIGHT);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: WIDTH, height: HEIGHT };
}

/** ホームに並べる小さな絵を、canvas に描く（180×240） */
export function paintThumb(target: HTMLCanvasElement, key: SceneKey) {
  const full = document.createElement("canvas");
  full.width = WIDTH;
  full.height = HEIGHT;
  const c = full.getContext("2d");
  if (!c) return;
  DRAW[key](c, WIDTH, HEIGHT);
  target.width = 180;
  target.height = 240;
  target.getContext("2d")?.drawImage(full, 0, 0, 180, 240);
}
