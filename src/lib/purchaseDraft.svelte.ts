import type { ReleaseProduct } from './domain/releases';

export interface PendingDraft {
  productName: string;
  unitMode: 'pack' | 'box';
  unitPrice: number;
  expectedAt: string;
}

/** 新弾画面から購入フォームへ引き継ぐ一時データ */
export const pendingDraft = $state<{ value: PendingDraft | null }>({ value: null });

export function setPendingDraft(d: PendingDraft): void {
  pendingDraft.value = d;
}

export function takePendingDraft(): PendingDraft | null {
  const d = pendingDraft.value;
  pendingDraft.value = null;
  return d;
}

export function draftFromRelease(p: ReleaseProduct): PendingDraft {
  return {
    productName: p.name,
    unitMode: p.priceUnit === 'box' ? 'box' : 'pack',
    unitPrice: p.price ?? 0,
    expectedAt: p.date,
  };
}
