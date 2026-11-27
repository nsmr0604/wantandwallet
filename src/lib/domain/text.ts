const KATAKANA = /[\u30a1-\u30f6]/g;

/** 検索・一意性のための正規化（全半角統一・かな化・記号除去） */
export function normalizeName(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(KATAKANA, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s\u3000]/g, '')
    .replace(/[!-/:-@[-`{-~]/g, '')
    .replace(/[・、。，．]/g, '');
}
