<script lang="ts">
  import { onMount } from 'svelte';
  import { go } from '../lib/router.svelte';
  import { db } from '../lib/db/schema';
  import { latestAll, groupByStore, groupByCard, type StorePriceGroup } from '../lib/repositories/prices';
  import { rarityLabel } from '../lib/domain/rarities';
  import { storeLabel } from '../lib/domain/stores';
  import type { Card, PriceObservation, Store } from '../lib/domain/types';

  let rows = $state<PriceObservation[]>([]);
  let cards = $state<Record<string, Card>>({});
  let stores = $state<Record<string, Store>>({});
  let loading = $state(true);
  let view = $state<'card' | 'store'>('card');

  async function load() {
    rows = await latestAll();
    const cardRows = await db.cards.toArray();
    const storeRows = await db.stores.toArray();
    cards = Object.fromEntries(cardRows.map((c) => [c.id, c]));
    stores = Object.fromEntries(storeRows.map((s) => [s.id, s]));
    loading = false;
  }

  onMount(load);

  interface CardView {
    cardId: string;
    groups: StorePriceGroup[];
    best: PriceObservation;
  }

  const cardViews: CardView[] = $derived.by(() => {
    const byCard = new Map<string, PriceObservation[]>();
    for (const p of rows) {
      if (!byCard.has(p.cardId)) byCard.set(p.cardId, []);
      byCard.get(p.cardId)!.push(p);
    }
    return [...byCard.entries()]
      .map(([cardId, list]) => {
        const groups = groupByStore(list);
        return { cardId, groups, best: groups[0].cheapest };
      })
      .sort((a, b) => a.best.price - b.best.price);
  });

  interface StoreView {
    storeId: string;
    cards: { cardId: string; list: PriceObservation[]; cheapest: PriceObservation }[];
    total: number;
  }

  const storeViews: StoreView[] = $derived.by(() => {
    const byStore = new Map<string, PriceObservation[]>();
    for (const p of rows) {
      if (!byStore.has(p.storeId)) byStore.set(p.storeId, []);
      byStore.get(p.storeId)!.push(p);
    }
    return [...byStore.entries()]
      .map(([storeId, list]) => {
        const groups = groupByCard(list);
        return {
          storeId,
          cards: groups,
          total: groups.reduce((n, g) => n + g.cheapest.price, 0),
        };
      })
      .sort((a, b) => (stores[a.storeId]?.name ?? '').localeCompare(stores[b.storeId]?.name ?? '', 'ja'));
  });

  const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
  const storeName = (id: string) => {
    const s = stores[id];
    return s ? storeLabel(s) : '—';
  };
</script>

<section class="space-y-3">
  <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={view === 'card'}
      class:text-slate-900={view === 'card'}
      class:text-slate-500={view !== 'card'}
      onclick={() => (view = 'card')}
    >
      カード別
    </button>
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={view === 'store'}
      class:text-slate-900={view === 'store'}
      class:text-slate-500={view !== 'store'}
      onclick={() => (view = 'store')}
    >
      店舗別
    </button>
  </div>

  <p class="px-1 text-[10px] text-slate-400">
    {view === 'card' ? 'カード名 → 店舗 → レアリティ の順に比較します。' : '店舗 → カード名 → レアリティ の順に一覧します。'}
  </p>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if rows.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">価格がまだありません</p>
      <p class="mt-1 text-[10px] text-slate-500">巡回モードで店舗の価格を記録してください</p>
      <button class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold" onclick={() => go('patrol')}>
        巡回モードへ
      </button>
    </div>
  {:else if view === 'card'}
    {#each cardViews as row (row.cardId)}
      <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-3 pt-3 pb-2">
          <p class="text-[13px] font-bold text-slate-900">{cards[row.cardId]?.nameJa ?? '（不明）'}</p>
          <p class="text-[10px] text-slate-500">
            最安 {yen(row.best.price)}（{storeName(row.best.storeId)} / {rarityLabel(row.best.rarity)}）
          </p>
        </div>
        <ul class="border-t border-slate-100 divide-y divide-slate-100">
          {#each row.groups as g (g.storeId)}
            <li class="px-3 py-2" class:bg-emerald-50={g.cheapest.price === row.best.price}>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium text-slate-700 flex-1 truncate">
                  {storeName(g.storeId)}
                </span>
                <span class="text-[12px] font-bold text-slate-900">{yen(g.cheapest.price)}</span>
              </div>
              <ul class="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                {#each g.list as p (p.id)}
                  <li class="flex items-center gap-1.5 text-[10px]">
                    <span class="text-slate-500 border border-slate-200 rounded px-1">{rarityLabel(p.rarity)}</span>
                    <span class="ml-auto font-bold text-slate-700">{yen(p.price)}</span>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {:else}
    {#each storeViews as s (s.storeId)}
      <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-3 pt-3 pb-2 flex items-center gap-2">
          <p class="text-[13px] font-bold text-slate-900 flex-1 truncate">{storeName(s.storeId)}</p>
          <span class="text-[10px] text-slate-500">{s.cards.length} 種</span>
        </div>
        <ul class="border-t border-slate-100 divide-y divide-slate-100">
          {#each s.cards as c (c.cardId)}
            <li class="px-3 py-2">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium text-slate-700 flex-1 truncate">
                  {cards[c.cardId]?.nameJa ?? '—'}
                </span>
                <span class="text-[12px] font-bold text-slate-900">{yen(c.cheapest.price)}</span>
              </div>
              <ul class="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                {#each c.list as p (p.id)}
                  <li class="flex items-center gap-1.5 text-[10px]">
                    <span class="text-slate-500 border border-slate-200 rounded px-1">{rarityLabel(p.rarity)}</span>
                    <span class="ml-auto font-bold text-slate-700">{yen(p.price)}</span>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
        <div class="px-3 py-2 bg-slate-50 border-t border-slate-100">
          <p class="text-[10px] text-slate-500">最安の合計 {yen(s.total)}</p>
        </div>
      </div>
    {/each}
  {/if}
</section>
