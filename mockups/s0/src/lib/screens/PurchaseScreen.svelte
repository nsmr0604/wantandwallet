<script>
  import { shop, setTab, openDetail, markPurchased, entryTotal, blankDraft, sealedSummary } from '../store.svelte.js';
  import { money } from '../sample.js';

  let { go } = $props();

  const bought = $derived(shop.entries.filter((e) => e.status === 'bought'));
  const reserved = $derived(shop.entries.filter((e) => e.status === 'reserved'));
  const spent = $derived(bought.reduce((s, e) => s + entryTotal(e), 0));
  const reservedTotal = $derived(reserved.reduce((s, e) => s + entryTotal(e), 0));
  const list = $derived(shop.tab === 'all' ? shop.entries : shop.entries.filter((e) => e.status === shop.tab));

  const open = (id) => {
    openDetail(id);
    go('purchase-detail');
  };

  const start = () => {
    blankDraft('single');
    go('purchase-form');
  };
</script>

<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <p class="text-[11px] text-slate-500">11月の購入</p>
    <p class="text-[22px] font-bold text-slate-900 leading-none mt-1">{money(spent)}</p>
    <p class="text-[10px] text-slate-500 mt-1">
      {bought.length} 件・予約中 {money(reservedTotal)}（{reserved.length} 件）
    </p>
    <button
      class="mt-3 w-full h-10 rounded-lg bg-emerald-600 text-white text-[12px] font-bold"
      onclick={start}
    >
      ＋ 購入・予約を記録
    </button>
  </div>

  <div class="grid grid-cols-3 gap-0.5 rounded-xl bg-slate-200 p-0.5">
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={shop.tab === 'all'} class:text-slate-900={shop.tab === 'all'} class:text-slate-500={shop.tab !== 'all'}
      onclick={() => setTab('all')}
    >
      すべて {shop.entries.length}
    </button>
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={shop.tab === 'reserved'} class:text-slate-900={shop.tab === 'reserved'} class:text-slate-500={shop.tab !== 'reserved'}
      onclick={() => setTab('reserved')}
    >
      予約中 {reserved.length}
    </button>
    <button
      class="h-9 rounded-lg text-[11px] font-bold"
      class:bg-white={shop.tab === 'bought'} class:text-slate-900={shop.tab === 'bought'} class:text-slate-500={shop.tab !== 'bought'}
      onclick={() => setTab('bought')}
    >
      購入済 {bought.length}
    </button>
  </div>

  {#if list.length === 0}
    <p class="text-center text-[11px] text-slate-400 py-8">該当する記録がありません</p>
  {/if}

  <ul class="space-y-2">
    {#each list as e (e.id)}
      <li class="rounded-xl bg-white border p-3" class:border-amber-200={e.status === 'reserved'} class:border-slate-200={e.status !== 'reserved'}>
        <button class="w-full text-left" onclick={() => open(e.id)}>
          <div class="flex items-start gap-2">
            <span class="text-[10px] text-slate-400 w-9 shrink-0 pt-0.5">{e.status === 'reserved' ? e.reservedAt : e.date}</span>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-bold text-slate-900 truncate">{e.name}</p>
              <p class="text-[10px] text-slate-500">
                {sealedSummary(e)}{e.rarity ? ' / ' + e.rarity : ''}・{e.store || '店舗なし'}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-bold text-slate-900">{money(entryTotal(e))}</p>
              {#if e.status === 'reserved'}
                <span class="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">予約中</span>
              {/if}
            </div>
          </div>
          <div class="mt-1.5 flex items-center gap-1.5 pl-11">
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{e.category}</span>
            <span class="text-[10px] text-slate-500">単価 {money(e.unitPrice)} × {e.qty}</span>
            {#if e.shipping > 0}
              <span class="text-[10px] text-slate-500">＋送料 {money(e.shipping)}</span>
            {/if}
            {#if e.expectedAt}
              <span class="text-[10px] text-amber-800 ml-auto">{e.expectedAt.replaceAll('-', '/')} 発売</span>
            {/if}
          </div>
        </button>
        {#if e.status === 'reserved'}
          <div class="mt-2 pl-11">
            <button
              class="h-8 px-3 rounded-lg bg-amber-900 text-white text-[10px] font-bold"
              onclick={() => markPurchased(e.id)}
            >
              発売したので購入済みにする
            </button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  <p class="px-1 text-[10px] text-slate-400">
    行をタップすると詳細（編集・削除）へ。予約を購入済みにしても合計金額は変わりません。
  </p>
</section>
