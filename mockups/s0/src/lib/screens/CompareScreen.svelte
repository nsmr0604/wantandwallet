<script>
  import { compareRows, yen } from '../sample.js';
  import { draftFromCard } from '../store.svelte.js';
  let { go } = $props();

  const best = (prices) => Math.min(...prices.filter((p) => p.price > 0).map((p) => p.price));
  const bestStore = (prices) => prices.find((p) => p.price === best(prices));

  const record = (row) => {
    const b = bestStore(row.prices);
    draftFromCard({ name: row.name, price: b.price, store: b.store, rarity: b.rarity });
    go('purchase-form');
  };
</script>

<section class="space-y-3">
  <div class="flex gap-1.5 overflow-x-auto pb-1">
    <button class="shrink-0 h-8 px-3 rounded-full bg-slate-900 text-white text-[11px] font-bold">欲しい 3 件</button>
    <button class="shrink-0 h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600">実店舗のみ</button>
    <button class="shrink-0 h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600">通販を含む</button>
  </div>

  {#each compareRows as row (row.name)}
    <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div class="px-3 pt-3 pb-2">
        <p class="text-[13px] font-bold text-slate-900">{row.name}</p>
        <p class="text-[10px] text-slate-500">レアリティは参考表示（価格はカード単位で比較）</p>
      </div>
      <ul class="divide-y divide-slate-100 border-t border-slate-100">
        {#each row.prices as p (p.store)}
          <li class="px-3 py-2 flex items-center gap-2" class:bg-emerald-50={p.price === best(row.prices) && p.price > 0}>
            <span class="text-[11px] text-slate-600 flex-1 truncate">{p.store}</span>
            {#if p.rarity}
              <span class="text-[9px] font-medium text-slate-500 border border-slate-200 rounded px-1">{p.rarity}</span>
            {/if}
            {#if p.stock === 0}
              <span class="text-[10px] text-slate-400">在庫なし</span>
            {:else if p.price === best(row.prices)}
              <span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">最安</span>
            {/if}
            <span class="text-[13px] font-bold" class:text-emerald-800={p.price === best(row.prices) && p.price > 0} class:text-slate-900={p.price !== best(row.prices)}>
              {yen(p.price)}
            </span>
          </li>
        {/each}
      </ul>
      <div class="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p class="text-[10px] text-slate-500">
          最安 {bestStore(row.prices).store}・差額 {yen(Math.max(...row.prices.map((p) => p.price)) - best(row.prices))}
        </p>
        <button class="h-8 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-bold" onclick={() => record(row)}>
          購入を記録
        </button>
      </div>
    </div>
  {/each}
</section>
