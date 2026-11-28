import { describe, expect, it } from 'vitest';
import { searchIndex, type IndexRow } from './cardsIndex';

const rows: IndexRow[] = [
  [12950, 14558127, '灰流うらら', 'Ash Blossom & Joyous Spring', 'Monster', 'Haru Urara', 'はるうらら'],
  [13356, 15327215, '六武衆の真影', 'Legendary Secret of the Six Samurai', 'Monster', "Rokubushū no Shin'ei", 'ろくぶしゅうのしんえい'],
  [9000, 12345678, 'サイクロン', 'Mystical Space Typhoon', 'Spell Card', 'Saikuron', 'さいくろん'],
];

describe('searchIndex', () => {
  it('日本語名の部分一致', () => {
    expect(searchIndex(rows, 'うらら').map((h) => h.nameJa)).toEqual(['灰流うらら']);
  });

  it('ひらがな・カタカナの正規化で一致する', () => {
    expect(searchIndex(rows, 'さいくろん').map((h) => h.nameJa)).toEqual(['サイクロン']);
    expect(searchIndex(rows, 'サイクロン').map((h) => h.nameJa)).toEqual(['サイクロン']);
  });

  it('英語名でも一致する', () => {
    expect(searchIndex(rows, 'ash blossom').map((h) => h.nameJa)).toEqual(['灰流うらら']);
  });

  it('前方一致を優先する', () => {
    const hits = searchIndex([...rows, [1, 1, 'うらら見習い', '', 'Monster', '', '']], 'うらら');
    expect(hits[0].nameJa).toBe('うらら見習い');
  });

  it('空クエリは空配列', () => {
    expect(searchIndex(rows, '')).toEqual([]);
  });
});
