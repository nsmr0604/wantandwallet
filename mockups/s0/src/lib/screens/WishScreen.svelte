<script>
  import { wishItems, yen } from '../sample.js';
  let { go } = $props();

  const priorityLabel = { 1: '高', 2: '中', 3: '低' };
  const priorityClass = {
    1: 'bg-rose-50 text-rose-700 border-rose-200',
    2: 'bg-amber-50 text-amber-700 border-amber-200',
    3: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const active = $derived(wishItems.filter((w) => w.wanted - w.bought > 0));
  const done = $derived(wishItems.filter((w) => w.wanted - w.bought === 0));
</script>

<section class="space-y-3">
  <button
    class="w-full h-11 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-[12px] font-bold flex items-center justify-center gap-1.5"
    onclick={() => go('search')}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14" /></svg>
    欲しいカードを追加（検索）
  </button>

  <div class="flex gap-1.5 overflow-x-auto pb-1">
    <button class="shrink-0 h-8 px-3 rounded-full bg-slate-900 text-white text-[11px] font-bold">すべて {wishItems.length}</button>
    <button class="shrink-0 h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600">優先度 高</button>
    <button class="shrink-0 h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600">新弾</button>
    <button class="shrink-0 h-8 px-3 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600">シングル</button>
  </div>

  <ul class="space-y-2">
    {#each active as w (w.id)}
      <li class="rounded-xl bg-white border border-slate-200 p-3">
        <div class="flex items-start gap-2">
          <span class="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border {priorityClass[w.priority]}">
            {priorityLabel[w.priority]}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 truncate">{w.name}</p>
            <p class="text-[10px] text-slate-500">{w.code} / {w.rarity}</p>
          </div>
          <button class="text-slate-400" aria-label="メニュー">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>

        <div class="mt-2 flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500">欲しい</span>
            <span class="text-[13px] font-bold text-slate-900">{w.wanted}</span>
            <span class="text-[10px] text-slate-500">枚</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500">購入済</span>
            <span class="text-[13px] font-bold text-slate-900">{w.bought}</span>
          </div>
          <div class="ml-auto flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500">目標</span>
            <span class="text-[12px] font-bold text-slate-900">{yen(w.target)}</span>
          </div>
        </div>

        <div class="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full bg-emerald-500" style="width: {(w.bought / w.wanted) * 100}%"></div>
        </div>
        <div class="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>残り {w.wanted - w.bought} 枚</span>
          <button class="text-emerald-700 font-bold underline underline-offset-2" onclick={() => go('compare')}>
            価格を見る
          </button>
        </div>
      </li>
    {/each}
  </ul>

  {#if done.length}
    <div>
      <p class="px-1 pt-2 pb-1 text-[11px] font-bold text-slate-400">達成済み {done.length} 件</p>
      <ul class="space-y-1.5">
        {#each done as w (w.id)}
          <li class="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center gap-2 opacity-70">
            <span class="text-[13px] line-through text-slate-500 truncate">{w.name}</span>
            <span class="ml-auto text-[10px] text-slate-500">{w.wanted} 枚</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
