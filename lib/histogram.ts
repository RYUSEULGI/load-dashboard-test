import { LogEvent } from "@/lib/eventGenerator";
import { THistogram } from "@/types/dashboard.types";

/** batch를 장부에 더하기 — batch 건수만큼만 순회 */
export function addBatchToLedger(
  ledger: Map<number, number>,
  batch: LogEvent[],
) {
  for (const e of batch) {
    const sec = Math.floor(e.timestamp / 1000);
    ledger.set(sec, (ledger.get(sec) ?? 0) + 1);
  }
}

/** 60초 지난 칸 삭제 — 장부에는 칸이 항상 60~70개뿐이라 비용 무시 가능 */
export function evictOldBuckets(ledger: Map<number, number>, nowSec: number) {
  for (const sec of ledger.keys()) {
    if (sec < nowSec - 60) ledger.delete(sec);
  }
}

/** 장부에서 차트용 60칸 배열 생성 — 빈 초는 0으로 채움 */
export function buildBars(
  ledger: Map<number, number>,
  nowSec: number,
): THistogram[] {
  const out: THistogram[] = [];

  for (let s = nowSec - 59; s <= nowSec; s++) {
    out.push({ sec: s, count: ledger.get(s) ?? 0 });
  }

  return out;
}