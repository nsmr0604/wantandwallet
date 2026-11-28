<script lang="ts">
  import { onMount } from 'svelte';
  import {
    listStores,
    upsertStore,
    touchStore,
    archiveStore,
    restoreStore,
  } from '../lib/repositories/stores';
  import type { Store } from '../lib/domain/types';

  let stores = $state<Store[]>([]);
  let loading = $state(true);
  let showArchived = $state(false);
  let name = $state('');
  let kind = $state<'store' | 'online'>('store');
  let favorite = $state(false);
  let message = $state('');

  async function load() {
    stores = await listStores(showArchived);
    loading = false;
  }

  onMount(load);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await upsertStore({ name: trimmed, kind, favorite });
    name = '';
    favorite = false;
    message = `「${trimmed}」を追加しました`;
    await load();
  }

  async function toggleFavorite(s: Store) {
    await upsertStore({ id: s.id, name: s.name, kind: s.kind, favorite: s.favorite === 0, area: s.area, url: s.url, memo: s.memo });
    await load();
  }

  async function use(s: Store) {
    await touchStore(s.id);
    message = `「${s.name}」を訪問済みにしました`;
    await load();
  }

  async function archive(s: Store) {
    await archiveStore(s.id);
    await load();
  }

  async function restore(s: Store) {
    await restoreStore(s.id);
    await load();
  }
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">店舗を追加</p>
    <input
      class="mt-2 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
      placeholder="店舗名（例: 秋葉原 A 店）"
      bind:value={name}
      onkeydown={(e) => e.key === 'Enter' && add()}
    />
    <div class="mt-2 grid grid-cols-2 gap-2">
      <div class="grid grid-cols-2 gap-0.5 rounded-lg bg-slate-200 p-0.5">
        {#each [['store', '実店舗'], ['online', '通販']] as [k, label] (k)}
          <button
            class="h-9 rounded-md text-[11px] font-bold"
            class:bg-white={kind === k}
            class:text-slate-900={kind === k}
            class:text-slate-500={kind !== k}
            onclick={() => (kind = k as 'store' | 'online')}
          >
            {label}
          </button>
        {/each}
      </div>
      <button
        class="h-9 rounded-lg border text-[11px] font-bold"
        class:border-amber-300={favorite}
        class:bg-amber-50={favorite}
        class:text-amber-800={favorite}
        class:border-slate-300={!favorite}
        class:text-slate-600={!favorite}
        onclick={() => (favorite = !favorite)}
      >
        {favorite ? '★ お気に入り' : '☆ お気に入り'}
      </button>
    </div>
    <button class="mt-2 w-full h-10 rounded-lg bg-emerald-600 text-white text-[12px] font-bold" onclick={add}>
      追加する
    </button>
  </div>

  {#if message}
    <p class="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[10px] text-emerald-800">
      {message}
    </p>
  {/if}

  <div class="flex items-center justify-between px-1">
    <p class="text-[11px] font-bold text-slate-500">店舗一覧（{stores.length}）</p>
    <button
      class="text-[10px] text-slate-500 underline underline-offset-2"
      onclick={() => { showArchived = !showArchived; load(); }}
    >
      {showArchived ? 'アーカイブを隠す' : 'アーカイブも表示'}
    </button>
  </div>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if stores.length === 0}
    <p class="rounded-xl bg-white border border-dashed border-slate-300 p-6 text-center text-[11px] text-slate-500">
      店舗がまだありません。上のフォームから追加してください。
    </p>
  {/if}

  <ul class="space-y-2">
    {#each stores as store (store.id)}
      <li class="rounded-xl bg-white border border-slate-200 p-3" class:opacity-60={store.archivedAt}>
        <div class="flex items-center gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">
              {store.favorite ? '★' : ''}{store.name}
            </p>
            <p class="text-[10px] text-slate-500">
              {store.kind === 'store' ? '実店舗' : '通販'}
              {#if store.lastVisitedAt}
                ・最終訪問 {new Date(store.lastVisitedAt).toLocaleDateString('ja-JP')}
              {:else}
                ・未訪問
              {/if}
              {#if store.archivedAt}・アーカイブ{/if}
            </p>
          </div>
          <button
            class="h-8 px-2 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600"
            onclick={() => toggleFavorite(store)}
          >
            {store.favorite ? '★' : '☆'}
          </button>
        </div>
        <div class="mt-2 flex gap-2">
          {#if store.archivedAt}
            <button class="flex-1 h-8 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600" onclick={() => restore(store)}>
              復元
            </button>
          {:else}
            <button class="flex-1 h-8 rounded-lg bg-slate-900 text-white text-[10px] font-bold" onclick={() => use(store)}>
              訪問した
            </button>
            <button class="flex-1 h-8 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600" onclick={() => archive(store)}>
              アーカイブ
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <p class="px-1 text-[10px] text-slate-400">
    店舗は「最後に訪問した順」で巡回画面に並びます。お気に入りは同着時に優先されます。
  </p>
</section>
