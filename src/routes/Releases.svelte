<script lang="ts">
  import { onMount } from 'svelte';
  import { go } from '../lib/router.svelte';
  import { daysUntil, past, upcoming, type ReleaseProduct } from '../lib/domain/releases';
  import { draftFromRelease, setPendingDraft } from '../lib/purchaseDraft.svelte';

  let products = $state<ReleaseProduct[]>([]);
  let loading = $state(true);
  let error = $state('');
  let showPast = $state(false);

  onMount(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/releases.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { products: ReleaseProduct[] };
      products = json.products ?? [];
    } catch {
      error =
        '新弾データがありません。scripts/fetch-releases.mjs で public/data/releases.json を生成してください。';
    } finally {
      loading = false;
    }
  });

  const up = $derived(upcoming(products));
  const old = $derived(past(products).slice(0, 8));

  const priceLabel = (p: ReleaseProduct) => {
    if (p.price == null) return '定価未取得';
    const unit = p.priceUnit === 'box' ? '1BOX' : p.priceUnit === 'pack' ? '1パック' : '';
    return `${unit} ¥${p.price.toLocaleString('ja-JP')}`;
  };

  const startReserve = (p: ReleaseProduct) => {
    setPendingDraft(draftFromRelease(p));
    go('purchase');
  };
</script>

<section class="space-y-3">
  <div class="flex items-center justify-between px-1">
    <p class="text-[11px] font-bold text-slate-500">今後の新弾 {up.length} 件</p>
    <span class="text-[9px] text-slate-400">
      {products.length ? `${new Date().getFullYear()}年` : ''}
    </span>
  </div>

  {#if loading}
    <p class="text-center text-[11px] text-slate-400 py-8">読み込み中…</p>
  {:else if error}
    <p class="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[10px] text-amber-900">
      {error}
    </p>
  {:else if up.length === 0}
    <p class="rounded-xl bg-white border border-dashed border-slate-300 p-6 text-center text-[11px] text-slate-500">
      今後の新弾がありません。データを更新してください（npm run fetch:releases）。
    </p>
  {/if}

  <ul class="space-y-2">
    {#each up as p (p.name + p.date)}
      {@const days = daysUntil(p.date)}
      <li class="rounded-2xl bg-white border border-slate-200 p-3">
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-[12px] font-bold text-slate-900 leading-snug">{p.nameJa || p.name}</p>
            <p class="mt-0.5 text-[10px] text-slate-500">
              {#if p.nameJa && p.nameJa !== p.name}<span class="text-slate-400">{p.name}・</span>{/if}
              {p.date.replaceAll('-', '/')}・{p.category || p.kind}
            </p>
            <p class="mt-1 text-[11px] text-slate-700">
              {priceLabel(p)}
              {#if p.packsPerBox}<span class="text-slate-500">（{p.packsPerBox}パック入り）</span>{/if}
              {#if p.cardsPerPack}<span class="text-slate-400">・{p.cardsPerPack}枚入り</span>{/if}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <span class="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
              {days === 0 ? '今日' : `あと ${days} 日`}
            </span>
            <button
              class="mt-2 block w-full h-8 px-2 rounded-lg border border-emerald-600 text-[10px] font-bold text-emerald-700"
              onclick={() => startReserve(p)}
            >
              予約する
            </button>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  {#if old.length}
    <button
      class="w-full h-9 rounded-lg border border-slate-200 bg-white text-[10px] text-slate-500"
      onclick={() => (showPast = !showPast)}
    >
      発売済み {past(products).length} 件を{showPast ? '隠す' : '見る'}
    </button>
    {#if showPast}
      <ul class="space-y-1.5">
        {#each old as p (p.name + p.date)}
          <li class="rounded-xl bg-slate-100 border border-slate-200 p-2.5 opacity-80">
            <p class="text-[10px] text-slate-600 truncate">{p.name}</p>
            <p class="text-[9px] text-slate-400">{p.date.replaceAll('-', '/')}・{p.kind}</p>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  <p class="px-1 text-[9px] text-slate-400">
    出典: 遊戯王OCG 公式商品ページ（発売日・定価・パック数）。予約は購入画面に引き継がれます。
  </p>
</section>
