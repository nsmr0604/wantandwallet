<script lang="ts">
  import { onMount } from 'svelte';
  import { listCards, upsertManualCard } from '../lib/repositories/cards';
  import { upsertWish } from '../lib/repositories/wish';
  import { go } from '../lib/router.svelte';
  import type { Card } from '../lib/domain/types';

  let query = $state('');
  let results = $state<Card[]>([]);
  let message = $state('');

  async function run() {
    results = await listCards(query.trim(), 30);
  }

  onMount(run);

  async function add(card: Card) {
    await upsertWish({ cardId: card.id, qtyWanted: 1, priority: 2 });
    go('wish');
  }

  async function findOrCreate() {
    const name = query.trim();
    if (!name) {
      message = 'カード名を入力してください';
      return;
    }
    const card = await upsertManualCard(name);
    message = `「${card.nameJa}」を登録しました。下の一覧から追加できます。`;
    await run();
  }
</script>

<section class="space-y-3">
  <div class="relative">
    <input
      class="w-full h-11 px-3 rounded-xl bg-white border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
      placeholder="カード名で検索（日本語）"
      bind:value={query}
      oninput={run}
    />
  </div>

  <div class="flex items-center justify-between px-1">
    <p class="text-[10px] text-slate-500">
      {query ? `「${query}」の結果 ${results.length} 件` : `登録済み ${results.length} 件`}
    </p>
    <button class="text-[10px] text-slate-500 underline underline-offset-2" onclick={findOrCreate}>
      この名前で登録
    </button>
  </div>

  {#if message}
    <p class="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[10px] text-emerald-800">
      {message}
    </p>
  {/if}

  {#if results.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">カードが見つかりません</p>
      <p class="mt-1 text-[10px] text-slate-500">
        カードマスタの取り込みは S4 で実装します。今は「この名前で登録」で手入力してください。
      </p>
      <button
        class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
        onclick={findOrCreate}
      >
        この名前で登録
      </button>
    </div>
  {/if}

  <ul class="space-y-2">
    {#each results as card (card.id)}
      <li class="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-bold text-slate-900 truncate">{card.nameJa}</p>
          <p class="text-[10px] text-slate-500">
            {card.cardType ?? (card.source === 'manual' ? '手入力' : 'カード')}
          </p>
        </div>
        <button
          class="shrink-0 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
          onclick={() => add(card)}
        >
          ＋ 欲しい
        </button>
      </li>
    {/each}
  </ul>

  <button
    class="w-full h-9 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-600"
    onclick={() => go('wish')}
  >
    欲しいリストへ
  </button>
</section>
