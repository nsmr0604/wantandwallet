<script lang="ts">
  import { onMount } from 'svelte';
  import { ensureSettings } from '../lib/db/schema';
  import { listPurchases } from '../lib/repositories/purchases';
  import { go } from '../lib/router.svelte';
  import type { Purchase, Settings } from '../lib/domain/types';

  let settings = $state<Settings | null>(null);
  let purchases = $state<Purchase[]>([]);

  onMount(async () => {
    settings = await ensureSettings();
    purchases = await listPurchases();
  });

  const spent = $derived(
    purchases.filter((p) => p.status === 'bought').reduce((n, p) => n + p.total, 0),
  );
  const reserved = $derived(
    purchases.filter((p) => p.status === 'reserved').reduce((n, p) => n + p.total, 0),
  );
  const limit = $derived(settings?.defaultMonthlyLimit ?? 0);
  const remaining = $derived(limit - spent - reserved);
  const rate = $derived(limit > 0 ? Math.round(((spent + reserved) / limit) * 100) : 0);
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-slate-900 text-white p-4">
    <div class="flex items-baseline justify-between">
      <p class="text-[11px] text-slate-300">今月の残り</p>
      <button class="text-[11px] text-slate-300 underline underline-offset-2" onclick={() => go('budget')}>内訳</button>
    </div>
    <p class="mt-1 text-[28px] font-bold leading-none" class:text-rose-300={remaining < 0}>{remaining < 0 ? '-' : ''}¥{Math.abs(remaining).toLocaleString('ja-JP')}</p>
    <div class="mt-3 h-2 flex rounded-full bg-white/20 overflow-hidden">
      <div class="h-full bg-emerald-400" style="width: {limit > 0 ? Math.min(100, (spent / limit) * 100) : 0}%"></div>
      <div class="h-full bg-amber-300" style="width: {limit > 0 ? Math.min(100, (reserved / limit) * 100) : 0}%"></div>
    </div>
    <div class="mt-2 flex justify-between text-[10px] text-slate-300">
      <span>購入 ¥{spent.toLocaleString('ja-JP')} ＋ 予約 ¥{reserved.toLocaleString('ja-JP')} / ¥{limit.toLocaleString('ja-JP')}</span>
      <span>{rate}%</span>
    </div>
  </div>

  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">現在の設定</p>
    {#if settings}
      <dl class="mt-2 space-y-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <dt class="text-slate-500">月次予算</dt>
          <dd class="font-bold text-slate-900">¥{settings.defaultMonthlyLimit.toLocaleString('ja-JP')}</dd>
        </div>
        <div class="flex items-center justify-between text-[11px]">
          <dt class="text-slate-500">1BOX のパック数</dt>
          <dd class="font-bold text-slate-900">{settings.defaultPacksPerBox} パック</dd>
        </div>
        <div class="flex items-center justify-between text-[11px]">
          <dt class="text-slate-500">ストレージの初期価格</dt>
          <dd class="font-bold text-slate-900">¥{settings.storageUnitPrice}</dd>
        </div>
      </dl>
      <button
        class="mt-3 w-full h-9 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-600"
        onclick={() => go('settings')}
      >
        設定を開く
      </button>
    {:else}
      <p class="mt-2 text-[11px] text-slate-400">読み込み中…</p>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-2">
    <button
      class="rounded-xl bg-white border border-slate-200 p-3 text-left"
      onclick={() => go('wish')}
    >
      <p class="text-[11px] font-bold text-slate-900">欲しいリスト</p>
      <p class="mt-0.5 text-[10px] text-slate-500">カード名で管理</p>
    </button>
    <button
      class="rounded-xl bg-white border border-slate-200 p-3 text-left"
      onclick={() => go('patrol')}
    >
      <p class="text-[11px] font-bold text-slate-900">巡回モード</p>
      <p class="mt-0.5 text-[10px] text-slate-500">店舗で価格入力</p>
    </button>
  </div>

  <div class="rounded-xl bg-amber-50 border border-amber-200 p-3">
    <p class="text-[11px] font-bold text-amber-900">できること</p>
    <ul class="mt-1 text-[10px] text-amber-900 list-disc pl-4 space-y-0.5">
      <li>欲しいリスト（カード名・優先度・目標価格）</li>
      <li>店舗マスタ（実在店舗検索・別名・地図）</li>
      <li>巡回モードで価格記録 → カード別/店舗別の比較</li>
      <li>購入・予約の記録と月次予算（残り = 上限 − 購入 − 予約）</li>
    </ul>
  </div>
</section>
