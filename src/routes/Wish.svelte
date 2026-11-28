<script lang="ts">
  import { onMount } from 'svelte';
  import { listWish, upsertWish, removeWish, type WishRow } from '../lib/repositories/wish';
  import { purchasedQty } from '../lib/repositories/purchases';
  import { go } from '../lib/router.svelte';
  import type { Priority } from '../lib/domain/types';

  let rows = $state<WishRow[]>([]);
  let bought = $state<Record<string, number>>({});
  let loading = $state(true);
  let filter = $state<'all' | 'high' | 'mid' | 'low' | 'done'>('all');
  let sort = $state<'priority' | 'name' | 'target' | 'remaining' | 'added'>('priority');
  let editing = $state<WishRow | null>(null);

  async function load() {
    rows = await listWish();
    const next: Record<string, number> = {};
    for (const r of rows) next[r.cardId] = await purchasedQty(r.cardId);
    bought = next;
    loading = false;
  }

  onMount(load);

  const remaining = (r: WishRow) => Math.max(0, r.qtyWanted - (bought[r.cardId] ?? 0));
  const active = $derived(rows.filter((r) => remaining(r) > 0));
  const done = $derived(rows.filter((r) => remaining(r) === 0));

  const visible = $derived(
    rows.filter((r) => {
      if (filter === 'done') return remaining(r) === 0;
      if (remaining(r) === 0) return false;
      if (filter === 'high') return r.priority === 1;
      if (filter === 'mid') return r.priority === 2;
      if (filter === 'low') return r.priority === 3;
      return true;
    }),
  );

  const collator = new Intl.Collator('ja', { numeric: true });
  const sorted = $derived(
    [...visible].sort((a, b) => {
      if (sort === 'name') return collator.compare(a.card?.nameJa ?? '', b.card?.nameJa ?? '');
      if (sort === 'target') return (b.targetPrice ?? 0) - (a.targetPrice ?? 0);
      if (sort === 'remaining') return remaining(b) - remaining(a);
      if (sort === 'added') return a.createdAt - b.createdAt;
      return a.priority - b.priority || a.createdAt - b.createdAt;
    }),
  );

  const totalRemaining = $derived(active.reduce((n, r) => n + remaining(r), 0));
  const targetTotal = $derived(
    active.reduce((n, r) => n + (r.targetPrice ?? 0) * remaining(r), 0),
  );

  const priorityLabel: Record<number, string> = { 1: '高', 2: '中', 3: '低' };

  async function saveEdit() {
    if (!editing) return;
    await upsertWish({
      cardId: editing.cardId,
      qtyWanted: Math.max(1, Number(editing.qtyWanted) || 1),
      priority: editing.priority,
      targetPrice: Math.max(0, Number(editing.targetPrice) || 0),
      memo: editing.memo,
    });
    editing = null;
    await load();
  }

  async function remove(row: WishRow) {
    await removeWish(row.id);
    editing = null;
    await load();
  }
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-slate-900 text-white p-4">
    <div class="flex items-baseline justify-between">
      <p class="text-[11px] text-slate-300">欲しいもの</p>
      <button class="text-[11px] text-slate-300 underline underline-offset-2" onclick={() => go('search')}>
        ＋ 追加
      </button>
    </div>
    <div class="mt-2 grid grid-cols-3 gap-2">
      <div>
        <p class="text-[9px] text-slate-400">種類</p>
        <p class="text-[18px] font-bold leading-none">{active.length}</p>
      </div>
      <div>
        <p class="text-[9px] text-slate-400">残り</p>
        <p class="text-[18px] font-bold leading-none">{totalRemaining}</p>
      </div>
      <div>
        <p class="text-[9px] text-slate-400">目標合計</p>
        <p class="text-[18px] font-bold leading-none">¥{targetTotal.toLocaleString('ja-JP')}</p>
      </div>
    </div>
  </div>

  <div class="flex gap-1.5 overflow-x-auto pb-1">
    {#each [['all', 'すべて'], ['high', '優先度 高'], ['mid', '中'], ['low', '低'], ['done', '達成済み']] as [key, label] (key)}
      <button
        class="shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium"
        class:bg-slate-900={filter === key}
        class:text-white={filter === key}
        class:border-slate-900={filter === key}
        class:bg-white={filter !== key}
        class:text-slate-600={filter !== key}
        class:border-slate-200={filter !== key}
        onclick={() => (filter = key as typeof filter)}
      >
        {label}{#if key === 'all'} {active.length}{/if}{#if key === 'done'} {done.length}{/if}
      </button>
    {/each}
  </div>

  <div class="flex items-center gap-2 px-1">
    <p class="text-[10px] text-slate-500 shrink-0">並べ替え</p>
    <select
      class="h-8 flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none"
      bind:value={sort}
    >
      <option value="priority">優先度順</option>
      <option value="name">名前順</option>
      <option value="target">目標単価が高い順</option>
      <option value="remaining">残り枚数が多い順</option>
      <option value="added">追加した順</option>
    </select>
  </div>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if sorted.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">該当するカードがありません</p>
      <p class="mt-1 text-[10px] text-slate-500">カードを検索して追加してください</p>
      <button
        class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
        onclick={() => go('search')}
      >
        カードを検索
      </button>
    </div>
  {/if}

  <ul class="space-y-2">
    {#each sorted as row (row.id)}
      {@const rem = remaining(row)}
      <li class="rounded-xl bg-white border border-slate-200 p-3">
        <div class="flex items-start gap-2">
          <span
            class="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border"
            class:bg-rose-50={row.priority === 1}
            class:text-rose-700={row.priority === 1}
            class:border-rose-200={row.priority === 1}
            class:bg-amber-50={row.priority === 2}
            class:text-amber-700={row.priority === 2}
            class:border-amber-200={row.priority === 2}
            class:bg-slate-100={row.priority === 3}
            class:text-slate-600={row.priority === 3}
            class:border-slate-200={row.priority === 3}
          >
            {priorityLabel[row.priority]}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{row.card?.nameJa ?? '（不明なカード）'}</p>
            <p class="text-[10px] text-slate-500">カード名で管理（レアリティは店舗ごとの価格に付きます）</p>
          </div>
          <button
            class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
            aria-label="編集"
            onclick={() => (editing = { ...row })}
          >
            ✎
          </button>
        </div>

        <div class="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
          <span>欲しい <b class="text-[13px] text-slate-900">{row.qtyWanted}</b></span>
          <span>購入済 <b class="text-[13px] text-slate-900">{bought[row.cardId] ?? 0}</b></span>
          <span class="ml-auto">残り <b class="text-[13px] text-emerald-700">{rem}</b> 枚</span>
        </div>

        <div class="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full bg-emerald-500"
            style="width: {Math.min(100, ((bought[row.cardId] ?? 0) / row.qtyWanted) * 100)}%"
          ></div>
        </div>

        <div class="mt-2 flex items-center gap-2">
          <span class="text-[10px] text-slate-500">目標 ¥{(row.targetPrice ?? 0).toLocaleString('ja-JP')}</span>
          <button
            class="ml-auto h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700"
            onclick={() => go('compare')}
          >
            価格を見る
          </button>
        </div>
      </li>
    {/each}
  </ul>

  {#if done.length && filter !== 'done'}
    <button
      class="w-full h-10 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-500"
      onclick={() => (filter = 'done')}
    >
      達成済み {done.length} 件を見る
    </button>
  {/if}
</section>

{#if editing}
  <div class="fixed inset-0 z-50 bg-slate-900/40" onclick={() => (editing = null)} role="presentation">
    <div
      class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-white rounded-t-2xl p-4 space-y-3"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="flex items-center justify-between">
        <p class="text-[13px] font-bold text-slate-900 truncate">{editing.card?.nameJa}</p>
        <button class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[12px]" onclick={() => (editing = null)}>
          ✕
        </button>
      </div>

      <div>
        <p class="text-[10px] text-slate-500 mb-1">優先度</p>
        <div class="grid grid-cols-3 gap-0.5 rounded-lg bg-slate-200 p-0.5">
          {#each [1, 2, 3] as p (p)}
            <button
              class="h-9 rounded-md text-[11px] font-bold"
              class:bg-white={editing.priority === p}
              class:text-slate-900={editing.priority === p}
              class:text-slate-500={editing.priority !== p}
              onclick={() => editing && (editing.priority = p as Priority)}
            >
              {priorityLabel[p]}
            </button>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[10px] text-slate-500">欲しい枚数</span>
          <input
            class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
            type="number"
            min="1"
            bind:value={editing.qtyWanted}
          />
        </label>
        <label class="block">
          <span class="text-[10px] text-slate-500">目標単価（円）</span>
          <input
            class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
            type="number"
            min="0"
            bind:value={editing.targetPrice}
          />
        </label>
      </div>

      <label class="block">
        <span class="text-[10px] text-slate-500">メモ</span>
        <input
          class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]"
          placeholder="例: 再録待ち"
          bind:value={editing.memo}
        />
      </label>

      <div class="grid grid-cols-3 gap-2 pt-1">
        <button
          class="h-11 rounded-xl border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700"
          onclick={() => remove(editing!)}
        >
          削除
        </button>
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
