<script lang="ts">
  import { onMount } from 'svelte';
  import { ensureSettings, db } from '../lib/db/schema';
  import { go } from '../lib/router.svelte';
  import type { Settings } from '../lib/domain/types';

  let settings = $state<Settings | null>(null);
  let saved = $state('');

  onMount(async () => {
    settings = await ensureSettings();
  });

  async function save() {
    if (!settings) return;
    await db.settings.put({ ...settings, updatedAt: Date.now() });
    saved = '保存しました';
    setTimeout(() => (saved = ''), 1500);
  }
</script>

<section class="space-y-3">
  {#if settings}
    <div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
      <p class="text-[11px] font-bold text-slate-500">予算・既定値</p>

      <label class="block">
        <span class="text-[10px] text-slate-500">月次予算（円）</span>
        <input
          class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px]"
          type="number"
          min="0"
          bind:value={settings.defaultMonthlyLimit}
        />
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">1BOX のパック数（既定）</span>
        <input
          class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px]"
          type="number"
          min="1"
          bind:value={settings.defaultPacksPerBox}
        />
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">ストレージの初期価格（円）</span>
        <input
          class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px]"
          type="number"
          min="0"
          bind:value={settings.storageUnitPrice}
        />
      </label>

      <button class="w-full h-10 rounded-lg bg-emerald-600 text-white text-[12px] font-bold" onclick={save}>
        保存する
      </button>
      {#if saved}
        <p class="text-[10px] text-emerald-700">{saved}</p>
      {/if}
    </div>

    <button
      class="w-full rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-2 text-left"
      onclick={() => go('stores')}
    >
      <div class="min-w-0 flex-1">
        <p class="text-[12px] font-bold text-slate-800">店舗の管理</p>
        <p class="text-[10px] text-slate-500">追加・お気に入り・訪問記録</p>
      </div>
      <span class="text-slate-300">›</span>
    </button>

    <div class="rounded-2xl bg-white border border-slate-200 p-4">
      <p class="text-[11px] font-bold text-slate-500">データ</p>
      <p class="mt-1 text-[10px] text-slate-500">
        エクスポート / インポートは S6 で実装します。データは端末内（IndexedDB）のみです。
      </p>
    </div>

    <div class="rounded-2xl bg-white border border-slate-200 p-4">
      <p class="text-[11px] font-bold text-slate-500">このアプリについて</p>
      <p class="mt-1 text-[10px] text-slate-500 leading-relaxed">
        wantandwallet 0.1.0（S1）<br />
        非公式ツールです。コナミ・権利者とは関係ありません。
      </p>
    </div>
  {:else}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {/if}
</section>
