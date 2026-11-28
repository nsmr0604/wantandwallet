import { describe, expect, it } from 'vitest';
import { daysUntil, past, todayJst, upcoming, type ReleaseProduct } from './releases';

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
