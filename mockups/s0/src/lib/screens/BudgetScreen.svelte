<script>
  import { budget, yen } from '../sample.js';
  let { go } = $props();

  const remaining = $derived(budget.limit - budget.spent);
  const rate = $derived(Math.round((budget.spent / budget.limit) * 100));
  const daysLeft = 4; // 11/27〜11/30（モック用の固定値）
  const perDay = $derived(Math.floor(remaining / daysLeft));
  const money = (n) => '¥' + n.toLocaleString('ja-JP');
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-bold text-slate-500">11月の予算</p>
      <button class="text-[11px] text-slate-500 underline underline-offset-2">変更</button>
    </div>
    <div class="mt-2 flex items-end gap-2">
      <p class="text-[28px] font-bold text-slate-900 leading-none">{yen(budget.limit)}</p>
      <p class="text-[11px] text-slate-500 pb-0.5">上限</p>
    </div>

    <div class="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <div class="h-full bg-emerald-500" style="width: {rate}%"></div>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2 text-center">
      <div class="rounded-lg bg-slate-50 py-2">
        <p class="text-[10px] text-slate-500">使用</p>
        <p class="text-[13px] font-bold text-slate-900">{money(budget.spent)}</p>
      </div>
      <div class="rounded-lg bg-emerald-50 py-2">
        <p class="text-[10px] text-emerald-700">残り</p>
        <p class="text-[13px] font-bold text-emerald-800">{money(remaining)}</p>
      </div>
      <div class="rounded-lg bg-amber-50 py-2">
        <p class="text-[10px] text-amber-800">予約枠（未払）</p>
        <p class="text-[13px] font-bold text-amber-900">{money(budget.reserved)}</p>
      </div>
      <div class="rounded-lg bg-slate-50 py-2">
        <p class="text-[10px] text-slate-500">1日あたり</p>
        <p class="text-[13px] font-bold text-slate-900">{money(perDay)}</p>
      </div>
    </div>
  </div>

  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">カテゴリ別</p>
    <ul class="mt-2 space-y-2.5">
      {#each budget.categories as c (c.key)}
        <li>
          <div class="flex items-baseline justify-between text-[11px]">
            <span class="font-medium text-slate-700">{c.label}</span>
            <span class="text-slate-500">{money(c.spent)} / {money(c.allocation)}</span>
          </div>
          <div class="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              class="h-full"
              class:bg-emerald-500={c.spent <= c.allocation}
              class:bg-rose-500={c.spent > c.allocation}
              style="width: {Math.min(100, (c.spent / c.allocation) * 100)}%"
            ></div>
          </div>
        </li>
      {/each}
    </ul>
    <p class="mt-2 text-[10px] text-slate-400">配分の合計 {money(budget.categories.reduce((s, c) => s + c.allocation, 0))}（上限と一致）</p>
  </div>

  <div class="rounded-2xl bg-rose-50 border border-rose-200 p-3">
    <p class="text-[11px] font-bold text-rose-900">注意（表示案）</p>
    <p class="text-[11px] text-rose-900 mt-0.5">
      11月は残り {daysLeft} 日。1日あたり {money(perDay)} まで使えます（残り {money(remaining)}）。
    </p>
  </div>

  <button class="w-full h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={() => go('settings')}>
    来月の予算と配分を設定
  </button>
</section>
