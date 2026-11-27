<script>
  import { yen } from '../sample.js';
  import { shop, pricesByStore, bestPrice, observationsByStore, draftFromCard } from '../store.svelte.js';
  import { rarityLabel } from '../rarity.js';

  let { go } = $props();

  let view = $state('card');

  const names = $derived([...new Set(shop.prices.map((p) => p.name))]);
  const cardRows = $derived(
    names
      .map((name) => ({ name, groups: pricesByStore(name), best: bestPrice(name) }))
      .filter((r) => r.groups.length > 0),
  );
  const storeRows = $derived(observationsByStore());

  const record = (name, price, store, rarity) => {
    draftFromCard({ name, price, store, rarity });
    go('purchase-form');
  };
</script>

<section class="space-y-3">
  <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={view === 'card'} class:text-slate-900={view === 'card'} class:text-slate-500={view !== 'card'}
      onclick={() => (view = 'card')}
    >
      カード別
    </button>
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={view === 'store'} class:text-slate-900={view === 'store'} class:text-slate-500={view !== 'store'}
      onclick={() => (view = 'store')}
    >
      店舗別
    </button>
  </div>

  <p class="px-1 text-[10px] text-slate-400">
    {view === 'card' ? 'カード名 → 店舗 → レアリティ の順に比較します。' : '店舗 → カード名 → レアリティ の順に一覧します。'}
  </p>

  {#if view === 'card'}
    {#each cardRows as row (row.name)}
      <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-3 pt-3 pb-2 flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{row.name}</p>
            <p class="text-[10px] text-slate-500">最安 {yen(row.best.price)}（{row.best.store} / {rarityLabel(row.best.rarity)}）</p>
          </div>
          <button class="shrink-0 h-8 px-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold" onclick={() => record(row.name, row.best.price, row.best.store, row.best.rarity)}>
            購入を記録
          </button>
        </div>

        <ul class="border-t border-slate-100 divide-y divide-slate-100">
          {#each row.groups as g (g.store)}
            <li class="px-3 py-2" class:bg-emerald-50={g.cheapest === row.best.price}>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium text-slate-700 flex-1 truncate">{g.store}</span>
                {#if g.cheapest === row.best.price}
                  <span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">最安店</span>
                {/if}
                <span class="text-[12px] font-bold text-slate-900">{yen(g.cheapest)}</span>
              </div>
              <ul class="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                {#each g.list as p (p.id)}
                  <li class="flex items-center gap-1.5 text-[10px]">
                    <span class="text-slate-500 border border-slate-200 rounded px-1 shrink-0">{rarityLabel(p.rarity)}</span>
                    <span class="ml-auto font-bold" class:text-emerald-700={p.price === row.best.price} class:text-slate-700={p.price !== row.best.price}>{yen(p.price)}</span>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>

        <div class="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p class="text-[10px] text-slate-500">店舗間の差額 {yen(Math.max(...row.groups.map((g) => g.cheapest)) - row.best.price)}</p>
          <button class="h-8 px-3 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700" onclick={() => go('wish')}>
            欲しいリストへ
          </button>
        </div>
      </div>
    {/each}
  {:else}
    {#each storeRows as s (s.store)}
      <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-3 pt-3 pb-2 flex items-center gap-2">
          <p class="text-[13px] font-bold text-slate-900 flex-1 truncate">{s.store}</p>
          <span class="text-[10px] text-slate-500">{s.cards.length} 種</span>
        </div>
        <ul class="border-t border-slate-100 divide-y divide-slate-100">
          {#each s.cards as c (c.name)}
            <li class="px-3 py-2">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium text-slate-700 flex-1 truncate">{c.name}</span>
                <span class="text-[12px] font-bold text-slate-900">{yen(c.cheapest)}</span>
              </div>
              <ul class="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                {#each c.list as p (p.id)}
                  <li class="flex items-center gap-1.5 text-[10px]">
                    <span class="text-slate-500 border border-slate-200 rounded px-1 shrink-0">{rarityLabel(p.rarity)}</span>
                    <span class="ml-auto font-bold text-slate-700">{yen(p.price)}</span>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
        <div class="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p class="text-[10px] text-slate-500">登録 {s.cards.length} 種・最安の合計 {yen(s.cards.reduce((n, c) => n + c.cheapest, 0))}</p>
          <button class="h-8 px-3 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700" onclick={() => go('wish')}>
            欲しいリストへ
          </button>
        </div>
      </div>
    {/each}
  {/if}
</section>
