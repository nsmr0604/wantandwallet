import { describe, expect, it } from 'vitest';
import {
  cardProducts,
  daysUntil,
  isCardProduct,
  past,
  pickableProducts,
  productLabel,
  todayJst,
  upcoming,
  type ReleaseProduct,
} from './releases';

const p = (name: string, date: string): ReleaseProduct => ({
  name,
  date,
  kind: '基本パック',
  url: '',
  priceUnit: 'pack',
  price: 198,
  packsPerBox: 30,
  cardsPerPack: 5,
});

describe('daysUntil', () => {
  it('今日は 0、未来は正、過去は負', () => {
    const now = new Date('2026-11-28T03:00:00+09:00');
    expect(daysUntil('2026-11-28', now)).toBe(0);
    expect(daysUntil('2026-12-19', now)).toBe(21);
    expect(daysUntil('2026-11-27', now)).toBe(-1);
  });

  it('日付でない値は NaN', () => {
    expect(daysUntil('2027年3月発売予定')).toBeNaN();
  });
});

describe('upcoming / past', () => {
  const now = new Date('2026-11-28T03:00:00+09:00');
  const list = [p('A', '2026-12-19'), p('B', '2026-11-01'), p('C', '2027-01-23')];

  it('未来は日付昇順', () => {
    expect(upcoming(list, now).map((x) => x.name)).toEqual(['A', 'C']);
  });

  it('過去は日付降順', () => {
    expect(past(list, now).map((x) => x.name)).toEqual(['B']);
  });
});

describe('todayJst', () => {
  it('UTC 15:00 をまたぐと日本時間の日付になる', () => {
    expect(todayJst(new Date('2026-11-27T14:59:00Z'))).toBe('2026-11-27');
    expect(todayJst(new Date('2026-11-27T15:00:00Z'))).toBe('2026-11-28');
  });
});

describe('productLabel', () => {
  it('日本語名があれば英語名を併記', () => {
    expect(productLabel({ name: 'BEYOND THE BRAVE', nameJa: 'ビヨンド・ザ・ブレイブ' })).toBe(
      'ビヨンド・ザ・ブレイブ [BEYOND THE BRAVE]',
    );
  });

  it('日本語名が無ければ英語名のみ', () => {
    expect(productLabel({ name: 'PRIDE AND SOUL' })).toBe('PRIDE AND SOUL');
  });

  it('日本語名が英語名と同じなら重複させない', () => {
    expect(productLabel({ name: 'PREMIUM PACK 2026', nameJa: 'PREMIUM PACK 2026' })).toBe(
      'PREMIUM PACK 2026',
    );
  });
});

describe('isCardProduct', () => {
  it('グッズ・サプライを除外する', () => {
    expect(isCardProduct({ name: 'デュエリストカードプロテクター A', kind: 'デュエリストアイテム' })).toBe(false);
    expect(isCardProduct({ name: 'デュエルフィールド 闇遊戯', kind: 'デュエリストアイテム' })).toBe(false);
    expect(isCardProduct({ name: 'PRIDE AND SOUL', kind: '基本パック' })).toBe(true);
    expect(isCardProduct({ name: 'デッキビルドパック 2027', kind: 'コンセプトパック' })).toBe(true);
  });
});

describe('pickableProducts', () => {
  const now = new Date('2026-11-28T03:00:00+09:00');
  const list: ReleaseProduct[] = [
    p('古いパック', '2024-01-01'),
    p('1年前のパック', '2025-11-28'),
    p('半年前のパック', '2026-06-01'),
    p('次のパック', '2027-01-23'),
    { ...p('プロテクター', '2027-01-23'), kind: 'デュエリストアイテム' },
  ];

  it('将来＋1年内のカード商品だけを返す', () => {
    expect(pickableProducts(list, now).map((x) => x.name)).toEqual([
      '次のパック',
      '半年前のパック',
      '1年前のパック',
    ]);
  });

  it('cardProducts はサプライを除く', () => {
    expect(cardProducts(list).map((x) => x.name)).not.toContain('プロテクター');
  });
});
