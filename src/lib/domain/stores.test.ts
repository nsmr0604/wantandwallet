import { describe, expect, it } from 'vitest';
import { storeLabel } from './stores';

describe('storeLabel', () => {
  it('短い別名があればそれを使う', () => {
    expect(
      storeLabel({ name: 'カードショップ竜星のPAO 秋葉原ロケット無線店', shortName: 'PAO 秋葉原' }),
    ).toBe('PAO 秋葉原');
  });

  it('別名が空なら正式名', () => {
    expect(storeLabel({ name: '秋葉原 A 店' })).toBe('秋葉原 A 店');
    expect(storeLabel({ name: '秋葉原 A 店', shortName: '   ' })).toBe('秋葉原 A 店');
  });
});
