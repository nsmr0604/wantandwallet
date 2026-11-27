<script>
  import { purchases, reservations, budget, yen, money } from '../sample.js';
  let { go } = $props();

  const total = $derived(purchases.reduce((s, p) => s + p.unitPrice * p.qty + p.shipping, 0));
  const month = $derived(new Date().getMonth() + 1);
  const unitLabel = { single: '単品', pack: 'パック', box: 'BOX' };
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4 flex items-end justify-between">
    <div>
      <p class="text-[11px] text-slate-500">{month}月の購入</p>
      <p class="text-[22px] font-bold text-slate-900 leading-none mt-1">{yen(total)}</p>
      <p class="text-[10px] text-slate-500 mt-1">
        {purchases.length} 件・予算の {Math.round((total / budget.limit) * 100)}% ・予約枠 {money(budget.reserved)}
      </p>
    </div>
    <button class="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold" onclick={() => go('compare')}>
      ＋ 購入を記録
    </button>
  </div>

  {#if reservations.length}
    <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3">
      <p class="text-[11px] font-bold text-amber-900">予約中 {reservations.length} 件</p>
      <ul class="mt-1.5 space-y-2">
        {#each reservations as r (r.id)}
          <li class="flex items-center gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-[12px] font-bold text-amber-950 truncate">{r.name}</p>
              <p class="text-[10px] text-amber-800">{unitLabel[r.unit]} ・{r.store} ・{r.expectedAt} 発売</p>
            </div>
            <p class="text-[12px] font-bold text-amber-950">{money(r.unitPrice)}</p>
            <button class="h-7 px-2 rounded-md bg-amber-900 text-white text-[10px] font-bold">購入済みに</button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="flex items-center justify-between px-1">
    <p class="text-[11px] font-bold text-slate-500">購入履歴</p>
    <button class="text-[11px] text-slate-500 underline underline-offset-2">CSV 書き出し</button>
  </div>

  <ul class="space-y-2">
    {#each purchases as p (p.id)}
      <li class="rounded-xl bg-white border border-slate-200 p-3">
        <div class="flex items-start gap-2">
          <span class="text-[10px] text-slate-400 w-8 shrink-0 pt-0.5">{p.date}</span>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{p.name}</p>
            <p class="text-[10px] text-slate-500">
              {unitLabel[p.unit]}{p.rarity ? ' / ' + p.rarity : ''}・{p.store}
            </p>
          </div>
          <p class="text-[13px] font-bold text-slate-900">{yen(p.unitPrice * p.qty + p.shipping)}</p>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5 pl-10">
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.category}</span>
          <span class="text-[10px] text-slate-500">単価 {money(p.unitPrice)} × {p.qty}</span>
          {#if p.shipping > 0}
            <span class="text-[10px] text-slate-500">＋送料 {money(p.shipping)}</span>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <p class="text-[11px] font-bold text-slate-500 mb-2">購入を追加（フォーム案）</p>
    <div class="space-y-2">
      <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">灰流うらら</div>
      <div class="grid grid-cols-3 gap-1.5">
        <div class="h-9 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">単品</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-center">パック</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-center">BOX</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">数量 1</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">単価 ¥1,180</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">店舗 秋葉原A店</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">予約にする ☐</div>
      </div>
    </div>
  </div>
</section>
