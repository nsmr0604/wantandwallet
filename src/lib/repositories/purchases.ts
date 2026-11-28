import { db } from '../db/schema';

/** カードの購入済み枚数（単品の合計） */
export async function purchasedQty(cardId: string): Promise<number> {
  const rows = await db.purchases
    .filter((p) => !p.deletedAt && p.itemType === 'card' && p.cardId === cardId)
    .toArray();
  let qty = 0;
  for (const p of rows) {
    if (p.status === 'bought') qty += p.qty;
  }
  return qty;
}
