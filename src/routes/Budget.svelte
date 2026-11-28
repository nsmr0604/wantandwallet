<script lang="ts">
  import { onMount } from 'svelte';
  import { ensureSettings } from '../lib/db/schema';
  import { listPurchases } from '../lib/repositories/purchases';
  import type { Category, Purchase, Settings } from '../lib/domain/types';

  let settings = $state<Settings | null>(null);
  let purchases = $state<Purchase[]>([]);
  let loading = $state(true);

  onMount(async () => {
    settings = await ensureSettings();
    purchases = await listPurchases();
    loading = false;
  });

  const yen = (n: number) => `${n < 0 ? '-' : ''}¥${Math.abs(n).toLocaleString('ja-JP')}`;
  const catLabel: Record<Category, string> = {
    newset: '新弾',
    single: 'シングル',
    goods: 'グッズ',
    other: 'その他',
  };

  const bought = $derived(purchases.filter((p) => p.status === 'bought'));
  const reserved = $derived(purchases.filter((p) => p.status === 'reserved'));
  const spent = $derived(bought.reduce((n, p) => n + p.total, 0));
  const reservedTotal = $derived(reserved.reduce((n, p) => n + p.total, 0));
  const limit = $derived(settings?.defaultMonthlyLimit ?? 0);
  const committed = $derived(spent + reservedTotal);
  const remaining = $derived(limit - committed);
  const rate = $derived(limit > 0 ? Math.round((committed / limit) * 100) : 0);
  const over = $derived(remaining < 0);

  const scale = $derived(committed > limit && limit > 0 ? limit / committed : 1);
  const spentPct = $derived(limit > 0 ? (spent / limit) * 100 * scale : 0);
  const reservedPct = $derived(limit > 0 ? (reservedTotal / limit) * 100 * scale : 0);
  const remainPct = $derived(Math.max(0, 100 - spentPct - reservedPct));

  const categories = $derived(
    (Object.keys(catLabel) as Category[]).map((key) => ({
      key,
      label: catLabel[key],
      allocation: settings?.categoryDefaults[key] ?? 0,
      spent: bought.filter((p) => p.category === key).reduce((n, p) => n + p.total, 0),
    })),
  );

  const now = new Date();
  const daysLeft =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  const perDay = $derived(Math.max(0, Math.floor(remaining / Math.max(1, daysLeft))));
  const monthLabel = `${now.getMonth() + 1}月`;
</script>

<section class="space-y-3">
  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else}
    <div class="rounded-2xl bg-white border border-slate-200 p-4">
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-bold text-slate-500">{monthLabel}の予算</p>
        <span class="text-[11px] font-bold" class:text-rose-600={over} class:text-slate-500={!over}>{rate}% 使用</span>
      </div>
      <p class="mt-1 text-[28px] font-bold text-slate-900 leading-none">{yen(limit)}</p>

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
          <p class="text-[13px] font-bold text-slate-900">{yen(spent)}</p>
        </div>
        <div class="rounded-lg bg-amber-50 py-2">
          <p class="text-[10px] text-amber-800">予約中（未払）</p>
          <p class="text-[13px] font-bold text-amber-900">{yen(reservedTotal)}</p>
        </div>
        <div class="rounded-lg py-2" class:bg-rose-50={over} class:bg-emerald-50={!over}>
          <p class="text-[10px]" class:text-rose-700={over} class:text-emerald-700={!over}>残り</p>
          <p class="text-[13px] font-bold" class:text-rose-800={over} class:text-emerald-800={!over}>{yen(remaining)}</p>
        </div>
        <div class="rounded-lg bg-slate-50 py-2">
          <p class="text-[10px] text-slate-500">1日あたり</p>
          <p class="text-[13px] font-bold text-slate-900">{yen(perDay)}</p>
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
              <span class="text-slate-500">{yen(c.spent)} / {yen(c.allocation)}</span>
            </div>
            <div class="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full"
                class:bg-emerald-500={c.allocation === 0 || c.spent <= c.allocation}
                class:bg-rose-500={c.allocation > 0 && c.spent > c.allocation}
                style="width: {c.allocation > 0 ? Math.min(100, (c.spent / c.allocation) * 100) : 0}%"
              ></div>
            </div>
          </li>
        {/each}
      </ul>
      <p class="mt-2 text-[10px] text-slate-400">
        配分の合計 {yen(categories.reduce((n, c) => n + c.allocation, 0))}（設定の予算と一致推奨）
      </p>
    </div>

    {#if over}
      <div class="rounded-2xl bg-rose-50 border border-rose-200 p-3">
        <p class="text-[11px] font-bold text-rose-900">予算超過</p>
        <p class="text-[11px] text-rose-900 mt-0.5">購入＋予約が上限を {yen(-remaining)} 超えています。</p>
      </div>
    {:else}
      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3">
        <p class="text-[11px] font-bold text-slate-700">{monthLabel}は残り {daysLeft} 日</p>
        <p class="text-[11px] text-slate-600 mt-0.5">1日あたり {yen(perDay)} まで使えます（予約込み）。</p>
      </div>
    {/if}

    <p class="px-1 text-[10px] text-slate-400">
      予算額とカテゴリ配分は設定画面で変更できます。予約を「購入済み」にすると黄色→緑へ移ります。
    </p>
  {/if}
</section>
