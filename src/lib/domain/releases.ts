export interface ReleaseProduct {
  name: string;
  date: string;
  kind: string;
  url: string;
  priceUnit: 'pack' | 'box' | null;
  price: number | null;
  packsPerBox: number | null;
  cardsPerPack: number | null;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 日本時間の今日（UTC 日付としての YYYY-MM-DD） */
export function todayJst(now: Date = new Date()): string {
  const d = new Date(now.getTime() + JST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** 日付（YYYY-MM-DD）までの残り日数。今日は 0、過去は負。 */
export function daysUntil(date: string, now: Date = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Number.NaN;
  const target = Date.parse(`${date}T00:00:00+09:00`);
  const today = Date.parse(`${todayJst(now)}T00:00:00+09:00`);
  return Math.round((target - today) / 86_400_000);
}

export function upcoming(products: ReleaseProduct[], now: Date = new Date()): ReleaseProduct[] {
  const today = todayJst(now);
  return products
    .filter((p) => p.date && p.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function past(products: ReleaseProduct[], now: Date = new Date()): ReleaseProduct[] {
  const today = todayJst(now);
  return products
    .filter((p) => p.date && p.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
}
