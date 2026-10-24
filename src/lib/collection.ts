import { STAMP_GOAL, SUBJECTS } from "./constants";
import type { ArchiveRecord } from "./types";
import type { Subject } from "@/server/llm/schema";

/** 分類ごとのスタンプの数（図鑑に保存した問い1つにつき、その分類のスタンプを1つ） */
export function stampCounts(archives: ArchiveRecord[]): Record<Subject, number> {
  const counts: Record<Subject, number> = { math: 0, science: 0, info: 0 };
  for (const a of archives) counts[a.question.subject] += 1;
  return counts;
}

/** スタンプが目標の数に届いて、称号を得ている分類 */
export function earnedTitles(counts: Record<Subject, number>): Subject[] {
  return SUBJECTS.filter((s) => counts[s] >= STAMP_GOAL);
}

/** 図鑑を「分類 → 単元」で分ける */
export function groupArchives(archives: ArchiveRecord[]): { subject: Subject; topics: { topic: string; items: ArchiveRecord[] }[] }[] {
  return SUBJECTS.map((subject) => {
    const byTopic = new Map<string, ArchiveRecord[]>();
    for (const a of archives) {
      if (a.question.subject !== subject) continue;
      byTopic.set(a.question.topic, [...(byTopic.get(a.question.topic) ?? []), a]);
    }
    return { subject, topics: [...byTopic].map(([topic, items]) => ({ topic, items })) };
  }).filter((g) => g.topics.length > 0);
}
