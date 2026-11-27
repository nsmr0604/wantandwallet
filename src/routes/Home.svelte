<script lang="ts">
  import { onMount } from 'svelte';
  import { ensureSettings } from '../lib/db/schema';
  import { go } from '../lib/router.svelte';
  import type { Settings } from '../lib/domain/types';

  let settings = $state<Settings | null>(null);

  onMount(async () => {
    settings = await ensureSettings();
  });
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-slate-900 text-white p-4">
    <p class="text-[11px] text-slate-300">wantandwallet</p>
    <p class="mt-1 text-[15px] font-bold leading-snug">
      遊戯王 OCG のシングル価格比較・購入記録・予算管理
    </p>
    <p class="mt-1 text-[10px] text-slate-400">S0: 基盤（画面骨格・DB・PWA）まで実装済み</p>
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
    <p class="text-[11px] font-bold text-amber-900">S0 で確認できること</p>
    <ul class="mt-1 text-[10px] text-amber-900 list-disc pl-4 space-y-0.5">
      <li>9 画面の遷移（下部タブ / ヘッダー）</li>
      <li>IndexedDB の初期化（設定レコードの作成）</li>
      <li>PWA としてのインストール（HTTPS 配信時）</li>
    </ul>
  </div>
</section>
