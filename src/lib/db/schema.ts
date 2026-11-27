import Dexie, { type EntityTable } from 'dexie';
import type {
  Budget,
  BudgetCategory,
  Card,
  PriceObservation,
  Purchase,
  Reminder,
  SetRelease,
  Settings,
  Store,
  WishItem,
} from '../domain/types';

export class AppDatabase extends Dexie {
  cards!: EntityTable<Card, 'id'>;
  stores!: EntityTable<Store, 'id'>;
  wishItems!: EntityTable<WishItem, 'id'>;
  priceObservations!: EntityTable<PriceObservation, 'id'>;
  purchases!: EntityTable<Purchase, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  budgetCategories!: EntityTable<BudgetCategory, 'id'>;
  setReleases!: EntityTable<SetRelease, 'id'>;
  reminders!: EntityTable<Reminder, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('wantandwallet');
    this.version(1).stores({
      cards: 'id, &nameNorm, passcode, konamiId, deletedAt',
      stores: 'id, kind, favorite, lastVisitedAt, archivedAt, [deletedAt+name]',
      wishItems: 'id, cardId, priority, createdAt, deletedAt',
      priceObservations:
        'id, cardId, storeId, observedAt, [cardId+storeId+observedAt], [storeId+observedAt]',
      purchases:
        'id, itemType, cardId, releaseId, storeId, status, purchasedAt, category, [purchasedAt+category], [status+expectedAt]',
      budgets: 'id, &month',
      budgetCategories: 'id, &[month+category]',
      setReleases: 'id, releaseDate, name, preorderAt, deletedAt',
      reminders: 'id, releaseId, remindAt',
      settings: 'id',
    });
  }
}

export const db = new AppDatabase();

export const newId = (): string => crypto.randomUUID();

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  defaultMonthlyLimit: 10000,
  defaultPacksPerBox: 30,
  reminderLeadDays: 7,
  storageUnitPrice: 30,
  categoryDefaults: { newset: 3000, single: 5000, goods: 1500, other: 500 },
  updatedAt: 0,
};

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('app');
  if (existing) return existing;
  const created = { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
  await db.settings.put(created);
  return created;
}
