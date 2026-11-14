import { earnedTitleIds, type TitleStats } from "./titles";

// ナビを育てる（docs/02-spec.md 19章。#193）。
// ごほうびは「問いを見つけて ずかんに のこしたこと」に結びつける（点数・スタンプの数・称号）。予想が当たった数には結びつけない。
// 見た目は、ナビの画像の上に重ねる SVG（src/components/NaviDress.tsx）で、コードで描く

/** ナビの成長の段階。points はその段階になる点数（src/lib/progress.ts の progressPoints） */
export type NaviStage = { stage: number; name: string; points: number; look: string };

export const NAVI_STAGES: NaviStage[] = [
  { stage: 1, name: "ちびナビ", points: 0, look: "いつもの ナビ" },
  { stage: 2, name: "ナビ", points: 3, look: "ほっぺが きらきら" },
  { stage: 3, name: "げんきナビ", points: 8, look: "あたまに はっぱ" },
  { stage: 4, name: "きらきらナビ", points: 16, look: "まわりに ほし" },
  { stage: 5, name: "スーパーナビ", points: 30, look: "ぴかぴかの ひかり" },
];

/** 点数から、ナビの段階（1〜5） */
export function naviStage(points: number): number {
  let stage = 1;
  for (const s of NAVI_STAGES) if (points >= s.points) stage = s.stage;
  return stage;
}

export function naviStageInfo(stage: number): NaviStage {
  return NAVI_STAGES[Math.min(NAVI_STAGES.length, Math.max(1, stage)) - 1];
}

/** つぎの段階と、あと何点か（いちばん上なら null） */
export function nextNaviStage(points: number): { info: NaviStage; left: number } | null {
  const next = NAVI_STAGES.find((s) => points < s.points);
  return next ? { info: next, left: next.points - points } : null;
}

/** ホームなどに出すときの大きさ（段階が上がると、少しずつ大きくなる） */
export function naviSize(base: number, stage: number): number {
  return Math.round(base * [1, 1.05, 1.1, 1.15, 1.2][Math.min(5, Math.max(1, stage)) - 1]);
}

/** きせかえを つける場所。同じ場所には1つだけ つけられる */
export type OutfitSlot = "head" | "face" | "neck" | "back";

/** もらえる条件：スタンプ（ずかんの数）か しょうごう（もらった数）が n こ */
export type OutfitNeed = { kind: "stamps" | "titles"; n: number };

export type OutfitItem = { id: string; name: string; slot: OutfitSlot; need: OutfitNeed };

/** きせかえ（8こ）。ID は英小文字だけ。条件の小さい順 */
export const OUTFIT_ITEMS: OutfitItem[] = [
  { id: "ribbon", name: "リボン", slot: "head", need: { kind: "stamps", n: 1 } },
  { id: "glasses", name: "めがね", slot: "face", need: { kind: "stamps", n: 3 } },
  { id: "cap", name: "ぼうし", slot: "head", need: { kind: "stamps", n: 5 } },
  { id: "scarf", name: "マフラー", slot: "neck", need: { kind: "stamps", n: 10 } },
  { id: "cape", name: "マント", slot: "back", need: { kind: "titles", n: 3 } },
  { id: "stars", name: "ほしの めがね", slot: "face", need: { kind: "titles", n: 6 } },
  { id: "medal", name: "メダル", slot: "neck", need: { kind: "titles", n: 10 } },
  { id: "crown", name: "かんむり", slot: "head", need: { kind: "stamps", n: 30 } },
];

export function outfitItem(id: string): OutfitItem | undefined {
  return OUTFIT_ITEMS.find((i) => i.id === id);
}

/** 条件の いまの数（スタンプ＝ずかんの数／しょうごう＝もらった数） */
export function outfitValue(need: OutfitNeed, stats: TitleStats): number {
  return need.kind === "stamps" ? stats.total : earnedTitleIds(stats).length;
}

/** その きせかえを もらっているか */
export function outfitEarned(item: OutfitItem, stats: TitleStats): boolean {
  return outfitValue(item.need, stats) >= item.need.n;
}

/** 条件の文（「スタンプ 5こ」） */
export function outfitNeedLabel(need: OutfitNeed): string {
  return `${need.kind === "stamps" ? "スタンプ" : "{称号|しょうごう}"} ${need.n}こ`;
}

/** プロフィールに保存した ID から、知っている きせかえだけを取り出す（場所ごとに1つ。前のプロフィールには ない） */
export function wornOutfit(ids: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  const slots = new Set<OutfitSlot>();
  for (const id of ids ?? []) {
    const item = outfitItem(id);
    if (!item || slots.has(item.slot)) continue;
    slots.add(item.slot);
    out.push(item.id);
  }
  return out;
}

/** きせかえを つける・はずす。着ている物を押すとはずし、同じ場所の別の物は入れかえる */
export function toggleOutfit(current: readonly string[] | null | undefined, id: string): string[] {
  const worn = wornOutfit(current);
  if (worn.includes(id)) return worn.filter((w) => w !== id);
  const item = outfitItem(id);
  if (!item) return worn;
  return [...worn.filter((w) => outfitItem(w)?.slot !== item.slot), id];
}
