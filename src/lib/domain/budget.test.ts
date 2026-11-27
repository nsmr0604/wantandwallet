import { describe, expect, it } from 'vitest';
import {
  budgetSummary,
  effectiveUnitPrice,
  monthOf,
  monthRange,
  patrolOrder,
  typeGroup,
} from './budget';
import type { Purchase } from './types';

const purchase = (over: Partial<Purchase>): Purchase => ({
  id: 'p',
  itemType: 'card',
  unit: 'single',
  qty: 1,
  unitPrice: 1000,
  shipping: 0,
  total: 1000,
  status: 'bought',
  category: 'single',
  updatedAt: 0,
  ...over,
});

describe('monthRange', () => {
  it('日本時間の月初〜翌月初を返す', () => {
    const [start, end] = monthRange('2026-11');
    expect(new Date(start).toISOString()).toBe('2026-10-31T15:00:00.000Z');
    expect(new Date(end).toISOString()).toBe('2026-11-30T15:00:00.000Z');
  });

  it('monthOf は往復して一致する', () => {
    const [start] = monthRange('2026-11');
    expect(monthOf(start)).toBe('2026-11');
    expect(monthOf(start - 1)).toBe('2026-10');
  });
});

describe('budgetSummary', () => {
  it('残額 = 上限 − 購入 − 予約', () => {
    const s = budgetSummary(12000, [
      purchase({ total: 5240 }),
      purchase({ total: 5940, status: 'reserved' }),
    ]);
    expect(s.spent).toBe(5240);
    expect(s.reserved).toBe(5940);
    expect(s.remaining).toBe(820);
    expect(s.rate).toBe(93);
    expect(s.over).toBe(false);
  });

  it('超過を検出する', () => {
    const s = budgetSummary(1000, [purchase({ total: 1200 })]);
    expect(s.remaining).toBe(-200);
    expect(s.over).toBe(true);
  });

  it('論理削除を無視する', () => {
    const s = budgetSummary(1000, [purchase({ total: 500 }), purchase({ total: 900, deletedAt: 1 })]);
    expect(s.spent).toBe(500);
  });
});

describe('effectiveUnitPrice', () => {
  it('BOX は 1 パック換算する', () => {
    expect(effectiveUnitPrice(purchase({ unit: 'box', unitPrice: 5940, packsPerUnit: 30 }))).toBe(198);
  });

  it('単品・パックはそのまま', () => {
    expect(effectiveUnitPrice(purchase({ unitPrice: 198 }))).toBe(198);
  });
});

describe('typeGroup', () => {
  it('モンスター→エクストラ→魔法→罠', () => {
    expect(typeGroup('Effect Monster')).toBe(1);
    expect(typeGroup('Link Monster')).toBe(2);
    expect(typeGroup('Spell Card')).toBe(3);
    expect(typeGroup('Trap Card')).toBe(4);
    expect(typeGroup(undefined)).toBe(5);
  });
});

describe('patrolOrder', () => {
  const items = [
    { priority: 2, order: 2, name: 'は行', nameKana: 'はぎょく', cardType: 'Trap Card' },
    { priority: 1, order: 1, name: 'あ行', nameKana: 'あぎょく', cardType: 'Effect Monster' },
    { priority: 1, order: 3, name: 'か行', nameKana: 'かぎょく', cardType: 'Link Monster' },
  ];

  it('優先度順', () => {
    expect(patrolOrder(items, 'priority').map((i) => i.name)).toEqual(['あ行', 'か行', 'は行']);
  });

  it('種類→名前順', () => {
    expect(patrolOrder(items, 'typeName').map((i) => i.name)).toEqual(['あ行', 'か行', 'は行']);
  });
});
