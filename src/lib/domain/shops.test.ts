import { describe, expect, it } from 'vitest';
import { filterShops, type ShopRecord } from './shops';

const shops: ShopRecord[] = [
  { id: '1', name: 'カードショップ メルカード', address: '東京都千代田区外神田' },
  { id: '2', name: 'カードラッシュ 日本橋店', address: '大阪府大阪市浪速区' },
  { id: '3', name: 'ホビーステーション 横浜店', address: '神奈川県横浜市' },
];

describe('filterShops', () => {
  it('店名の部分一致（かな正規化）', () => {
    expect(filterShops(shops, 'かーど').map((s) => s.id)).toEqual(['1', '2']);
  });

  it('住所でも一致する', () => {
    expect(filterShops(shops, '大阪').map((s) => s.id)).toEqual(['2']);
  });

  it('空クエリは先頭から返す', () => {
    expect(filterShops(shops, '', 2).map((s) => s.id)).toEqual(['1', '2']);
  });
});
