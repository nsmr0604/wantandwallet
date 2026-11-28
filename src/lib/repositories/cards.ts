import { db, newId } from '../db/schema';
import { normalizeName } from '../domain/text';
import type { Card } from '../domain/types';

export async function listCards(query = '', limit = 30): Promise<Card[]> {
  const q = normalizeName(query);
  const all = await db.cards.filter((c) => !c.deletedAt).toArray();
  const matched = q ? all.filter((c) => c.nameNorm.includes(q)) : all;
  return matched.slice(0, limit);
}

export async function findCardByName(name: string): Promise<Card | undefined> {
  const norm = normalizeName(name);
  return db.cards.where('nameNorm').equals(norm).first();
}

/** 手入力カードの登録（同名は既存を返す） */
export async function upsertManualCard(name: string): Promise<Card> {
  const norm = normalizeName(name);
  if (!norm) throw new Error('カード名が空です');
  const existing = await db.cards.where('nameNorm').equals(norm).first();
  if (existing) return existing;
  const now = Date.now();
  const card: Card = {
    id: newId(),
    nameJa: name.trim(),
    nameNorm: norm,
    source: 'manual',
    updatedAt: now,
  };
  await db.cards.add(card);
  return card;
}

/** カード索引（yaml-yugi）からカードを登録する。同名は既存を返す */
export async function upsertCardFromIndex(hit: {
  konamiId?: string;
  passcode?: string;
  nameJa: string;
  nameEn?: string;
  cardType?: string;
  kana?: string;
}): Promise<Card> {
  const norm = normalizeName(hit.nameJa);
  if (!norm) throw new Error('カード名が空です');
  const existing = await db.cards.where('nameNorm').equals(norm).first();
  if (existing) return existing;
  const card: Card = {
    id: newId(),
    konamiId: hit.konamiId,
    passcode: hit.passcode,
    nameJa: hit.nameJa,
    nameNorm: norm,
    nameKana: hit.kana,
    nameEn: hit.nameEn,
    cardType: hit.cardType,
    source: 'yaml-yugi',
    updatedAt: Date.now(),
  };
  await db.cards.add(card);
  return card;
}
