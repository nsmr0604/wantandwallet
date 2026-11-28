import { normalizeName } from './text';

export interface ShopRecord {
  id: string;
  name: string;
  address: string;
  state?: string;
  tel?: string;
  url?: string;
  lat?: number | null;
  lon?: number | null;
  typeRank?: string;
}

export function filterShops(shops: ShopRecord[], query: string, limit = 20): ShopRecord[] {
  const q = normalizeName(query.trim());
  if (!q) return shops.slice(0, limit);
  return shops
    .filter((s) => normalizeName(`${s.name}${s.address}`).includes(q))
    .slice(0, limit);
}
