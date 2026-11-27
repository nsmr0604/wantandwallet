<script>
  import { purchases, budget, yen } from '../sample.js';
  let { go } = $props();

  const total = $derived(purchases.reduce((s, p) => s + p.unit * p.qty + p.shipping, 0));
  const month = $derived(new Date().getMonth() + 1);
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4 flex items-end justify-between">
    <div>
      <p class="text-[11px] text-slate-500">{month}月の購入</p>
      <p class="text-[22px] font-bold text-slate-900 leading-none mt-1">{yen(total)}</p>
      <p class="text-[10px] text-slate-500 mt-1">{purchases.length} 件・予算の {Math.round((total / budget.limit) * 100)}%</p>
    </div>
    <button class="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold" onclick={() => go('compare')}>
      ＋ 購入を記録
    </button>
  </div>

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
              {p.code}{p.code !== '—' ? ' / ' + p.rarity : ''}・{p.store}
            </p>
          </div>
          <p class="text-[13px] font-bold text-slate-900">{yen(p.unit * p.qty + p.shipping)}</p>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5 pl-10">
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.category}</span>
          <span class="text-[10px] text-slate-500">単価 {yen(p.unit)} × {p.qty}</span>
          {#if p.shipping > 0}
            <span class="text-[10px] text-slate-500">＋送料 {yen(p.shipping)}</span>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <!-- 追加フォーム（モックでは折りたたみ表示） -->
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <p class="text-[11px] font-bold text-slate-500 mb-2">購入を追加（フォーム案）</p>
    <div class="space-y-2">
      <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">灰流うらら / QCCU-JP001 / UR</div>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">数量 1</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">単価 ¥1,180</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">送料 ¥0</div>
        <div class="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-[12px] text-slate-700">カテゴリ シングル</div>
      </div>
    </div>
  </div>
</section>
