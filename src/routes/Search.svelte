<script lang="ts">
  import { onMount } from 'svelte';
  import { listCards, upsertManualCard, upsertCardFromIndex } from '../lib/repositories/cards';
  import { upsertWish } from '../lib/repositories/wish';
  import { go } from '../lib/router.svelte';
  import { normalizeName } from '../lib/domain/text';
  import type { CardHit, IndexRow } from '../lib/domain/cardsIndex';
  import type { Card } from '../lib/domain/types';

  let query = $state('');
  let dbResults = $state<Card[]>([]);
  let prepared = $state<{ hit: CardHit; hay: string }[] | null>(null);
  let indexError = $state('');
  let indexLoading = $state(true);
  let message = $state('');

  async function runDb() {
    dbResults = await listCards(query.trim(), 30);
  }

  async function loadIndex() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/cards-index.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { cards: IndexRow[] };
      prepared = (json.cards ?? []).map((row) => ({
        hit: {
          konamiId: row[0] != null ? String(row[0]) : undefined,
          passcode: row[1] != null ? String(row[1]) : undefined,
          nameJa: row[2],
          nameEn: row[3],
          cardType: row[4],
          romaji: row[5],
          kana: row[6] ?? '',
        },
        hay: normalizeName(`${row[2]}${row[3]}${row[5]}${row[6] ?? ''}`),
      }));
    } catch {
      indexError =
        'カード索引がありません。scripts/build-card-index.mjs で public/data/cards-index.json を生成してください。';
    } finally {
      indexLoading = false;
    }
  }

  onMount(() => {
    runDb();
    loadIndex();
  });

  const q = $derived(normalizeName(query.trim()));

  const hits = $derived.by(() => {
    if (!prepared || !q) return [] as CardHit[];
    const starts: CardHit[] = [];
    const contains: CardHit[] = [];
    for (const p of prepared) {
      if (p.hay.startsWith(q)) starts.push(p.hit);
      else if (p.hay.includes(q)) contains.push(p.hit);
      if (starts.length >= 30) break;
    }
    return [...starts, ...contains].slice(0, 30);
  });

  const shownDb = $derived(q ? dbResults : dbResults.slice(0, 30));

  async function addHit(hit: CardHit) {
    const card = await upsertCardFromIndex(hit);
    await upsertWish({ cardId: card.id, qtyWanted: 1, priority: 2 });
    go('wish');
  }

  async function addDb(card: Card) {
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
    await runDb();
  }
</script>

<section class="space-y-3">
  <input
    class="w-full h-11 px-3 rounded-xl bg-white border border-slate-300 text-[13px] outline-none focus:border-emerald-500"
    placeholder="カード名で検索（日本語・かな・英語）"
    bind:value={query}
    oninput={runDb}
  />

  <div class="flex items-center justify-between px-1">
    <p class="text-[10px] text-slate-500">
      {#if indexLoading}
        カード索引を読み込み中…
      {:else if q}
        「{query}」の結果 {hits.length} 件
      {:else}
        登録済み {dbResults.length} 件
      {/if}
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

  {#if indexError && !prepared}
    <p class="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[10px] text-amber-900">
      {indexError}
    </p>
  {/if}

  {#if hits.length}
    <ul class="space-y-2">
      {#each hits as hit (hit.konamiId ?? hit.passcode ?? hit.nameJa)}
        <li class="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{hit.nameJa}</p>
            <p class="text-[10px] text-slate-500 truncate">{hit.cardType}・{hit.nameEn}</p>
          </div>
          <button
            class="shrink-0 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
            onclick={() => addHit(hit)}
          >
            ＋ 欲しい
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if shownDb.length}
    <div>
      <p class="px-1 pb-1 text-[10px] font-bold text-slate-400">登録済みのカード</p>
      <ul class="space-y-2">
        {#each shownDb as card (card.id)}
          <li class="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-bold text-slate-900 truncate">{card.nameJa}</p>
              <p class="text-[10px] text-slate-500">
                {card.cardType ?? (card.source === 'manual' ? '手入力' : 'カード')}
              </p>
            </div>
            <button
              class="shrink-0 h-9 px-3 rounded-lg border border-emerald-600 text-[11px] font-bold text-emerald-700"
              onclick={() => addDb(card)}
            >
              ＋ 欲しい
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if q && !indexLoading && hits.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">カードが見つかりません</p>
      <p class="mt-1 text-[10px] text-slate-500">「この名前で登録」で手入力できます。</p>
      <button
        class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
        onclick={findOrCreate}
      >
        この名前で登録
      </button>
    </div>
  {/if}

  <button
    class="w-full h-9 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-600"
    onclick={() => go('wish')}
  >
    欲しいリストへ
  </button>
</section>
