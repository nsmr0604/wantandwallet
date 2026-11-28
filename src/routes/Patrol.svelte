<script lang="ts">
  import { onMount } from 'svelte';
  import { go } from '../lib/router.svelte';
  import { listStores, touchStore } from '../lib/repositories/stores';
  import { listWish, type WishRow } from '../lib/repositories/wish';
  import { purchasedQty } from '../lib/repositories/purchases';
  import { addPrice } from '../lib/repositories/prices';
  import { patrolOrder, remainingQty } from '../lib/domain/budget';
  import { RARITIES } from '../lib/domain/rarities';
  import type { Store } from '../lib/domain/types';

  interface Entry {
    row: WishRow;
    priority: number;
    order: number;
    name: string;
    nameKana?: string;
    cardType?: string;
    remaining: number;
  }

  let stores = $state<Store[]>([]);
  let entries = $state<Entry[]>([]);
  let loading = $state(true);
  let storeId = $state('');
  let sortMode = $state<'priority' | 'typeName'>('priority');
  let index = $state(0);
  let price = $state('');
  let rarity = $state('');
  let toast = $state('');

  async function load() {
    const [storeRows, wishRows] = await Promise.all([listStores(), listWish()]);
    stores = storeRows;
    if (!storeId && storeRows[0]) storeId = storeRows[0].id;

    const next: Entry[] = [];
    for (const row of wishRows) {
      const bought = await purchasedQty(row.cardId);
      const rem = remainingQty(row.qtyWanted, bought);
      if (rem <= 0) continue;
      next.push({
        row,
        priority: row.priority,
        order: row.createdAt,
        name: row.card?.nameJa ?? '（不明なカード）',
        nameKana: row.card?.nameKana,
        cardType: row.card?.cardType,
        remaining: rem,
      });
    }
    entries = next;
    loading = false;
  }

  onMount(load);

  const ordered = $derived(patrolOrder(entries, sortMode));
  const item = $derived(ordered[index % Math.max(1, ordered.length)]);
  const currentStore = $derived(stores.find((s) => s.id === storeId));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

  function press(k: string) {
    if (k === '⌫') price = price.slice(0, -1);
    else if (k === '00') price = price === '' ? '0' : price + '00';
    else price = (price === '0' ? '' : price) + k;
  }

  async function selectStore(id: string) {
    storeId = id;
    await touchStore(id);
  }

  async function save() {
    if (!item || !storeId) return;
    const value = Number(price);
    if (value > 0) {
      await addPrice({
        cardId: item.row.cardId,
        storeId,
        price: value,
        rarity,
        stock: 1,
        source: 'visit',
      });
      toast = `${currentStore?.name ?? '店舗'}：${item.name} ¥${value.toLocaleString('ja-JP')} を記録`;
    }
    price = '';
    rarity = '';
    if (ordered.length > 0) index = (index + 1) % ordered.length;
  }

  async function next() {
    price = '';
    rarity = '';
    if (ordered.length > 0) index = (index + 1) % ordered.length;
  }
</script>

<section class="space-y-3">
  <div>
    <div class="flex items-center justify-between mb-1">
      <p class="text-[11px] font-bold text-slate-500">いまいる店舗</p>
      <p class="text-[10px] text-slate-400">最後に訪れた順</p>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="relative flex-1 min-w-0">
        <div class="flex gap-1.5 overflow-x-auto pb-1 pr-4">
          {#each stores as s (s.id)}
            <button
              class="shrink-0 h-9 px-3 rounded-full border text-[11px] font-medium"
              class:bg-slate-900={storeId === s.id}
              class:text-white={storeId === s.id}
              class:border-slate-900={storeId === s.id}
              class:bg-white={storeId !== s.id}
              class:text-slate-600={storeId !== s.id}
              class:border-slate-200={storeId !== s.id}
              onclick={() => selectStore(s.id)}
            >
              {s.favorite ? '★' : ''}{s.name}
            </button>
          {/each}
          {#if stores.length === 0}
            <p class="text-[10px] text-slate-400 py-2">店舗が未登録です</p>
          {/if}
        </div>
        <div class="pointer-events-none absolute right-0 top-0 h-9 w-6 bg-gradient-to-l from-slate-50 to-transparent"></div>
      </div>
      <button
        class="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center"
        aria-label="店舗を管理"
        onclick={() => go('stores')}
      >
        ＋
      </button>
    </div>
  </div>

  <div>
    <div class="flex items-center justify-between mb-1">
      <p class="text-[11px] font-bold text-slate-500">並び順</p>
      <p class="text-[10px] text-slate-400">
        {sortMode === 'priority' ? '買いたい順（高→低）' : '店舗の陳列順（種類→名前）'}
      </p>
    </div>
    <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
      <button
        class="h-9 rounded-lg text-[11px] font-bold"
        class:bg-white={sortMode === 'priority'}
        class:text-slate-900={sortMode === 'priority'}
        class:text-slate-500={sortMode !== 'priority'}
        onclick={() => { sortMode = 'priority'; index = 0; }}
      >
        優先度順
      </button>
      <button
        class="h-9 rounded-lg text-[11px] font-bold"
        class:bg-white={sortMode === 'typeName'}
        class:text-slate-900={sortMode === 'typeName'}
        class:text-slate-500={sortMode !== 'typeName'}
        onclick={() => { sortMode = 'typeName'; index = 0; }}
      >
        種類→名前順
      </button>
    </div>
    <p class="mt-1 text-[10px] text-slate-400">対象 {ordered.length} 枚（達成済みは除外）</p>
  </div>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if !item}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">巡回するカードがありません</p>
      <p class="mt-1 text-[10px] text-slate-500">欲しいリストにカードを追加してください</p>
      <button class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold" onclick={() => go('search')}>
        カードを検索
      </button>
    </div>
  {:else}
    <div class="flex items-center gap-2 px-1">
      <div class="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div class="h-full bg-emerald-500" style="width: {((index + 1) / ordered.length) * 100}%"></div>
      </div>
      <span class="text-[10px] text-slate-500">{index + 1} / {ordered.length}</span>
    </div>

    <div class="rounded-2xl bg-white border border-slate-200 p-4">
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-slate-500">残り {item.remaining} 枚</span>
      </div>
      <p class="mt-0.5 text-[17px] font-bold text-slate-900 leading-snug">{item.name}</p>
      <p class="text-[10px] text-slate-500">{item.cardType ?? 'カード'}</p>
      <div class="mt-1.5 flex items-center gap-2">
        <select
          class="h-8 max-w-[60%] rounded-md border border-slate-300 bg-white px-1 text-[10px] text-slate-700 outline-none"
          bind:value={rarity}
        >
          {#each RARITIES as r (r.value)}
            <option value={r.value}>レアリティ: {r.label}</option>
          {/each}
        </select>
        <p class="ml-auto text-[10px] text-slate-500">
          目標 ¥{(item.row.targetPrice ?? 0).toLocaleString('ja-JP')}
        </p>
      </div>
    </div>

    <div class="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-baseline justify-between">
      <span class="text-[11px] text-slate-300">価格</span>
      <span class="text-[34px] font-bold leading-none tracking-tight">
        <span class="text-[18px] font-medium text-slate-300 mr-0.5">¥</span>{price === '' ? '0' : Number(price).toLocaleString('ja-JP')}
      </span>
    </div>

    <div class="grid grid-cols-3 gap-2">
      {#each keys as k (k)}
        <button
          class="h-14 rounded-xl bg-white border border-slate-200 text-[18px] font-bold text-slate-800 active:bg-slate-100"
          onclick={() => press(k)}
        >
          {k === '⌫' ? '⌫' : k}
        </button>
      {/each}
    </div>

    <div class="grid grid-cols-3 gap-2">
      <button class="col-span-1 h-12 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={next}>
        在庫なし
      </button>
      <button class="col-span-2 h-12 rounded-xl bg-emerald-600 text-white text-[13px] font-bold" onclick={save}>
        保存して次へ
      </button>
    </div>

    {#if toast}
      <p class="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[10px] text-emerald-800">
        {toast}
      </p>
    {/if}
  {/if}

  <p class="px-1 text-[10px] text-slate-400">
    価格は「カード × 店舗 × レアリティ」で記録されます。同じ組み合わせは最新の記録として残ります。
  </p>
</section>
