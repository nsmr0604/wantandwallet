import { normalizeName } from './text';

/** [konamiId, passcode, nameJa, nameEn, cardType, romaji, kana] */
export type IndexRow = [
  number | null,
  number | null,
  string,
  string,
  string,
  string,
  string,
];

export interface CardHit {
  konamiId?: string;
  passcode?: string;
  nameJa: string;
  nameEn: string;
  cardType: string;
  romaji: string;
  kana: string;
}

export function rowToHit(row: IndexRow): CardHit {
  return {
    konamiId: row[0] != null ? String(row[0]) : undefined,
    passcode: row[1] != null ? String(row[1]) : undefined,
    nameJa: row[2],
    nameEn: row[3],
    cardType: row[4],
    romaji: row[5],
    kana: row[6] ?? '',
  };
}

export function searchIndex(rows: IndexRow[], query: string, limit = 30): CardHit[] {
  const q = normalizeName(query);
  if (!q) return [];
  const starts: CardHit[] = [];
  const contains: CardHit[] = [];
  for (const row of rows) {
    const name = normalizeName(`${row[2]}${row[6] ?? ''}${row[3]}${row[5]}`);
    if (name.startsWith(q)) starts.push(rowToHit(row));
    else if (name.includes(q)) contains.push(rowToHit(row));
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
