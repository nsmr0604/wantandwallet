<script>
  import { budget, wishItems, releases, purchases, yen } from '../sample.js';
  let { go } = $props();

  const remaining = $derived(budget.limit - budget.spent);
  const rate = $derived(Math.round((budget.spent / budget.limit) * 100));
  const next = $derived(releases.filter((r) => r.days >= 0).sort((a, b) => a.days - b.days)[0]);
  const top = $derived(
    wishItems
      .filter((w) => w.wanted - w.bought > 0)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3),
  );
</script>

<section class="space-y-3">
  <!-- 今月の予算 -->
  <div class="rounded-2xl bg-slate-900 text-white p-4">
    <div class="flex items-baseline justify-between">
      <p class="text-[11px] text-slate-300">11月の残り</p>
      <button class="text-[11px] text-slate-300 underline underline-offset-2" onclick={() => go('budget')}>内訳</button>
    </div>
    <p class="mt-1 text-[32px] font-bold leading-none tracking-tight">{yen(remaining)}</p>
    <div class="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
      <div class="h-full bg-emerald-400" style="width: {rate}%"></div>
    </div>
    <div class="mt-2 flex justify-between text-[11px] text-slate-300">
      <span>使用 {yen(budget.spent)} / {yen(budget.limit)}</span>
      <span>{rate}%</span>
    </div>
  </div>

  <!-- 新弾 -->
  <button
    class="w-full text-left rounded-2xl bg-white border border-slate-200 p-4"
    onclick={() => go('releases')}
  >
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-bold text-slate-500">次の新弾</p>
      <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        あと {next.days} 日
      </span>
    </div>
    <p class="mt-1 text-[13px] font-bold text-slate-900 leading-snug">{next.name}</p>
    <p class="mt-0.5 text-[11px] text-slate-500">
      2026/12/19（土）・{next.kind}
      {#if next.msrpPack}・1パック ¥{next.msrpPack.toLocaleString('ja-JP')}{/if}
      {#if next.msrpBox}・1BOX ¥{next.msrpBox.toLocaleString('ja-JP')}{/if}
    </p>
  </button>

  <!-- 予約中 -->
  <button
    class="w-full text-left rounded-2xl bg-amber-50 border border-amber-200 p-4"
    onclick={() => go('purchase')}
  >
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-bold text-amber-900">予約中 1 件</p>
      <span class="text-[10px] text-amber-800">12/19 発売</span>
    </div>
    <p class="mt-1 text-[12px] font-bold text-amber-950">PRIDE AND SOUL・1BOX</p>
    <p class="text-[10px] text-amber-800">秋葉原 A 店・¥5,940</p>
  </button>

  <!-- 欲しいリスト -->
  <div class="rounded-2xl bg-white border border-slate-200">
    <div class="px-4 pt-3 pb-1 flex items-center justify-between">
      <p class="text-[11px] font-bold text-slate-500">欲しいリスト（優先度順）</p>
      <button class="text-[11px] text-slate-500 underline underline-offset-2" onclick={() => go('wish')}>すべて</button>
    </div>
    <ul class="divide-y divide-slate-100">
      {#each top as w (w.id)}
        <li class="px-4 py-2.5 flex items-center gap-3">
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            class:bg-rose-500={w.priority === 1}
            class:bg-amber-400={w.priority === 2}
            class:bg-slate-300={w.priority === 3}
          ></span>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-slate-900 truncate">{w.name}</p>
            <p class="text-[10px] text-slate-500">{w.rarity || 'レアリティ指定なし'}</p>
          </div>
          <div class="ml-auto text-right">
            <p class="text-[11px] text-slate-500">残り {w.wanted - w.bought} 枚</p>
            <p class="text-[11px] font-bold text-slate-900">目標 {yen(w.target)}</p>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <!-- 巡回のショートカット -->
  <button
    class="w-full rounded-2xl bg-emerald-600 text-white p-4 flex items-center gap-3 active:bg-emerald-700"
    onclick={() => go('patrol')}
  >
    <span class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h5l2 10h6" /><circle cx="18" cy="7" r="2" />
      </svg>
    </span>
    <span class="text-left">
      <span class="block text-[13px] font-bold">店舗を選んで巡回をはじめる</span>
      <span class="block text-[11px] text-emerald-100">欲しいカードを上から順に価格入力</span>
    </span>
  </button>

  <!-- 最近の購入 -->
  <div class="rounded-2xl bg-white border border-slate-200">
    <div class="px-4 pt-3 pb-1 flex items-center justify-between">
      <p class="text-[11px] font-bold text-slate-500">最近の購入</p>
      <button class="text-[11px] text-slate-500 underline underline-offset-2" onclick={() => go('purchase')}>すべて</button>
    </div>
    <ul class="divide-y divide-slate-100">
      {#each purchases.slice(0, 2) as p (p.id)}
        <li class="px-4 py-2.5 flex items-center gap-3">
          <span class="text-[10px] text-slate-400 w-8 shrink-0">{p.date}</span>
          <div class="min-w-0">
            <p class="text-[12px] text-slate-900 truncate">{p.name} ×{p.qty}</p>
            <p class="text-[10px] text-slate-500">{p.store}</p>
          </div>
          <p class="ml-auto text-[12px] font-bold text-slate-900">{yen(p.unitPrice * p.qty + p.shipping)}</p>
        </li>
      {/each}
    </ul>
  </div>
</section>
