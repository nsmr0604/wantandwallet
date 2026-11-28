import { describe, expect, it } from 'vitest';
import { cleanAddress, mapUrl, storeLabel } from './stores';

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

describe('mapUrl', () => {
  it('住所を URL エンコードして地図検索 URL を作る', () => {
    expect(mapUrl('東京都千代田区外神田1-15-16')).toBe(
      'https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8D%83%E4%BB%A3%E7%94%B0%E5%8C%BA%E5%A4%96%E7%A5%9E%E7%94%B01-15-16',
    );
  });
});

describe('cleanAddress', () => {
  it('住所末尾の店名を除去する', () => {
    expect(
      cleanAddress(
        '2200005 神奈川県横浜市西区南幸１－５－３９太洋ビル６Ｆ カードショップ竜星のPAO 横浜店',
        'カードショップ竜星のPAO 横浜店',
      ),
    ).toBe('2200005 神奈川県横浜市西区南幸１－５－３９太洋ビル６Ｆ');
  });

  it('末尾が店名でなければそのまま', () => {
    expect(cleanAddress('東京都千代田区', '別の店')).toBe('東京都千代田区');
  });
});
