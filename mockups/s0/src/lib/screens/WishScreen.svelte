<script>
  import { stores, yen, money } from '../sample.js';
  import {
    shop, wishBought, wishRemaining, updateWish, removeWish, draftFromCard,
    latestPrices, bestPrice, addPrice, pricesByStore,
  } from '../store.svelte.js';
  import { RARITIES, rarityLabel } from '../rarity.js';

  let { go } = $props();

  const priorityLabel = { 1: '高', 2: '中', 3: '低' };
  const priorityClass = {
    1: 'bg-rose-50 text-rose-700 border-rose-200',
    2: 'bg-amber-50 text-amber-700 border-amber-200',
    3: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  let editing = $state(null);
  let priceEditing = $state(null);

  const filterLabel = { all: 'すべて', high: '優先度 高', mid: '優先度 中', low: '優先度 低', done: '達成済み' };

  const visible = $derived(
    shop.wish.filter((w) => {
      const rem = wishRemaining(w);
      if (shop.wishFilter === 'done') return rem === 0;
      if (rem === 0) return false;
      if (shop.wishFilter === 'high') return w.priority === 1;
      if (shop.wishFilter === 'mid') return w.priority === 2;
      if (shop.wishFilter === 'low') return w.priority === 3;
      return true;
    }),
  );

  const collator = new Intl.Collator('ja', { numeric: true });
  const sorted = $derived(
    [...visible].sort((a, b) => {
      if (shop.wishSort === 'name') return collator.compare(a.name, b.name);
      if (shop.wishSort === 'target') return (b.target || 0) - (a.target || 0);
      if (shop.wishSort === 'remaining') return wishRemaining(b) - wishRemaining(a);
      if (shop.wishSort === 'added') return a.createdAt - b.createdAt;
      return a.priority - b.priority || a.createdAt - b.createdAt;
    }),
  );

  const active = $derived(shop.wish.filter((w) => wishRemaining(w) > 0));
  const done = $derived(shop.wish.filter((w) => wishRemaining(w) === 0));
  const totalRemaining = $derived(active.reduce((s, w) => s + wishRemaining(w), 0));
  const targetTotal = $derived(active.reduce((s, w) => s + (w.target || 0) * wishRemaining(w), 0));

  const openEdit = (w) => {
    editing = { ...w };
  };

  const saveEdit = () => {
    if (!editing) return;
    updateWish({
      ...editing,
      wanted: Math.max(1, Number(editing.wanted) || 1),
      target: Math.max(0, Number(editing.target) || 0),
    });
    editing = null;
  };

  const recordBuy = (w) => {
    const best = bestPrice(w.name);
    draftFromCard({
      name: w.name,
      price: best?.price ?? w.target ?? 0,
      store: best?.store ?? '秋葉原 A 店',
      rarity: best?.rarity ?? '',
    });
    go('purchase-form');
  };

  const openPrice = (w) => {
    const best = bestPrice(w.name);
    priceEditing = {
      name: w.name,
      store: best?.store ?? stores[0].name,
      rarity: best?.rarity ?? '',
      price: best?.price ?? 0,
    };
  };

  // 選択中の店舗に登録済みのレアリティ（タップで編集）
  const existingAtStore = $derived(
    priceEditing
      ? latestPrices(priceEditing.name).filter((p) => p.store === priceEditing.store)
      : [],
  );

  const isUpdate = $derived(
    !!priceEditing && existingAtStore.some((p) => p.rarity === priceEditing.rarity),
  );

  const savePrice = () => {
    if (!priceEditing) return;
    addPrice(priceEditing);
    priceEditing = null;
  };
</script>

<section class="space-y-3">
  <!-- サマリ -->
  <div class="rounded-2xl bg-slate-900 text-white p-4">
    <div class="flex items-baseline justify-between">
      <p class="text-[11px] text-slate-300">欲しいもの</p>
      <button class="text-[11px] text-slate-300 underline underline-offset-2" onclick={() => go('search')}>＋ 追加</button>
    </div>
    <div class="mt-2 grid grid-cols-3 gap-2">
      <div>
        <p class="text-[9px] text-slate-400">種類</p>
        <p class="text-[18px] font-bold leading-none">{active.length}<span class="text-[10px] font-medium text-slate-300 ml-0.5">件</span></p>
      </div>
      <div>
        <p class="text-[9px] text-slate-400">残り</p>
        <p class="text-[18px] font-bold leading-none">{totalRemaining}<span class="text-[10px] font-medium text-slate-300 ml-0.5">枚</span></p>
      </div>
      <div>
        <p class="text-[9px] text-slate-400">目標合計</p>
        <p class="text-[18px] font-bold leading-none">{money(targetTotal)}</p>
      </div>
    </div>
  </div>

  <!-- 絞り込み -->
  <div class="flex gap-1.5 overflow-x-auto pb-1">
    {#each Object.entries(filterLabel) as [key, label] (key)}
      <button
        class="shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium"
        class:bg-slate-900={shop.wishFilter === key} class:text-white={shop.wishFilter === key} class:border-slate-900={shop.wishFilter === key}
        class:bg-white={shop.wishFilter !== key} class:text-slate-600={shop.wishFilter !== key} class:border-slate-200={shop.wishFilter !== key}
        onclick={() => (shop.wishFilter = key)}
      >
        {label}
        {#if key === 'all'}<span class="ml-0.5 text-[9px] opacity-70">{active.length}</span>{/if}
        {#if key === 'done'}<span class="ml-0.5 text-[9px] opacity-70">{done.length}</span>{/if}
      </button>
    {/each}
  </div>

  <!-- 並べ替え -->
  <div class="flex items-center gap-2 px-1">
    <p class="text-[10px] text-slate-500 shrink-0">並べ替え</p>
    <select
      class="h-8 flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none"
      bind:value={shop.wishSort}
    >
      <option value="priority">優先度順</option>
      <option value="name">名前順</option>
      <option value="target">目標単価が高い順</option>
      <option value="remaining">残り枚数が多い順</option>
      <option value="added">追加した順</option>
    </select>
  </div>

  <!-- 一覧 -->
  {#if sorted.length === 0}
    <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p class="text-[12px] font-bold text-slate-700">該当するカードがありません</p>
      <p class="mt-1 text-[10px] text-slate-500">絞り込みを変えるか、カードを追加してください</p>
      <button class="mt-3 h-9 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold" onclick={() => go('search')}>
        カードを検索して追加
      </button>
    </div>
  {/if}

  <ul class="space-y-2">
    {#each sorted as w (w.id)}
      {@const rem = wishRemaining(w)}
      {@const groups = pricesByStore(w.name)}
      {@const best = bestPrice(w.name)}
      <li class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div class="p-3">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border {priorityClass[w.priority]}">
              {priorityLabel[w.priority]}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-bold text-slate-900 truncate">{w.name}</p>
              <p class="text-[10px] text-slate-500">カード名で管理（レアリティは店舗ごとの価格に付きます）</p>
            </div>
            <button class="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="編集" onclick={() => openEdit(w)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="m14 6 4 4" /></svg>
            </button>
          </div>

          <div class="mt-2 flex items-center gap-3">
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-slate-500">欲しい</span>
              <span class="text-[13px] font-bold text-slate-900">{w.wanted}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-slate-500">購入済</span>
              <span class="text-[13px] font-bold text-slate-900">{wishBought(w.name)}</span>
            </div>
            <div class="ml-auto text-right">
              <span class="text-[10px] text-slate-500">残り</span>
              <span class="text-[13px] font-bold text-emerald-700 ml-1">{rem}</span>
              <span class="text-[10px] text-slate-500">枚</span>
            </div>
          </div>

          <div class="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-emerald-500" style="width: {(wishBought(w.name) / w.wanted) * 100}%"></div>
          </div>

          <!-- 店舗ごとの価格（レアリティ付き） -->
          <div class="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[9px] text-slate-500">店舗別の価格（最新）</span>
              {#if w.target}
                <span class="text-[9px] text-slate-500">目標 {yen(w.target)}</span>
              {/if}
            </div>
            {#if groups.length}
              <ul class="mt-1 space-y-0.5">
                {#each groups.slice(0, 2) as g (g.store)}
                  <li class="flex items-center gap-1.5 text-[10px]">
                    <span class="text-slate-600 truncate">{g.store}</span>
                    <span class="text-[8px] text-slate-500 border border-slate-200 rounded px-1 shrink-0">{rarityLabel(g.list[0].rarity)}</span>
                    {#if g.list.length > 1}
                      <span class="text-[8px] text-slate-400 shrink-0">+{g.list.length - 1}</span>
                    {/if}
                    <span class="ml-auto font-bold shrink-0" class:text-emerald-700={best && g.cheapest === best.price} class:text-slate-800={!best || g.cheapest !== best.price}>{yen(g.cheapest)}</span>
                  </li>
                {/each}
              </ul>
              {#if groups.length > 2}
                <p class="mt-0.5 text-[9px] text-slate-400">ほか {groups.length - 2} 店舗</p>
              {/if}
              {#if best && w.target}
                {@const diff = w.target - best.price}
                <p class="mt-0.5 text-[9px] font-bold" class:text-emerald-700={diff >= 0} class:text-slate-400={diff < 0}>
                  {#if diff > 0}最安は目標より {yen(diff)} 安い{:else if diff === 0}最安は目標どおり{:else}最安でも目標より {yen(-diff)} 高い{/if}
                </p>
              {/if}
            {:else}
              <p class="mt-1 text-[9px] text-slate-400">価格が未登録です。店舗ごとに価格とレアリティを登録できます。</p>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
          <button class="h-10 text-[11px] font-bold text-slate-700 active:bg-slate-50" onclick={() => recordBuy(w)}>
            購入を記録
          </button>
          <button class="h-10 text-[11px] font-bold text-slate-700 active:bg-slate-50" onclick={() => openPrice(w)}>
            価格を登録
          </button>
          <button class="h-10 text-[11px] font-bold text-emerald-700 active:bg-emerald-50" onclick={() => go('compare')}>
            価格を見る
          </button>
        </div>
      </li>
    {/each}
  </ul>

  {#if done.length && shop.wishFilter !== 'done'}
    <button class="w-full h-10 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-500" onclick={() => (shop.wishFilter = 'done')}>
      達成済み {done.length} 件を見る
    </button>
  {/if}

  <p class="px-1 text-[10px] text-slate-400">
    欲しいものはカード名だけで管理します。レアリティと価格は「店舗ごと」に記録します。
  </p>
</section>

<!-- 編集シート（カード名・枚数・優先度・目標・メモ） -->
{#if editing}
  <div class="fixed inset-0 z-50 bg-slate-900/40" onclick={() => (editing = null)} role="presentation">
    <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-white rounded-t-2xl p-4 space-y-3" onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="flex items-center justify-between">
        <p class="text-[13px] font-bold text-slate-900 truncate">{editing.name}</p>
        <button class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[12px]" onclick={() => (editing = null)}>✕</button>
      </div>

      <div>
        <p class="text-[10px] text-slate-500 mb-1">優先度</p>
        <div class="grid grid-cols-3 gap-0.5 rounded-lg bg-slate-200 p-0.5">
          {#each [[1, '高'], [2, '中'], [3, '低']] as [p, label] (p)}
            <button
              class="h-9 rounded-md text-[11px] font-bold"
              class:bg-white={editing.priority === p} class:text-slate-900={editing.priority === p} class:text-slate-500={editing.priority !== p}
              onclick={() => (editing.priority = p)}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-[10px] text-slate-500">欲しい枚数</span>
          <div class="mt-0.5 flex items-center gap-1.5">
            <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => (editing.wanted = Math.max(1, editing.wanted - 1))}>−</button>
            <input class="w-full h-9 text-center rounded-lg border border-slate-300 text-[13px]" type="number" min="1" bind:value={editing.wanted} />
            <button class="w-8 h-9 rounded-lg border border-slate-300 text-[14px] font-bold text-slate-600" onclick={() => (editing.wanted = editing.wanted + 1)}>＋</button>
          </div>
        </label>
        <label class="block">
          <span class="text-[10px] text-slate-500">目標単価（円）</span>
          <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" type="number" min="0" bind:value={editing.target} />
        </label>
      </div>

      <label class="block">
        <span class="text-[10px] text-slate-500">メモ</span>
        <input class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 text-[13px]" placeholder="例: 再録待ち" bind:value={editing.memo} />
      </label>

      <p class="text-[9px] text-slate-400">レアリティは「価格を登録」で店舗ごとに設定します（期間限定は含みません）。</p>

      <div class="grid grid-cols-3 gap-2 pt-1">
        <button class="h-11 rounded-xl border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700" onclick={() => removeWish(editing.id)}>
          削除
        </button>
        <button class="h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={() => (editing = null)}>
          キャンセル
        </button>
        <button class="h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-bold" onclick={saveEdit}>
          保存
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- 価格登録シート（店舗 × レアリティ × 価格） -->
{#if priceEditing}
  <div class="fixed inset-0 z-50 bg-slate-900/40" onclick={() => (priceEditing = null)} role="presentation">
    <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] bg-white rounded-t-2xl p-4 space-y-3" onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="flex items-center justify-between">
        <div class="min-w-0">
          <p class="text-[10px] text-slate-500">価格を登録</p>
          <p class="text-[13px] font-bold text-slate-900 truncate">{priceEditing.name}</p>
        </div>
        <button class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[12px]" onclick={() => (priceEditing = null)}>✕</button>
      </div>

      <div>
        <p class="text-[10px] text-slate-500 mb-1">店舗</p>
        <div class="flex flex-wrap gap-1.5">
          {#each stores as s (s.id)}
            <button
              class="h-8 px-2.5 rounded-full border text-[10px] font-medium"
              class:bg-slate-900={priceEditing.store === s.name} class:text-white={priceEditing.store === s.name} class:border-slate-900={priceEditing.store === s.name}
              class:bg-white={priceEditing.store !== s.name} class:text-slate-600={priceEditing.store !== s.name} class:border-slate-200={priceEditing.store !== s.name}
              onclick={() => (priceEditing.store = s.name)}
            >
              {s.name}
            </button>
          {/each}
        </div>
      </div>

      {#if existingAtStore.length}
        <div class="rounded-lg bg-slate-50 border border-slate-200 p-2">
          <p class="text-[9px] text-slate-500">この店舗の登録済み（タップで編集）</p>
          <div class="mt-1 flex flex-wrap gap-1">
            {#each existingAtStore as p (p.id)}
              <button
                class="h-7 px-1.5 rounded-md border text-[9px] font-medium"
                class:border-emerald-400={priceEditing.rarity === p.rarity} class:bg-emerald-50={priceEditing.rarity === p.rarity}
                class:border-slate-200={priceEditing.rarity !== p.rarity} class:bg-white={priceEditing.rarity !== p.rarity}
                onclick={() => { priceEditing.rarity = p.rarity; priceEditing.price = p.price; }}
              >
                {rarityLabel(p.rarity)} {yen(p.price)}
              </button>
            {/each}
          </div>
          <p class="mt-1 text-[9px] text-slate-400">同じ店舗でもレアリティごとに別の価格を持てます</p>
        </div>
      {/if}

      <label class="block">
        <span class="text-[10px] text-slate-500">レアリティ（任意）</span>
        <select
          class="mt-0.5 w-full h-9 px-2 rounded-lg border border-slate-300 bg-white text-[12px] outline-none focus:border-emerald-500"
          bind:value={priceEditing.rarity}
        >
          {#each RARITIES as r (r.value)}
            <option value={r.value}>{r.label}</option>
          {/each}
        </select>
      </label>

      <label class="block">
        <span class="text-[10px] text-slate-500">価格（円）</span>
        <input class="mt-0.5 w-full h-10 px-2 rounded-lg border border-slate-300 text-[14px]" type="number" min="0" bind:value={priceEditing.price} />
      </label>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button class="h-11 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={() => (priceEditing = null)}>
          キャンセル
        </button>
        <button class="h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-bold" onclick={savePrice}>
          {isUpdate ? '更新する' : '登録する'}
        </button>
      </div>
      <p class="text-[9px] text-slate-400">
        {isUpdate ? '同じ店舗・同じレアリティの価格を最新として更新します。' : '同じ店舗・別のレアリティとして追加します。'}
      </p>
    </div>
  </div>
{/if}
