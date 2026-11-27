export interface SealedInput {
  mode: 'pack' | 'box';
  quantity: number;
  packsPerBox: number;
  msrpPack: number;
  msrpBox?: number | null;
}

export interface SealedResult {
  unit: 'pack' | 'box';
  qty: number;
  packsPerUnit: number;
  totalPacks: number;
  unitPrice: number;
}

/** 単位（パック/BOX）と数量から、パック数・単価を導出する */
export function sealedUnit(input: SealedInput): SealedResult {
  const packsPerBox = Math.max(1, Math.floor(input.packsPerBox) || 30);
  const quantity = Math.max(0, Math.floor(input.quantity) || 0);
  const isBox = input.mode === 'box' && !!input.msrpBox;
  if (isBox) {
    return {
      unit: 'box',
      qty: quantity,
      packsPerUnit: packsPerBox,
      totalPacks: quantity * packsPerBox,
      unitPrice: input.msrpBox as number,
    };
  }
  return {
    unit: 'pack',
    qty: quantity,
    packsPerUnit: 1,
    totalPacks: quantity,
    unitPrice: input.msrpPack,
  };
}

/** イベント参加条件（税込 1000 円以上）を満たす最小パック数 */
export function minPacksForBudget(threshold: number, packPrice: number): number {
  if (packPrice <= 0) return 0;
  return Math.ceil(threshold / packPrice);
}

/** 同じ入力で単位を切り替えたときの数量換算 */
export function convertQuantity(
  from: 'pack' | 'box',
  to: 'pack' | 'box',
  quantity: number,
  packsPerBox: number,
): number {
  const pb = Math.max(1, Math.floor(packsPerBox) || 30);
  if (from === to) return quantity;
  if (to === 'pack') return quantity * pb;
  return Math.floor(quantity / pb);
}
