import { describe, expect, it } from 'vitest';
import { convertQuantity, minPacksForBudget, sealedUnit } from './sealed';

describe('sealedUnit', () => {
  it('BOX は数量×パック数で計算する', () => {
    const r = sealedUnit({ mode: 'box', quantity: 3, packsPerBox: 30, msrpPack: 198, msrpBox: 5940 });
    expect(r).toEqual({ unit: 'box', qty: 3, packsPerUnit: 30, totalPacks: 90, unitPrice: 5940 });
  });

  it('パックはそのまま数える', () => {
    const r = sealedUnit({ mode: 'pack', quantity: 12, packsPerBox: 30, msrpPack: 198, msrpBox: 5940 });
    expect(r).toEqual({ unit: 'pack', qty: 12, packsPerUnit: 1, totalPacks: 12, unitPrice: 198 });
  });

  it('BOX 定価が無ければパック扱い', () => {
    const r = sealedUnit({ mode: 'box', quantity: 2, packsPerBox: 10, msrpPack: 396, msrpBox: null });
    expect(r.unit).toBe('pack');
    expect(r.totalPacks).toBe(2);
  });
});

describe('convertQuantity', () => {
  it('BOX → パック は ×パック数', () => {
    expect(convertQuantity('box', 'pack', 3, 30)).toBe(90);
  });

  it('パック → BOX は端数を切り捨て', () => {
    expect(convertQuantity('pack', 'box', 89, 30)).toBe(2);
    expect(convertQuantity('pack', 'box', 90, 30)).toBe(3);
  });
});

describe('minPacksForBudget', () => {
  it('税込1000円を満たす最小パック数', () => {
    expect(minPacksForBudget(1000, 198)).toBe(6);
    expect(minPacksForBudget(1000, 396)).toBe(3);
    expect(minPacksForBudget(1000, 0)).toBe(0);
  });
});
