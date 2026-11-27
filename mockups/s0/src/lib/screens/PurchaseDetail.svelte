<script>
  import { shop, selectedEntry, markPurchased, deleteEntry, draftFromEntry, sealedSummary, entryTotal } from '../store.svelte.js';
  import { money } from '../sample.js';

  let { go } = $props();

  const e = $derived(selectedEntry());

  const edit = () => {
    draftFromEntry(e);
    go('purchase-form');
  };

  const remove = () => {
    deleteEntry(e.id);
    go('purchase');
  };

  const mark = () => {
    markPurchased(e.id);
  };
</script>

{#if e}
<section class="space-y-3">
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded" class:bg-amber-100={e.status === 'reserved'} class:text-amber-900={e.status === 'reserved'} class:bg-emerald-100={e.status !== 'reserved'} class:text-emerald-800={e.status !== 'reserved'}>
        {e.status === 'reserved' ? '予約中' : '購入済み'}
      </span>
      <span class="text-[10px] text-slate-500">{sealedSummary(e)}・{e.category}</span>
    </div>
    <p class="mt-1.5 text-[17px] font-bold text-slate-900 leading-snug">{e.name}</p>
    <p class="text-[11px] text-slate-500">{e.store || '店舗なし'}{e.rarity ? ' / ' + e.rarity : ''}</p>

    <dl class="mt-3 divide-y divide-slate-100 border-t border-slate-100">
      <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">単価</dt><dd class="text-slate-900">{money(e.unitPrice)}</dd></div>
      <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">数量</dt><dd class="text-slate-900">{e.qty}{e.unit === 'box' ? ' BOX' : e.itemType === 'sealed' ? ' パック' : ' 枚'}</dd></div>
      {#if e.itemType === 'sealed'}
        <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">購入パック数</dt><dd class="text-slate-900">{e.totalPacks || e.qty} パック</dd></div>
      {/if}
      <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">送料</dt><dd class="text-slate-900">{money(e.shipping)}</dd></div>
      <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">{e.status === 'reserved' ? '予約日' : '購入日'}</dt><dd class="text-slate-900">{e.status === 'reserved' ? e.reservedAt : e.date}</dd></div>
      {#if e.expectedAt}
        <div class="py-1.5 flex justify-between text-[11px]"><dt class="text-slate-500">発売日</dt><dd class="text-slate-900">{e.expectedAt.replaceAll('-', '/')}</dd></div>
      {/if}
    </dl>

    <div class="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
      <span class="text-[11px] text-slate-500">合計</span>
      <span class="text-[20px] font-bold text-slate-900">{money(entryTotal(e))}</span>
    </div>
  </div>

  {#if e.status === 'reserved'}
    <div class="rounded-2xl bg-amber-50 border border-amber-200 p-3">
      <p class="text-[11px] font-bold text-amber-900">発売後に購入済みへ</p>
      <p class="text-[10px] text-amber-800 mt-0.5">購入済みにすると予算グラフの黄色（予約）が緑（購入）へ移ります。金額は変わりません。</p>
      <button class="mt-2 w-full h-10 rounded-lg bg-amber-900 text-white text-[12px] font-bold" onclick={mark}>
        購入済みにする
      </button>
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-2">
    <button class="h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-700" onclick={edit}>編集</button>
    <button class="h-11 rounded-xl border border-rose-200 bg-rose-50 text-[12px] font-bold text-rose-700" onclick={remove}>削除</button>
  </div>

  <button class="w-full h-10 rounded-xl text-[11px] text-slate-500 underline underline-offset-2" onclick={() => go('purchase')}>
    購入一覧へ戻る
  </button>
</section>
{:else}
  <p class="text-[12px] text-slate-500">記録が見つかりません。</p>
  <button class="mt-2 h-10 px-3 rounded-lg bg-slate-900 text-white text-[12px] font-bold" onclick={() => go('purchase')}>購入画面へ戻る</button>
{/if}
