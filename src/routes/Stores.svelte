<script lang="ts">
  import { onMount } from 'svelte';
  import {
    listStores,
    upsertStore,
    touchStore,
    archiveStore,
    restoreStore,
    applyCatalogStore,
  } from '../lib/repositories/stores';
  import type { Store } from '../lib/domain/types';
  import { filterShops, type ShopRecord } from '../lib/domain/shops';
  import { storeLabel, mapUrl, cleanAddress } from '../lib/domain/stores';

  let stores = $state<Store[]>([]);
  let loading = $state(true);
  let showArchived = $state(false);
  let name = $state('');
  let address = $state('');
  let kind = $state<'store' | 'online'>('store');
  let favorite = $state(false);
  let message = $state('');
  let editing = $state<Store | null>(null);

  // 実在店舗カタログ（Konami カードゲームネットワーク）
  let catalog = $state<ShopRecord[] | null>(null);
  let catalogError = $state('');
  let catalogLoading = $state(false);

  async function ensureCatalog() {
    if (catalog || catalogLoading) return;
    catalogLoading = true;
    catalogError = '';
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/shops.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { shops: ShopRecord[] };
      const list = json.shops ?? [];
      catalog = list;
      // 既存店舗に公式の出典・住所を補完する（catalog 済みでも住所が無ければ埋める）
      let changed = false;
      for (const st of stores) {
        const hit = st.catalogId
          ? list.find((c) => c.id === st.catalogId)
          : list.find((c) => c.name === st.name);
        if (!hit) continue;
        const cleaned = hit.address ? cleanAddress(hit.address, st.name) : '';
        const needs =
          !st.source ||
          (!st.address && !!hit.address) ||
          (!!cleaned && st.address !== cleaned) ||
          (!!hit.address && st.memo === hit.address);
        if (!needs) continue;
        await applyCatalogStore(st.id, hit.id, hit.address);
        changed = true;
      }
      if (changed) await load();
    } catch {
      catalogError =
        '店舗データを読み込めませんでした。scripts/fetch-konami-shops.mjs で生成してください。';
    } finally {
      catalogLoading = false;
    }
  }

  const shopResults = $derived(
    catalog && name.trim() ? filterShops(catalog, name, 5) : [],
  );

  async function addFromCatalog(s: ShopRecord) {
    await upsertStore({
      name: s.name,
      kind: 'store',
      source: 'catalog',
      catalogId: s.id,
      area: s.state || '',
      address: cleanAddress(s.address || '', s.name),      memo: '',
    });
    message = `「${s.name}」を店舗に追加しました`;
    name = '';
    await load();
  }

  async function load() {
    stores = await listStores(showArchived);
    loading = false;
  }

  onMount(async () => {
    await load();
    await ensureCatalog();
  });

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await upsertStore({ name: trimmed, kind, address, favorite });
    name = '';
    address = '';
    favorite = false;
    message = `「${trimmed}」を追加しました`;
    await load();
  }

  async function toggleFavorite(s: Store) {
    await upsertStore({ id: s.id, name: s.name, shortName: s.shortName, kind: s.kind, favorite: s.favorite === 0, area: s.area, address: s.address, memo: s.memo });
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

  async function saveEdit() {
    if (!editing) return;
    const next = editing.name.trim();
    if (!next) return;
    await upsertStore({
      id: editing.id,
      name: next,
      shortName: editing.shortName,
      kind: editing.kind,
      area: editing.area,
      address: editing.address,
      favorite: editing.favorite === 1,
      memo: editing.memo,
    });
    message = `「${next}」に変更しました`;
    editing = null;
    await load();
  }
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] font-bold text-slate-500">店舗を追加</p>
    <input
      class="mt-2 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
      placeholder="店舗名で検索 または 新しい店舗名（例: 秋葉原 / カードラッシュ）"
      bind:value={name}
      oninput={ensureCatalog}
      onfocus={ensureCatalog}
      onkeydown={(e) => e.key === 'Enter' && add()}
    />

    {#if name.trim()}
      {#if catalogLoading}
        <p class="mt-1.5 text-[10px] text-slate-400">店舗データを読み込み中…</p>
      {:else if catalogError}
        <p class="mt-1.5 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          {catalogError}
        </p>
      {:else if catalog}
        <div class="mt-1.5 rounded-lg border border-slate-200 overflow-hidden">
          <p class="px-2 py-1 text-[9px] text-slate-500 bg-slate-50">
            実在店舗の候補（{shopResults.length} 件）
          </p>
          {#if shopResults.length === 0}
            <p class="px-2 py-2 text-[10px] text-slate-400">
              候補がありません。「追加する」でそのまま登録できます。
            </p>
          {:else}
            <ul class="divide-y divide-slate-100">
              {#each shopResults as s (s.id)}
                {@const added = stores.some((st) => st.name === s.name)}
                <li class="px-2 py-1.5 flex items-center gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-bold text-slate-900 truncate">{s.name}</p>
                    <p class="text-[9px] text-slate-500 truncate">{s.address || s.state}</p>
                  </div>
                  <button
                    class="shrink-0 h-7 px-2 rounded-md text-[10px] font-bold"
                    class:bg-emerald-600={!added}
                    class:text-white={!added}
                    class:bg-slate-100={added}
                    class:text-slate-400={added}
                    disabled={added}
                    onclick={() => addFromCatalog(s)}
                  >
                    {added ? '追加済み' : '追加'}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
          <p class="px-2 py-1 text-[8px] text-slate-400 bg-slate-50">
            出典: Konami カードゲームネットワーク 店舗検索（個人利用）
          </p>
        </div>
      {/if}
    {/if}
    <input
      class="mt-2 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
      placeholder="住所（任意・例: 東京都千代田区外神田1-15-16）"
      bind:value={address}
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
              {store.favorite ? '★' : ''}{storeLabel(store)}
            </p>
            <p class="text-[10px] text-slate-500 truncate">
              {#if store.shortName}<span class="text-slate-400">{store.name}・</span>{/if}
              {store.kind === 'store' ? '実店舗' : '通販'}
              {#if store.lastVisitedAt}
                ・最終訪問 {new Date(store.lastVisitedAt).toLocaleDateString('ja-JP')}
              {:else}
                ・未訪問
              {/if}
              {#if store.archivedAt}・アーカイブ{/if}
            </p>
            {#if store.address}
              <div class="mt-0.5 flex items-center gap-1.5">
                <p class="text-[9px] text-slate-500 truncate">{store.address}</p>
                <a
                  class="shrink-0 text-[9px] font-bold text-emerald-700 underline underline-offset-2"
                  href={mapUrl(store.address)}
                  target="_blank"
                  rel="noreferrer"
                >地図</a>
              </div>
            {/if}
          </div>
          <button
            class="h-8 px-2 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600"
            onclick={() => (editing = { ...store })}
          >
            編集
          </button>
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

{#if editing}
  <div class="fixed inset-0 z-50 bg-slate-900/40" onclick={() => (editing = null)} role="presentation">
    <div
      class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-white rounded-t-2xl p-4 space-y-3"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="flex items-center justify-between">
        <p class="text-[13px] font-bold text-slate-900">店舗を編集</p>
        <button class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[12px]" onclick={() => (editing = null)}>
          ✕
        </button>
      </div>

      <label class="block">
        <span class="text-[10px] text-slate-500">
          店舗名（正式名）{editing.source === 'catalog' ? '・変更不可' : ''}
        </span>
        <input
          class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
          bind:value={editing.name}
          disabled={editing.source === 'catalog'}
        />
        {#if editing.source === 'catalog'}
          <span class="mt-0.5 block text-[9px] text-slate-400">
            公式店舗の正式名は変更できません。表示を短くするには「短い別名」を使ってください。
          </span>
        {/if}
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">短い別名（表示用）</span>
        <input
          class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
          placeholder="例: PAO 秋葉原"
          bind:value={editing.shortName}
        />
        <span class="mt-0.5 block text-[9px] text-slate-400">
          入力すると一覧・巡回ではこの名前で表示します（未入力なら正式名）
        </span>
      </label>

      <div>
        <p class="text-[10px] text-slate-500 mb-1">種別</p>
        <div class="grid grid-cols-2 gap-0.5 rounded-lg bg-slate-200 p-0.5">
          {#each [['store', '実店舗'], ['online', '通販']] as [k, label] (k)}
            <button
              class="h-9 rounded-md text-[11px] font-bold"
              class:bg-white={editing.kind === k}
              class:text-slate-900={editing.kind === k}
              class:text-slate-500={editing.kind !== k}
              onclick={() => editing && (editing.kind = k as 'store' | 'online')}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>

      <label class="block">
        <span class="text-[10px] text-slate-500">エリア</span>
        <input
          class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
          placeholder="例: 東京 / 秋葉原"
          bind:value={editing.area}
        />
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">住所</span>
        <input
          class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
          placeholder="例: 東京都千代田区外神田1-15-16"
          bind:value={editing.address}
        />
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">メモ</span>
        <input
          class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
          placeholder="営業時間・フロアなど"
          bind:value={editing.memo}
        />
      </label>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button
          class="h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600"
          onclick={() => (editing = null)}
        >
          キャンセル
        </button>
        <button class="h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-bold" onclick={saveEdit}>
          保存
        </button>
      </div>
    </div>
  </div>
{/if}
