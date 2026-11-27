<script>
  import { budget, money } from '../sample.js';
  import { shop, entryTotal } from '../store.svelte.js';
  let { go } = $props();

  const keyOf = { シングル: 'single', 新弾: 'newset', グッズ: 'goods', その他: 'other' };
  const bought = $derived(shop.entries.filter((e) => e.status === 'bought'));
  const reservedEntries = $derived(shop.entries.filter((e) => e.status === 'reserved'));
  const spent = $derived(bought.reduce((s, e) => s + entryTotal(e), 0));
  const reserved = $derived(reservedEntries.reduce((s, e) => s + entryTotal(e), 0));
  const categories = $derived(
    budget.categories.map((c) => ({
      ...c,
      spent: bought.filter((e) => keyOf[e.category] === c.key).reduce((s, e) => s + entryTotal(e), 0),
    })),
  );
  const committed = $derived(spent + reserved);
  // 残り = 上限 − 購入 − 予約（予約も残枠を消費する）
  const remaining = $derived(budget.limit - committed);
  const over = $derived(remaining < 0);
  const rate = $derived(Math.round((committed / budget.limit) * 100));

  // 合計が上限を超えた場合は、バー内で比率を保って縮める
  const scale = $derived(committed > budget.limit ? budget.limit / committed : 1);
  const spentPct = $derived((spent / budget.limit) * 100 * scale);
  const reservedPct = $derived((reserved / budget.limit) * 100 * scale);
  const remainPct = $derived(Math.max(0, 100 - spentPct - reservedPct));

  const daysLeft = 4; // 11/27〜11/30（モック用の固定値）
  const perDay = $derived(Math.max(0, Math.floor(remaining / daysLeft)));
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-bold text-slate-500">11月の予算</p>
      <button class="text-[11px] text-slate-500 underline underline-offset-2">変更</button>
    </div>
    <div class="mt-2 flex items-end gap-2">
      <p class="text-[28px] font-bold text-slate-900 leading-none">{money(budget.limit)}</p>
      <p class="text-[11px] text-slate-500 pb-0.5">上限</p>
      <p class="ml-auto text-[11px] font-bold" class:text-rose-600={over} class:text-slate-500={!over}>{rate}% 使用</p>
    </div>

    <!-- 3色の積み上げバー: 購入 / 予約 / 残り -->
    <div class="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
      <div class="h-full bg-emerald-500" style="width: {spentPct}%"></div>
      <div class="h-full bg-amber-400" style="width: {reservedPct}%"></div>
      <div class="h-full bg-slate-200" style="width: {remainPct}%"></div>
    </div>
    <div class="mt-1.5 flex items-center gap-3 text-[9px] text-slate-500">
      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-emerald-500"></span>購入</span>
      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-amber-400"></span>予約</span>
      <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-slate-200"></span>残り</span>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2 text-center">
      <div class="rounded-lg bg-slate-50 py-2">
        <p class="text-[10px] text-slate-500">購入済み</p>
        <p class="text-[13px] font-bold text-slate-900">{money(spent)}</p>
      </div>
      <div class="rounded-lg bg-amber-50 py-2">
        <p class="text-[10px] text-amber-800">予約中（未払）</p>
        <p class="text-[13px] font-bold text-amber-900">{money(reserved)}</p>
      </div>
      <div class="rounded-lg py-2" class:bg-rose-50={over} class:bg-emerald-50={!over}>
        <p class="text-[10px]" class:text-rose-700={over} class:text-emerald-700={!over}>残り</p>
        <p class="text-[13px] font-bold" class:text-rose-800={over} class:text-emerald-800={!over}>{money(remaining)}</p>
      </div>
      <div class="rounded-lg bg-slate-50 py-2">
        <p class="text-[10px] text-slate-500">1日あたり</p>
        <p class="text-[13px] font-bold text-slate-900">{money(perDay)}</p>
      </div>
    </div>

    <p class="mt-2 text-[10px] text-slate-400">残り = 上限 − 購入済み − 予約中</p>
  </div>

  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">カテゴリ別（購入済みのみ）</p>
    <ul class="mt-2 space-y-2.5">
      {#each categories as c (c.key)}
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
    <p class="mt-2 text-[10px] text-slate-400">
      配分の合計 {money(categories.reduce((s, c) => s + c.allocation, 0))}（上限と一致）。予約は総額の予約枠に含みます。
    </p>
  </div>

  {#if over}
    <div class="rounded-2xl bg-rose-50 border border-rose-200 p-3">
      <p class="text-[11px] font-bold text-rose-900">予算超過</p>
      <p class="text-[11px] text-rose-900 mt-0.5">購入＋予約が上限を {money(-remaining)} 超えています。予約を見直すか、上限を上げてください。</p>
    </div>
  {:else}
    <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <p class="text-[11px] font-bold text-slate-700">残り {daysLeft} 日</p>
      <p class="text-[11px] text-slate-600 mt-0.5">1日あたり {money(perDay)} まで使えます（予約込みの残り {money(remaining)}）。</p>
    </div>
  {/if}

  <p class="px-1 text-[10px] text-slate-400">
    予約を「購入済み」にすると、黄色の予約枠が緑の購入へ移ります（金額は増えません）。
  </p>

  <button class="w-full h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={() => go('settings')}>
    来月の予算と配分を設定
  </button>
</section>
