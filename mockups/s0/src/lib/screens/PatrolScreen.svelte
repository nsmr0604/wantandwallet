<script>
  import { wishItems, stores, yen } from '../sample.js';
  let { go } = $props();

  let storeId = $state(1);
  let sortMode = $state('priority');
  let index = $state(0);
  let price = $state('1180');

  // 店舗は「最後に訪れた順」。選択するたびに先頭へ来る
  let visitClock = $state(Math.max(...stores.map((s) => s.lastVisited || 0)));
  let storeList = $state(stores.map((s) => ({ ...s })));
  let addOpen = $state(false);
  let newName = $state('');

  const orderedStores = $derived(
    [...storeList].sort(
      (a, b) => (b.lastVisited || 0) - (a.lastVisited || 0) || Number(b.favorite) - Number(a.favorite),
    ),
  );

  const selectStore = (id) => {
    storeId = id;
    visitClock += 1;
    const s = storeList.find((x) => x.id === id);
    if (s) s.lastVisited = visitClock;
  };

  const addStore = () => {
    const name = newName.trim();
    if (!name) return;
    visitClock += 1;
    const s = { id: Date.now(), name, kind: 'store', favorite: false, lastVisited: visitClock };
    storeList.push(s);
    storeId = s.id;
    newName = '';
    addOpen = false;
  };

  const collator = new Intl.Collator('ja', { numeric: true });
  const rank = { monster: 1, extra: 2, spell: 3, trap: 4, other: 5 };
  const groupLabel = { monster: 'モンスター', extra: 'エクストラ', spell: '魔法', trap: '罠', other: 'その他' };

  // 達成済み（残り 0 枚）は巡回対象から外す
  const active = $derived(wishItems.filter((w) => w.wanted - w.bought > 0));

  const ordered = $derived(
    [...active].sort((a, b) =>
      sortMode === 'priority'
        ? a.priority - b.priority || a.id - b.id
        : (rank[a.group] - rank[b.group]) || collator.compare(a.kana || a.name, b.kana || b.name),
    ),
  );

  const item = $derived(ordered[index % ordered.length]);
  const nextItems = $derived(ordered.slice(index + 1, index + 4));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

  const press = (k) => {
    if (k === '⌫') price = price.slice(0, -1);
    else if (k === '00') price = price === '' ? '0' : price + '00';
    else price = (price === '0' ? '' : price) + k;
  };

  const next = () => {
    index = (index + 1) % ordered.length;
    price = '';
  };

  const changeSort = (mode) => {
    sortMode = mode;
    index = 0;
    price = '';
  };
</script>

<section class="space-y-3">
  <!-- 店舗選択 -->
  <div>
    <div class="flex items-center justify-between mb-1">
      <p class="text-[11px] font-bold text-slate-500">いまいる店舗</p>
      <p class="text-[10px] text-slate-400">最後に訪れた順</p>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="relative flex-1 min-w-0">
        <div class="flex gap-1.5 overflow-x-auto pb-1 pr-4">
          {#each orderedStores as s (s.id)}
            <button
              class="shrink-0 h-9 px-3 rounded-full border text-[11px] font-medium"
              class:bg-slate-900={storeId === s.id}
              class:text-white={storeId === s.id}
              class:border-slate-900={storeId === s.id}
              class:bg-white={storeId !== s.id}
              class:text-slate-600={storeId !== s.id}
              class:border-slate-200={storeId !== s.id}
              onclick={() => selectStore(s.id)}
            >
              {s.name}
            </button>
          {/each}
        </div>
        <!-- 横スクロールできることを示す右端のフェード -->
        <div class="pointer-events-none absolute right-0 top-0 h-9 w-6 bg-gradient-to-l from-slate-50 to-transparent"></div>
      </div>
      <button
        class="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm"
        aria-label="新店舗を追加"
        onclick={() => (addOpen = !addOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>

    {#if addOpen}
      <div class="mt-1.5 rounded-xl bg-white border border-slate-200 p-2 flex items-center gap-1.5">
        <input
          class="flex-1 min-w-0 h-9 px-2 rounded-lg border border-slate-300 text-[12px] outline-none focus:border-emerald-500"
          placeholder="店舗名（例: 横浜 F 店）"
          bind:value={newName}
          onkeydown={(e) => e.key === 'Enter' && addStore()}
        />
        <button class="shrink-0 h-9 px-3 rounded-lg bg-slate-900 text-white text-[11px] font-bold" onclick={addStore}>追加</button>
        <button class="shrink-0 h-9 px-2 rounded-lg border border-slate-300 text-[11px] text-slate-500" onclick={() => (addOpen = false)}>✕</button>
      </div>
    {/if}
  </div>

  <!-- 並び順 -->
  <div>
    <div class="flex items-center justify-between mb-1">
      <p class="text-[11px] font-bold text-slate-500">並び順</p>
      <p class="text-[10px] text-slate-400">
        {sortMode === 'priority' ? '買いたい順（高→低）' : '店舗の陳列順（種類→名前）'}
      </p>
    </div>
    <div class="grid grid-cols-2 gap-0.5 rounded-xl bg-slate-200 p-0.5">
      <button
        class="h-9 rounded-lg text-[11px] font-bold"
        class:bg-white={sortMode === 'priority'}
        class:text-slate-900={sortMode === 'priority'}
        class:text-slate-500={sortMode !== 'priority'}
        class:shadow-sm={sortMode === 'priority'}
        onclick={() => changeSort('priority')}
      >
        優先度順
      </button>
      <button
        class="h-9 rounded-lg text-[11px] font-bold"
        class:bg-white={sortMode === 'typeName'}
        class:text-slate-900={sortMode === 'typeName'}
        class:text-slate-500={sortMode !== 'typeName'}
        class:shadow-sm={sortMode === 'typeName'}
        onclick={() => changeSort('typeName')}
      >
        種類→名前順
      </button>
    </div>
    <p class="mt-1 text-[10px] text-slate-400">
      対象 {ordered.length} 枚（達成済みは除外）
    </p>
  </div>

  <!-- 進捗 -->
  <div class="flex items-center gap-2 px-1">
    <div class="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div class="h-full bg-emerald-500" style="width: {((index + 1) / ordered.length) * 100}%"></div>
    </div>
    <span class="text-[10px] text-slate-500">{index + 1} / {ordered.length}</span>
  </div>

  <!-- 対象カード -->
  {#if item}
  <div class="rounded-2xl bg-white border border-slate-200 p-4">
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{groupLabel[item.group]}</span>
      <span class="text-[10px] text-slate-500">残り {item.wanted - item.bought} 枚</span>
    </div>
    <p class="mt-1 text-[17px] font-bold text-slate-900 leading-snug">{item.name}</p>
    <p class="text-[10px] text-slate-500">{item.typeLabel}</p>
    <div class="mt-1.5 flex items-center gap-2">
      <button class="h-7 px-2 rounded-md border border-slate-300 text-[10px] font-medium text-slate-600">
        レアリティ: {item.rarity || '指定なし（任意）'}
      </button>
      <p class="ml-auto text-[11px] text-slate-500">目標 {yen(item.target)}</p>
    </div>
  </div>
  {:else}
    <div class="rounded-2xl bg-white border border-slate-200 p-4 text-[12px] text-slate-500">
      欲しいカードがありません。欲しいリストに追加してください。
    </div>
  {/if}

  <!-- 価格表示 -->
  <div class="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-baseline justify-between">
    <span class="text-[11px] text-slate-300">価格</span>
    <span class="text-[34px] font-bold leading-none tracking-tight">
      <span class="text-[18px] font-medium text-slate-300 mr-0.5">¥</span>{price === '' ? '0' : Number(price).toLocaleString('ja-JP')}
    </span>
  </div>

  <!-- テンキー -->
  <div class="grid grid-cols-3 gap-2">
    {#each keys as k (k)}
      <button
        class="h-14 rounded-xl bg-white border border-slate-200 text-[18px] font-bold text-slate-800 active:bg-slate-100"
        onclick={() => press(k)}
      >
        {#if k === '⌫'}
          <span class="flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6H9l-6 6 6 6h11z" /><path d="m13 10 4 4M17 10l-4 4" />
            </svg>
          </span>
        {:else}
          {k}
        {/if}
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-3 gap-2">
    <button class="col-span-1 h-12 rounded-xl border border-slate-300 bg-white text-[12px] font-bold text-slate-600" onclick={next}>
      在庫なし
    </button>
    <button class="col-span-2 h-12 rounded-xl bg-emerald-600 text-white text-[13px] font-bold active:bg-emerald-700" onclick={next}>
      保存して次へ
    </button>
  </div>

  <!-- 次のカード（並び順の効果が見えるように） -->
  {#if nextItems.length}
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <p class="text-[10px] font-bold text-slate-500">次の {nextItems.length} 件（{sortMode === 'priority' ? '優先度順' : '種類→名前順'}）</p>
      <ul class="mt-1 divide-y divide-slate-100">
        {#each nextItems as n (n.id)}
          <li class="py-1.5 flex items-center gap-2">
            <span class="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{groupLabel[n.group]}</span>
            <span class="text-[11px] text-slate-800 truncate">{n.name}</span>
            <span class="ml-auto text-[9px] text-slate-400 shrink-0">優先度 {n.priority}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="rounded-xl bg-amber-50 border border-amber-200 p-3">
    <p class="text-[11px] font-bold text-amber-900">この画面の確認ポイント（S2 の予習）</p>
    <ul class="mt-1 text-[11px] text-amber-900 list-disc pl-4 space-y-0.5">
      <li>切替が片手で届き、押したことが分かるか</li>
      <li>種類→名前順が店舗の陳列と一致するか（モンスター→エクストラ→魔法→罠）</li>
      <li>店頭で片手・10 秒以内に入力できるか</li>
      <li>「保存して次へ」が親指で届くか</li>
    </ul>
  </div>
</section>
